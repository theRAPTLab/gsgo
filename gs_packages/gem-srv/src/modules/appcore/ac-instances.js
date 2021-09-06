/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage instances lists

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-INSTANCES', 'TagCyan');
const DBG = true;

let AUTOTIMER;

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('instances');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
  // dummy
  projId: 0,
  instances: [
    {
      id: 1,
      label: 'Bunny 1',
      bpid: 'Bunny',
      initScript: '// init 1'
    }
  ],
  instanceidList: [],
  currentInstance: {
    // currently being edited
    id: 0,
    label: 'empty',
    bpid: 'bp',
    initScript: '// init'
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
/// return copies and derived data

export function GetInstances() {
  const instances = _getKey('instances');
  return [...instances]; // clone
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export function GetInstance(id) {
  const instances = _getKey('instances');
  return instances.find(i => i.id === id);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Returns array of instance ids + labels defined for a project
 * Generally used by selector UI for `instanceList` objects
 * @returns [...{id, label, blueprint}]
 */
export function GetInstanceidList() {
  const instances = _getKey('instances');
  return instances.map(i => {
    return { id: i.id, label: i.label, bpid: i.bpid };
  });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** Sets the`id` instance as the `currentInstance` state object
 *  Used by InstanceEditor to handle updates.
 */
export function EditInstance(id) {
  const instance = GetInstance(id);
  updateKey({ currentInstance: instance });
  _publishState({ currentInstance: instance });
}

/// LOADER ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function updateAndPublish(instances) {
  const instanceidList = GetInstanceidList();
  updateKey({ instances, instanceidList });
  _publishState({ instances, instanceidList });
}

/// INTERCEPT STATE UPDATE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** Updates and publishes `instances` with the `instance` object */
export function UpdateInstance(instance) {
  const instances = GetInstances();
  const id = instance.id;
  const index = instances.findIndex(i => i.id === id);
  instances.splice(index, 1, instance);
  updateAndPublish(instances);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Intercept changes to currentInstance so we can cache the changes
 *  for later write to DB after some time has elapsed. Returns the modified
 *  values, if any, for subsequent update to GSTATE and publishState
 *
 *  You don't need to use this if you are not filtering data before it being
 *  saved. You can also optionally return NOTHING; returning an array forces
 *  the rewrite to occur, otherwise nothing happens and the change data is
 *  written as-is.
 */
function hook_Filter(key, propOrValue, propValue) {
  if (DBG)
    console.log(
      ...PR(
        'ACInstances:hook_Filter key:',
        key,
        'propOrValue: ',
        propOrValue,
        'propValue:',
        propValue
      )
    );
  if (key === 'currentInstance') {
    // Update `instances` with the currentInstance
    const instance = propOrValue;
    UpdateInstance(instance);
    return [key, propOrValue];
  }
  return undefined;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function delayedInstancesSave() {
  if (AUTOTIMER) clearInterval(AUTOTIMER);
  AUTOTIMER = setInterval(() => {
    const projId = _getKey('projId');
    const instances = _getKey('instances');
    UR.CallMessage('LOCAL:DC_WRITE_INSTANCES', {
      projId,
      instances
    }).then(status => {
      const { err } = status;
      if (err) console.error(err);
      return status;
    });
    clearInterval(AUTOTIMER);
    AUTOTIMER = 0;
  }, 1000);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Optionally fire once all state change hooks have been processed.
 *  This is provided as the second arg of addChangeHook()
 */
function hook_Effect(effectKey, propOrValue, propValue) {
  if (DBG)
    console.log(
      ...PR('ACInstances:hook_Effect called', effectKey, propOrValue, propValue)
    );
  if (effectKey === 'currentInstance') delayedInstancesSave();

  if (effectKey === 'instances') {
    if (DBG) console.log(...PR(`effect ${effectKey} = ${propOrValue}`));
    // (a) start async autosave
    delayedInstancesSave();
  }
  // otherwise return nothing to handle procesing normally
}

/// ADD LOCAL MODULE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
addChangeHook(hook_Filter);
addEffectHook(hook_Effect);

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Handled by class-project

/// UPDATERS //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export function SetInstances(projId, instances) {
  updateKey({ projId });
  updateAndPublish(instances);
}
