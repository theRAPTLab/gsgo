/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage project data

  A `project` is a bare bones data object representing a the wrapper info
  around single GEMSTEP project data:

    project = {
      id,
      label
    }

  `GetProject` will return the base `project` stuffed with other parameters
  that make up a loaded GEMSTEP project that are being handled by sub
  ac-* classes.

    project = {
      id,
      label
      metadata,
      rounds,
      blueprints,
      instances
    }


  @BEN SRI CODE REVIEW

  * A project model description would be nice: "representation of current
    loaded project by id to { blueprints, rounds, instances, metadata }"
    This module manages the CURRENT LOADED PROJECT, apparently, though
    this isn't said anywhere.

  * Nothing is commented in STATE.initializeState(). Why is projId
    and project.id both including if they are the same thing?

  * GetProject() load the bare project state object { id, label }
    and then writes metadata, rounds, blueprints, instances into it.
    This modifies the underlying data and IT DOES NOT MATCH the
    STATE.initializeState() declaration, which is supposed to provide
    the single source of truth for state groups.

  * updateAndPublish() does something similar, accepting a project
    parameter object that does not match the STATE definition. Also
    could it be named as the mirror of GetProjec(), if that is the intent?

  * The projId state is defined multiple times in different state groups,
    which is an error. StateGroupManager was supposed to detect this and
    print a warning, but the state checker was not checking for a hard
    undefined so setting the initial values to 0 would bypass it.

  * This module might be a lot simpler if you let dc-project handle the data
    side of things. You've made dc-project fundamentally a loader/writer
    which is only one of the parts of a datacore module.

    URSYS MESSAGE HANDLERS
      DC_PROJECT_UPDATE -> HandleProjectUpdate -> updateAndPublish

    EXPORTS
      GetProject                return current project
      updateAndPublish          update current project and distribute change
      TriggerProjectStateUpdate force-notify all subscribers

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as TOML from '@iarna/toml';
import * as DCPROJECT from 'modules/datacore/dc-project';
import * as ACMetadata from './ac-metadata';
import * as ACRounds from './ac-rounds';
import * as ACBlueprints from './ac-blueprints';
import * as ACInstances from './ac-instances';
import * as ACPreferences from './ac-preferences';
import * as ACConversationAgents from './ac-conversation-agent';
import ERROR from 'modules/error-mgr';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-PROJECT', 'TagCyan');
const DBG = false;

/// ACCESSORS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies

/// STATE MANAGER /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('project');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
  // REVIEW: Rename 'project' to 'projLabel' since it is not a project object?
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

/// INTERCEPT STATE UPDATE ////////////////////////////////////////////////////
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
  if (DBG) console.log('ac-project: hook_Filter', key, propOrValue, propValue);
  if (key === 'project') {
    const project = propOrValue;
    // update datacore
    // Since 'project' data updates are direct state updates, we need to also
    // update datacore.  NOTE the other submodules, e.g. ac-blueprint, and
    // ac-metadata rely on direct calls
    DCPROJECT.UpdateProjectData(project);
    // Send Network Update so that PanelSelectSimulation running
    // on other computers receive the update
    UR.RaiseMessage('NET:PROJECTS_UPDATE', {
      projectNames: [
        {
          id: project.id,
          label: project.label
        }
      ]
    });
  }

  // No need to return anything if data is not being filtered.
  // if (key === 'rounds') return [key, propOrValue, propValue];
  // return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Optionally fire once all state change hooks have been processed.
 *  This is provided as the second arg of addChangeHook()
 */
function hook_Effect(effectKey, propOrValue, propValue) {
  if (DBG) console.log('hook_Effect called', effectKey, propOrValue, propValue);
  if (effectKey === 'project') {
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
function updateAndPublish(project) {
  updateKey({ project });
  _publishState({ project });
}

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Returns in-state project data
 */
function GetProject(projId) {
  return DCPROJECT.GetCurrentProject();
}

// Deprecated?  Not needed?
// DoSimReset and project reload should take care of the project state?
// And besides on reload we want to use the current project values.
//
// /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// /** API: Updates the project state subscribers after a project reload / sim reset
//  *  Called by project-server.ReloadProject()
//  */
// async function TriggerProjectStateUpdate(projId) {
//   const project = DCPROJECT.GetCurrentProject();
//   updateAndPublish(project);
// }

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: This is the main project data loader call.
 *  Requests .gemproj file data from the server, and saves the data to
 *  all the ac-* submodules as well as datacore.
 *  project-server calls this during Initialize when Main is first loaded. */
async function LoadProjectFromAsset(projId) {
  try {
    const project = await DCPROJECT.ProjectFileLoadFromAsset(projId);
    // Init AppCore (AC) modules
    ACMetadata.SetMetadata(projId, project.metadata);
    ACRounds.SetRounds(projId, project.rounds);
    ACBlueprints.SetBlueprints(projId, project.blueprints);
    ACInstances.SetInstances(projId, project.instances);
    // Update Comment Styles from _comment_types.toml
    const preferences = await DCPROJECT.PreferencesFileLoadFromAsset();
    ACPreferences.SetPreferences(TOML.parse(preferences));
    ACConversationAgents.SetECATypes(project.ecaTypes);
    // Update datacore
    DCPROJECT.SetCurrentProject(project);
    updateAndPublish(project);
  } catch (err) {
    ERROR(`could not load and initialize project ${projId}`, {
      source: 'project-loader',
      where: 'ac-project.LoadProjectFromAsset'
    });
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  LoadProjectFromAsset,
  // This should be replaced by DCPROJECT.GetCurrentProject() call?
  GetProject // return current project{}
  // TriggerProjectStateUpdate // force-notify all subscribers
};
