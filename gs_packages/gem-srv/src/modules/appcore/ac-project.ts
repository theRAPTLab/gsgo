/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage project data

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as ACMetadata from './ac-metadata';
import * as ACRounds from './ac-rounds';
import * as ACBlueprints from './ac-blueprints';
import * as ACInstances from './ac-instances';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-PROJECT', 'TagCyan');
const DBG = true;

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('project');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
  // dummy
  projId: undefined,
  project: {
    id: undefined,
    label: undefined
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

/// ACCESSORS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies

/// LOADER ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function updateAndPublish(projId, project) {
  // Init AppCore (AC) modules
  ACMetadata.SetMetadata(projId, project.metadata);
  ACRounds.SetRounds(projId, project.rounds);
  ACBlueprints.SetBlueprints(projId, project.blueprints);
  ACInstances.SetInstances(projId, project.instances);
  // Init Self
  updateKey({
    projId,
    project
  });
  _publishState({ project });
}

/// INTERCEPT STATE UPDATE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let AUTOTIMER;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Intercept changes to project so we can cache the changes
 *  for later write to DB after some time has elapsed. Returns the modified
 *  values, if any, for subsequent update to GSTATE and publishState.
 *
 *  You don't need to use this if you are not filtering data before it being
 *  saved. You can also optionally return NOTHING; returning an array forces
 *  the rewrite to occur, otherwise nothing happens and the change data is
 *  written as-is.
 */
function hook_Filter(key, propOrValue, propValue) {
  console.error('ac-project: hook_Filter', key, propOrValue, propValue);
  // No need to return anything if data is not being filtered.
  // if (key === 'rounds') return [key, propOrValue, propValue];
  // return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Optionally fire once all state change hooks have been processed.
 *  This is provided as the second arg of addChangeHook()
 */
function hook_Effect(effectKey, propOrValue, propValue) {
  console.error('hook_Effect called', effectKey, propOrValue, propValue);
  // REVIEW: Need to rewrite, add update to dc-project
  //
  // if (effectKey === 'project') {
  //   if (DBG) console.log(...PR(`effect ${effectKey} = ${propOrValue}`));
  //   // (a) start async autosave
  //   if (AUTOTIMER) clearInterval(AUTOTIMER);
  //   AUTOTIMER = setInterval(() => {
  //     promise_WriteProject().then(response => {
  //       console.log('write result', response);
  //       const project = response.data.updateProject;
  //       updateKey('project', project);
  //       _publishState({ project });
  //     });
  //     clearInterval(AUTOTIMER);
  //     AUTOTIMER = 0;
  //   }, 1000);
  // }
  // otherwise return nothing to handle procesing normally
}

/// ADD LOCAL MODULE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
addChangeHook(hook_Filter);
addEffectHook(hook_Effect);

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** Returns in-state project data, or loads from db if necessary */
export async function GetProject(projId) {
  // Get base data
  let project = _getKey('project');
  if (project === undefined || project.id === undefined) {
    // Project not loaded yet
    throw new Error(
      `${[...PR]}.GetProject called before project state was defined!`
    );
  }

  // Get State Data from Submodules
  project.metadata = ACMetadata.GetMetadata();
  project.rounds = ACRounds.GetRounds();
  project.blueprints = ACBlueprints.GetBlueprints();
  project.instances = ACInstances.GetInstances();

  return project;
}

/// URSYS HANDLERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function HandleProjectUpdate(data: { projId: string; project: any }) {
  const { projId, project } = data;
  updateAndPublish(projId, project);
}

/// URSYS API /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

UR.HandleMessage('*:DC_PROJECT_UPDATE', HandleProjectUpdate);
