/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage locale information and synchronize changes as needed with database
  TODO: add GraphQL subscriptions to this somehow

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-LOCALES', 'TagCyan');
const DBG = true;

/// INITIALIZE STATE MANAGED BY THIS MODULE ///////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('locales');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
  locales: [],
  localeNames: [],
  localeID: 0,
  transform: {
    xRange: 1,
    yRange: 1,
    xOff: 0,
    yOff: 0,
    xScale: 1,
    yScale: 1,
    zRot: 0
  }
});

/// These are the primary methods you'll need to use to read and write
/// state on the behalf of code using APPCORE.
const { stateObj, getKey, updateKey } = STATE;
/// For handling state change subscribers, export these functions
const { subscribe, unsubcribe } = STATE;
/// For React components to send state changes, export this function
const { handleChange } = STATE;
/// For publishing state change, this can be used inside this module
/// DO NOT CALL THIS FROM OUTSIDE
const { _publishState } = STATE;
/// To allow outside code to modify state change requests on-the-fly,
/// export these functions
const { addChangeHook, deleteChangeHook } = STATE;

/// INTERCEPT STATE UPDATE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let AUTOTIMER;
let XFORM_CACHE = getKey('transform'); // initialize
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** intercept changes to locale.transform so we can cache the changes
 *  for later write to DB after some time has elapsed. Returns the modified
 *  values, if any, for subsequent update to GSTATE and publishState
 */
STATE.addChangeHook((key, propOrValue, propValue) => {
  /** handle transforms **/
  if (key === 'transform') {
    propValue = Number(propValue);
    XFORM_CACHE[propOrValue] = propValue;
    if (DBG) console.log(...PR('updated XFORM CACHE', XFORM_CACHE));
    // start async autosave
    if (AUTOTIMER) clearInterval(AUTOTIMER);
    AUTOTIMER = setInterval(() => {
      const id = getKey('localeId');
      if (DBG)
        console.log(...PR('autosaving transform', XFORM_CACHE, 'to id', id));
      UR.Query(
        `
            mutation LocalePTrack($id:Int $input:PTrackInput) {
              updatePTrack(localeId:$id,input:$input) {
                memo
              }
            }
          `,
        {
          input: XFORM_CACHE,
          id
        }
      ).then(response => {
        if (DBG) console.log(...PR('DB response', response));
      });
      clearInterval(AUTOTIMER);
      AUTOTIMER = 0;
    }, 1000);

    // return array if we have handled/modified this
    // this will automatically update local state immediately
    // return the entire transform to update React state properly
    return [key, XFORM_CACHE];
  }

  /** handle localeID **/
  if (key === 'localeID') {
    if (DBG) console.log(...PR(`updating localeID=${propOrValue}`));
    propOrValue = Number(propOrValue);
    // return array to rewrite strings to numbers
    return [key, propOrValue, propValue];
  }

  // otherwise return nothing to handle procesing normally
  return undefined;
});

/// ACCESSORS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies
export const LocaleNames = () => stateObj('localeNames');
export const Locales = () => stateObj('locales');
export const CurrentLocaleID = () => stateObj('localeID');
export const GetLocale = id => {
  // stateobj always returns entities as { [group]:{[ keys]:value } }
  const locales = getKey('locales'); // group:locales, key:locales
  return locales[id];
};
/// update
export const SetLocaleID = id => {
  updateKey('localeID', id);
};

/// DATABASE QUERIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function m_LoadLocaleInfo() {
  if (DBG) console.log(...PR('(1) GET LOCALE DATA'));
  const response = await UR.Query(`
    query {
      localeNames { id name }
      locales {
        id
        name
        ptrack {
          memo
          xRange
          yRange
          xOff
          yOff
          xScale
          yScale
          zRot
        }
      }
    }
  `);
  if (!response.errors) {
    const { localeNames, locales } = response.data;
    updateKey({ localeNames, locales });
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this needs to be made dynamic */
export async function LoadCurrentPTrack() {
  const localeID = stateObj('localeID');
  if (DBG) console.log(...PR('(2) GET LOCALE DATA FOR DEFAULT ID', localeID));
  const response = await UR.Query(
    `
    query GetPtrackTransform($id:Int!) {
      locale(id:$id) {
        id
        name
        ptrack {
          ...TransformParts
        }
      }
    }
    fragment TransformParts on PTrackProps {
      xRange
      yRange
      xOff
      yOff
      xScale
      yScale
      zRot
    }
  `,
    { id: localeID }
  );
  return response.data.locale;
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// for loading data structures
UR.HookPhase(
  'UR/LOAD_DB',
  () =>
    new Promise((resolve, reject) => {
      m_LoadLocaleInfo();
      resolve();
    })
);