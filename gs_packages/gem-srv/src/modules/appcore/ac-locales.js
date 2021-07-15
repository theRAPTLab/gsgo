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
  localeId: 3,
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
/** Intercept changes to locale.transform so we can cache the changes
 *  for later write to DB after some time has elapsed. Returns the modified
 *  values, if any, for subsequent update to GSTATE and publishState
 */
function hook_Filter(key, propOrValue, propValue) {
  if (key === 'transform') return [key, propOrValue, Number(propValue)];
  if (key === 'localeId') return [key, Number(propOrValue)];
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Optionally fire once all state change hooks have been processed.
 *  This is provided as the second arg of addChangeHook()
 */
function hook_Effect(key, propOrValue, propValue) {
  /** handle transforms **/
  if (key === 'transform') {
    XFORM_CACHE = getKey('transform');
    propValue = Number(propValue);
    XFORM_CACHE[propOrValue] = propValue;
    if (DBG) console.log(...PR(`XFORM_CACHE[${propOrValue}]`, XFORM_CACHE));
    // start async autosave
    if (AUTOTIMER) clearInterval(AUTOTIMER);
    AUTOTIMER = setInterval(() => {
      const id = getKey('localeId');
      if (DBG)
        console.log(...PR('autosaving transform', XFORM_CACHE, 'to id', id));
      UR.Mutate(
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
    console.log(...PR('transform', key, XFORM_CACHE));
    return [key, XFORM_CACHE];
  }

  /** handle localeId **/
  if (key === 'localeId') {
    if (DBG) console.log(...PR(`updating localeId=${propOrValue}`));
    propOrValue = Number(propOrValue);
    const { ptrack } = GetLocale(propOrValue);
    updateKey('transform', ptrack);
    // return array to rewrite strings to numbers
    return [key, propOrValue, propValue];
  }

  // otherwise return nothing to handle procesing normally
  return undefined;
}
STATE.addChangeHook(hook_Filter);
STATE.addEffectHook(hook_Effect);

/// ACCESSORS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies
export const LocaleNames = () => stateObj('localeNames');
export const Locales = () => stateObj('locales');
export const CurrentLocaleID = () => stateObj('localeId');
export const GetLocale = id => {
  // stateobj always returns entities as { [group]:{[ keys]:value } }
  const locales = getKey('locales'); // group:locales, key:locales
  return locales[id];
};
/// update
export const SetLocaleID = id => {
  console.log(...PR('setting locale id', id));
  updateKey('localeId', id);
  const locale = GetLocale(id);
  updateKey('transform', locale.ptrack);
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
    console.log(...PR('should load locales, responses'), localeNames, locales);
    updateKey({ localeNames, locales });
    // update transform

    console.log(...PR('locale state should be set', STATE.stateObj('locales')));
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this needs to be made dynamic */
export async function LoadCurrentPTrack() {
  const localeId = stateObj('localeId');
  if (DBG) console.log(...PR('(2) GET LOCALE DATA FOR DEFAULT ID', localeId));
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
    { id: localeId }
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
