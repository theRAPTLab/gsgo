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

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('locales');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
  locales: [],
  localeNames: [],
  localeId: 0,
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
const { stateObj, flatStateValue, _getKey, updateKey } = STATE;
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
const { addEffectHook, deleteEffectHook } = STATE;

/// ADD LOCAL MODULE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
addChangeHook(hook_Filter);
addEffectHook(hook_Effect);

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// in general, these should never return reference objects. Make sure you
/// are returning copies, and check for nested objects that would be
/// a reference
export const LocaleNames = () => stateObj('localeNames');
export const Locales = () => stateObj('locales');
export const CurrentLocaleId = () => flatStateValue('localeId');
export const GetLocale = id => {
  // stateobj always returns entities as { [group]:{[ keys]:value } }
  const locales = _getKey('locales'); // group:locales, key:locales
  return { ...locales[id] }; // return copy
};
/// update
export const SetLocaleID = id => {
  console.log(...PR('setting locale id', id));
  updateKey('localeId', id);
  const locale = GetLocale(id);
  updateKey('transform', locale.ptrack);
};

/// INTERCEPT STATE UPDATE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let AUTOTIMER;
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
/** return Promise to write input (ptrack) to database */
function promise_WriteTransform() {
  const id = _getKey('localeId');
  const input = _getKey('transform');
  return UR.Mutate(
    `
    fragment TransformParts on PTrackProps {
      xRange
      yRange
      xOff
      yOff
      xScale
      yScale
      zRot
    }
    mutation LocalePTrack($id:Int $input:PTrackInput) {
      updatePTrack(localeId:$id,input:$input) {
        ...TransformParts
      }
    }`,
    {
      input,
      id
    }
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Optionally fire once all state change hooks have been processed.
 *  This is provided as the second arg of addChangeHook()
 */
function hook_Effect(effectKey, propOrValue, propValue) {
  // (1) transform effect
  if (effectKey === 'transform') {
    if (DBG) console.log(...PR(`effect ${effectKey} = ${propOrValue}`));
    // (a) start async autosave
    if (AUTOTIMER) clearInterval(AUTOTIMER);
    const thisLocaleId = CurrentLocaleId();
    AUTOTIMER = setInterval(() => {
      promise_WriteTransform().then(response => {
        const ptrack = response.data.updatePTrack;
        if (DBG) {
          console.log(
            ...PR(
              'autosave DB returned [',
              ...Object.entries(ptrack).map(([k, v]) => `${k}:${v} `),
              ']'
            )
          );
        }
        // HACK: now write back to ptrack manually, though in the future
        // this should be handled by the DB update automatically triggering it
        // relies on closured value thisLocaleId being id at time of hook
        const locales = _getKey('locales'); // this is the actual state reference
        console.log(...PR('autosaved transform to ptrack'));
        if (DBG)
          console.log(...PR('locales', locales, 'old localeId', thisLocaleId));
        const locale = locales.find(l => l.id === thisLocaleId);
        // Mutate actual state directly
        locale.ptrack = ptrack;
        _publishState({ locales });
      });
      clearInterval(AUTOTIMER);
      AUTOTIMER = 0;
    }, 1000);
    return;
  }

  // (1) localeId changed
  if (effectKey === 'localeId') {
    if (DBG) console.log(...PR(`effect localeId=${propOrValue}`));
    // if there is a pending dbwrite, flush it first
    if (AUTOTIMER) {
      clearInterval(AUTOTIMER);
      promise_WriteTransform().then(response => {
        if (DBG) console.log(...PR('effect flushed DB', response));
      });
      AUTOTIMER = 0;
    }
    const localeId = Number(propOrValue);
    const { ptrack } = GetLocale(localeId);
    updateKey('transform', ptrack);
    _publishState({ transform: ptrack });
  }
  // otherwise return nothing to handle procesing normally
}

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
    if (DBG)
      console.log(...PR('should load locales, responses'), localeNames, locales);
    updateKey({ localeNames, locales });
    // update transform
    if (DBG)
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
