/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage instances lists

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as DCPROJECT from 'modules/datacore/dc-project';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-INSTANCES', 'TagCyan');
const DBG = false;

let AUTOTIMER;

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('instances');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
  instances: [
    {
      id: '1',
      label: 'Bunny 1',
      bpid: 'Bunny',
      initScript: '// init 1'
    }
  ],
  instanceidList: [],
  currentInstance: undefined
  // currentInstance is the instance currently being edited
  // it should be undefined by default
  //
  // Uncomment to debug
  // currentInstance: {
  //   id: '0',
  //   label: 'empty',
  //   bpid: 'bp',
  //   initScript: '// init'
  // }
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

function GetInstances() {
  const instances = _getKey('instances');
  return [...instances]; // clone
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function GetInstance(id) {
  const instances = _getKey('instances');
  return instances.find(i => i.id === id);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Returns array of instance ids + labels defined for a project
 * Generally used by selector UI for `instanceList` objects
 * Call with `currentInstances` parm to derive instancedidList
 * from in-progress changes rather than saved state.
 * @returns [...{id, label, blueprint}]
 */
function GetInstanceidList(currentInstances) {
  const instances = currentInstances || _getKey('instances');
  return instances.map(i => {
    return { id: i.id, label: i.label, bpid: i.bpid };
  });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** Returns a unique instance ID by finding the highest id and adding 1 */
function GetInstanceUID() {
  const instances = _getKey('instances');
  if (instances.length < 1) return String(0);
  const max = instances.reduce((prev, b) => {
    const a = typeof prev === 'object' ? prev.id : prev;
    return Math.max(a, Number(b.id));
  }, 0); // initial value is 0
  return String(max + 1);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** Sets the`id` instance as the `currentInstance` state object
 *  Used by InstanceEditor to handle updates.
 */
function EditInstance(id) {
  const instance = GetInstance(id);
  updateKey({ currentInstance: instance });
  _publishState({ currentInstance: instance });
}

/// LOADER ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function updateAndPublish(instances) {
  const instanceidList = GetInstanceidList(instances);
  updateKey({ instances, instanceidList });
  _publishState({ instances, instanceidList });
  // update datacore
  DCPROJECT.UpdateProjectData({ instances });
}

/// INTERCEPT STATE UPDATE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** Updates and publishes `instances` with the `instance` object
 *  NOTE: Used by hook_Filter
 *  NOTE: Does not write to db
 */
function m_UpdateCurrentInstance(instance) {
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
    m_UpdateCurrentInstance(instance);
    return [key, propOrValue];
  }
  return undefined;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Optionally fire once all state change hooks have been processed.
 *  This is provided as the second arg of addChangeHook()
 */
function hook_Effect(effectKey, propOrValue, propValue) {
  if (DBG)
    console.log(
      ...PR('ACInstances:hook_Effect called', effectKey, propOrValue, propValue)
    );
  if (effectKey === 'currentInstance') DCPROJECT.ProjectFileRequestWrite();

  if (effectKey === 'instances') {
    if (DBG) console.log(...PR(`effect ${effectKey} = ${propOrValue}`));
    updateAndPublish(propOrValue);
    // (a) start async autosave
    DCPROJECT.ProjectFileRequestWrite();
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

/// UPDATERS MULTIPLE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** API: Use to initialize data without writing to disk
 *  Will not call DCPROJECT.ProjectFileRequestWrite.
 */
function SetInstances(projId, instances) {
  updateAndPublish(instances);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function WriteInstances(instances) {
  UR.WriteState('instances', 'instances', instances); // calls updateAndPublish via hook_Effect
}

/// UPDATERS SINGLE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function AddInstance(instance) {
  const instances = _getKey('instances');
  instances.push(instance);
  UR.WriteState('instances', 'instances', instances); // calls updateAndPublish via hook_Effect
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** Saves instance to db, Updates and publishes `instances` with the `instance` object
 */
function WriteInstance(instance) {
  const instances = GetInstances();
  const id = instance.id;
  const index = instances.findIndex(i => i.id === id);
  instances.splice(index, 1, instance);
  UR.WriteState('instances', 'instances', instances); // calls updateAndPublish via hook_Effect
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function DeleteInstance(id) {
  const instances = _getKey('instances');
  const index = instances.findIndex(i => i.id === id);
  instances.splice(index, 1);
  UR.WriteState('instances', 'instances', instances); // calls updateAndPublish via hook_Effect
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function DeleteInstancesByBPID(bpid) {
  const instances = _getKey('instances');
  const reduced = instances.filter(i => i.bpid !== bpid);
  UR.WriteState('instances', 'instances', reduced); // calls updateAndPublish via hook_Effect
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function RenameInstanceBlueprint(oldBpid, newBpid) {
  const instances = _getKey('instances');
  UR.WriteState(
    'instances',
    'instances',
    instances.map(i => {
      if (i.bpid !== oldBpid) return i;
      i.bpid = newBpid;
      return i;
    })
  ); // calls updateAndPublish via hook_Effect
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  // Getters
  GetInstances,
  GetInstance,
  GetInstanceidList,
  GetInstanceUID,
  // InstanceEditor
  EditInstance,
  // Multiple Setters
  SetInstances,
  WriteInstances,
  // Single Setters
  AddInstance,
  WriteInstance,
  DeleteInstance,
  DeleteInstancesByBPID,
  RenameInstanceBlueprint
};
