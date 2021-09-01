/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage rounds lists

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-ROUNDS', 'TagCyan');
const DBG = true;

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('rounds');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
  // dummy
  projId: 0,
  rounds: [
    {
      id: 1,
      label: 'Dummy Round 1',
      time: 1,
      intro: 'intro 1',
      outtro: 'outro 1',
      initScript: '// init 1',
      endScript: '// end 1'
    },
    {
      id: 2,
      label: 'Dummy Round 2',
      time: 2,
      intro: 'intro 2',
      outtro: 'outro 2',
      initScript: '// init 2',
      endScript: '// end 2'
    },
    {
      id: 3,
      label: 'Dummy Round 3',
      time: 2,
      intro: 'intro 3',
      outtro: 'outro 3',
      initScript: '// init 3',
      endScript: '// end 3'
    }
  ]
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

/// LOADER ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function updateAndPublish(projId, rounds) {
  updateKey({ projId, rounds });
  _publishState({ rounds });
}

/// INTERCEPT STATE UPDATE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let AUTOTIMER;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Intercept changes to rounds so we can cache the changes
 *  for later write to DB after some time has elapsed. Returns the modified
 *  values, if any, for subsequent update to GSTATE and publishState
 */
function hook_Filter(key, propOrValue, propValue) {
  // console.log('hook_Filter', key, propOrValue, propValue);
  // No need to return anything if data is not being filtered.
  // if (key === 'rounds') return [key, propOrValue, propValue];
  // return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return Promise to write to database */
function promise_WriteRounds() {
  const projId = _getKey('projId');
  const input = _getKey('rounds');
  const result = UR.Mutate(
    `
    mutation UpdateRounds($projectId:String $input:[ProjectRoundInput]) {
      updateRounds(projectId:$projectId,input:$input) {
        id
        label
        time
        intro
        outtro
        initScript
        endScript
      }
    }`,
    {
      input,
      projectId: projId
    }
  );
  return result;
}
// Test Function
// window.writeRound = () => promise_WriteTransform();

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Optionally fire once all state change hooks have been processed.
 *  This is provided as the second arg of addChangeHook()
 */
function hook_Effect(effectKey, propOrValue, propValue) {
  console.error('hook_Effect called', effectKey, propOrValue, propValue);
  if (effectKey === 'rounds') {
    if (DBG) console.log(...PR(`effect ${effectKey} = ${propOrValue}`));
    // (a) start async autosave
    if (AUTOTIMER) clearInterval(AUTOTIMER);
    AUTOTIMER = setInterval(() => {
      promise_WriteRounds().then(response => {
        const rounds = response.data.updateRounds;
        updateKey('rounds', rounds);
        _publishState({ rounds });
      });
      clearInterval(AUTOTIMER);
      AUTOTIMER = 0;
    }, 1000);
  }
  // otherwise return nothing to handle procesing normally
}

/// DATABASE QUERIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOT USED: If rounds ever loaded themselves this is the call
/// Rounds are loaded by class-project
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function m_LoadRounds(projId) {
  if (DBG) console.log(...PR('(1) GET ROUNDS DATA'));
  const response = await UR.Query(`
    query {
      project(id:"${projId}") {
        rounds { id label time intro outtro initScript endScript }
      }
    }
  `);
  if (!response.errors) {
    const { rounds } = response.data;
    updateAndPublish(rounds);
  }
}

/// ADD LOCAL MODULE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
addChangeHook(hook_Filter);
addEffectHook(hook_Effect);

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Handled by class-project

/// ACCESSORS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies
export function GetRoundCount() {
  const rounds = _getKey('rounds');
  return rounds.length;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetRoundDef(index) {
  const rounds = _getKey('rounds');
  if (index > rounds.length)
    throw new Error(
      `Bad round index request: '${index}'. Rounds length is ${rounds.length}`
    );
  return rounds[index];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RoundsShouldLoop() {
  const metadata = _getKey('metadata');
  return metadata.roundsCanLoop;
}
