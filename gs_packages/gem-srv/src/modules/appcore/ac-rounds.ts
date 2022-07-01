/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage rounds lists

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as DCPROJECT from 'modules/datacore/dc-project';
import ERROR from 'modules/error-mgr';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-ROUNDS', 'TagCyan');
const DBG = false;

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('rounds');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
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

/// INTERCEPT STATE UPDATE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Intercept changes to rounds so we can cache the changes
 *  for later write to DB after some time has elapsed. Returns the modified
 *  values, if any, for subsequent update to GSTATE and publishState
 */
function hook_Filter(key, propOrValue, propValue) {
  if (DBG) console.log('hook_Filter', key, propOrValue, propValue);
  // No need to return anything if data is not being filtered.
  if (key === 'rounds') {
    // update datacore
    const rounds = propOrValue;
    DCPROJECT.UpdateProjectData({ rounds });
  }
  // return undefined;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Optionally fire once all state change hooks have been processed.
 *  This is provided as the second arg of addChangeHook()
 */
function hook_Effect(effectKey, propOrValue, propValue) {
  if (DBG) console.log('hook_Effect called', effectKey, propOrValue, propValue);
  if (effectKey === 'rounds') {
    if (DBG) console.log(...PR(`effect ${effectKey} = ${propOrValue}`));
    // (a) start async autosave
    DCPROJECT.ProjectFileRequestWrite();
  }
  // otherwise return nothing to handle procesing normally
}

/// ADD LOCAL MODULE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
addChangeHook(hook_Filter);
addEffectHook(hook_Effect);

/// CONVENIENCE METHODS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Use this if you want to bypass hook_Filter and hook_Effect
 *  e.g. on initial load, skip hook_Effect so the initial load data
 *  isn't re-written to server.
 */
function updateAndPublish(rounds) {
  updateKey({ rounds });
  _publishState({ rounds });
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Handled by class-project

/// ACCESSORS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetRounds() {
  const rounds = _getKey('rounds');
  return [...rounds]; // clone
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetRoundCount() {
  const rounds = _getKey('rounds');
  return rounds.length;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetRoundDef(index) {
  const rounds = _getKey('rounds');
  if (index > rounds.length)
    throw new Error(
      `Bad round index request: '${index}'. Rounds length is ${rounds.length}`
    );
  return rounds[index];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RoundsShouldLoop() {
  const metadata = _getKey('metadata');
  return metadata.roundsCanLoop;
}

/// UPDATERS //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SetRounds(projId, rounds = []) {
  try {
    DCPROJECT.UpdateProjectData({ rounds });
    updateAndPublish(rounds);
  } catch (caught) {
    ERROR(`could not set ${projId} rounds data`, {
      source: 'project-init',
      caught
    });
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  // Getters
  GetRounds,
  GetRoundCount,
  GetRoundDef,
  RoundsShouldLoop,
  // Updaters
  SetRounds
};
