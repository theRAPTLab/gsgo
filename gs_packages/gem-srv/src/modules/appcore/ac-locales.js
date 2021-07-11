/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage locale information and synchronize changes as needed with database
  TODO: add GraphQL subscriptions to this somehow

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-LOCALES', 'TagCyan');
const DBG = false;

/// INITIALIZE STATE MANAGED BY THIS MODULE ///////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// The module name will be used as args for UR.ReadState
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
const { stateObject, flatStateObject, updateKey } = STATE;
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

/// ACCESSORS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies
export const LocaleNames = () => stateObject('localeNames');
export const Locales = () => stateObject('locales');
export const CurrentLocaleID = () => stateObject('localeID');
export const GetLocale = id => {
  // stateobj always returns entities as { [group]:{[ keys]:value } }
  const locales = flatStateObject('locales'); // group:locales, key:locales
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
  const localeID = stateObject('localeId');
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
/*
export async function HandleChange() {
  UR.HookStateChange((group, name, value) => {
    if (group === 'app') {
      if (name === 'localeId') LOCALE_ID = Number(value);
    }
    if (group === 'transform') {
      console.log('transform', name, '=', value);
      if (MASTER_STATE.transform[name] !== undefined) {
        MASTER_STATE.transform[name] = Number(value);
        if (AUTOTIMER) clearInterval(AUTOTIMER);
        AUTOTIMER = setInterval(() => {
          console.log(...PR('autosaving transform', MASTER_STATE.transform));
          UR.Query(
            `
            mutation LocalePTrack($id:Int $input:PTrackInput) {
              updatePTrack(localeId:$id,input:$input) {
                memo
              }
            }
          `,
            {
              input: MASTER_STATE.transform,
              id: LOCALE_ID
            }
          ).then(response => {
            console.log('response', response);
          });
          clearInterval(AUTOTIMER);
          AUTOTIMER = 0;
          // update locale
          LOCALES[LOCALE_ID].ptrack = MASTER_STATE.transform;
          UR.PublishState({ locales: LOCALES });
        }, 1000);
        return [group, name, Number(value)]; // make sure UI updates with current vars
      }
    }
    // if nothing returned, the handler operates normally
    return undefined;
  });
}
*/

/// INTERCEPT STATE UPDATE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let AUTOTIMER;
let LOCALE_ID = 0;
let LOCALES = [];
let LOCALE_NAMES = [];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
