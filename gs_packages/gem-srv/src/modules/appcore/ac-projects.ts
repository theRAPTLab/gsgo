/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage list of available projects (read-only)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-PROJECTS', 'TagCyan');
const DBG = true;

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('projects');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
  projectNames: [
    {
      id: 'dummy',
      label: 'Dummy Project'
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

/// ACCESSORS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies

/// LOADER ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function updateAndPublish(projectNames) {
  updateKey({ projectNames });
  _publishState({ projectNames });
}

/// URSYS HANDLERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function HandleProjectsUpdate(data: { projectNames: any[] }) {
  const projectNames = data.projectNames;
  updateAndPublish(projectNames);
}

/// URSYS API /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

UR.HandleMessage('*:DC_PROJECTS_UPDATE', HandleProjectsUpdate);
