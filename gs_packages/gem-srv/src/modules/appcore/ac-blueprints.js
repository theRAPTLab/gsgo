/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage blueprints lists

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import Blueprint from '../../lib/class-project-blueprint';
import * as TRANSPILER from '../sim/script/transpiler-v2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-BPRNT', 'TagCyan');
const DBG = false;

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('blueprints');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
  // db states
  projId: 0,
  blueprints: [],
  // runtime states
  bpidList: [],
  bpNamesList: [],
  bpBundles: new Map(), // compiled bundles of blueprint scrits
  defaultPozyxBpid: '',
  charControlBpidList: [],
  ptrackControlBpidList: [],
  pozyxControlBpidList: []
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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetBlueprints() {
  const blueprints = _getKey('blueprints');
  return [...blueprints];
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetBlueprint(bpid) {
  const blueprints = _getKey('blueprints');
  return blueprints.find(b => b.id === bpid);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of blueprint definitions defined for a project
 * Generally used by selector UI for `bpidList` objects
 * Pass 'blueprint' on initia calls before the key is set
 * @returns [...{id, label}]
 */
export function GetBlueprintIDsList(blueprints) {
  const bp = blueprints || _getKey('blueprints');
  return bp.map(b => {
    return { id: b.id, label: b.label };
  });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns a map of blueprint Bundles
 * Local call only.
 * @param [] blueprints
 * @returns Map<string, any>
 */
function CompileBlueprintBundles(blueprints) {
  const bundles = blueprints.map(b => {
    const script = TRANSPILER.TextToScript(b.scriptText);
    const bundle = TRANSPILER.CompileBlueprint(script);
    TRANSPILER.RegisterBlueprint(bundle);
    return bundle;
  });
  const bpBundles = new Map();
  bundles.forEach(b => bpBundles.set(b.name, b));
  return bpBundles;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns an array of blueprint names as specified in `# BLUEPRINT xxx`
 * @returns [...bpName]
 */
export function GetBlueprintNamesList(bpBundles) {
  const bpBundlesArr = [...bpBundles.values()];
  return bpBundlesArr.map(b => b.name);
}
export function GetBpNamesList() {
  return _getKey('bpNamesList');
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of blueprint ids that are CharControllable.
 * @returns [...id]
 */
function GenerateCharControlBpidList(bpBundles) {
  const bpBundlesArr = [...bpBundles.values()];
  return bpBundlesArr
    .filter(bndl => bndl.getTag('isCharControllable'))
    .map(bndl => {
      return bndl.name;
    });
}
export function GetCharControlBpidList(bpBundles) {
  return _getKey('charControlBpidList');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of blueprint ids that are PtrackControllable.
 * NOTE: This does not distinguish between people, poses, and objects
 *       If objects and poses need separate tracking, this should be split out
 * @returns [...id]
 */
export function GeneratePTrackControlBpidList(bpBundles) {
  const bpBundlesArr = [...bpBundles.values()];
  return bpBundlesArr
    .filter(bndl => bndl.getTag('isPTrackControllable'))
    .map(bndl => {
      return bndl.name;
    });
}
export function GetPTrackControlBpidList() {
  return _getKey('ptrackControlBpidList');
}
/**
 * Returns the first ptrack controllable blueprint as the default bp to use
 * Used dc-inputs to determine mapping
 * @returns id
 */
export function GetPTrackControlDefaultBpid() {
  const ptrackBpidList = _getKey('ptrackControlBpidList');
  if (ptrackBpidList.length < 1) return undefined;
  return ptrackBpidList[0];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of blueprint ids that are PozyxControllable.
 * @returns [...id]
 */
export function GeneratePozyxControlBpidList(bpBundles) {
  const bpBundlesArr = [...bpBundles.values()];
  return bpBundlesArr
    .filter(bndl => bndl.getTag('isPozyxControllable'))
    .map(bndl => {
      return bndl.name;
    });
}
export function GetPozyxControlBpidList() {
  return _getKey('pozyxControlBpidList');
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns the first pozyx controllable blueprint as the default bp to use
 * Used dc-inputs to determine mapping
 * @returns id
 */
export function GetPozyxControlDefaultBpid() {
  const pozyxBpidList = _getKey('pozyxControlBpidList');
  if (pozyxBpidList.length < 1) return undefined;
  return pozyxBpidList[0];
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of properties {name, type, defaultvalue, isFeatProp}
 * that have been defined by the blueprint.
 * Used to populate property menus when selecting properties to show
 * in InstanceInspectors
 * @param {string} bpid
 * @param {string} [modelId=currentModelId]
 * @return {Object[]} [...{ name, type, defaultValue, isFeatProp }]
 */
export function GetBlueprintProperties(bpid) {
  const blueprint = GetBlueprint(bpid);
  if (!blueprint) return []; // blueprint was probably deleted
  return TRANSPILER.ExtractBlueprintProperties(blueprint.scriptText);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetBlueprintPropertiesMap(bpid) {
  const blueprint = GetBlueprint(bpid);
  if (!blueprint) return []; // blueprint was probably deleted
  return TRANSPILER.ExtractBlueprintPropertiesMap(blueprint.scriptText);
}

/// LOADER ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function updateAndPublishDerivedBpLists(blueprints) {
  const bpidList = GetBlueprintIDsList(blueprints);
  // compile and update bundles
  const bpBundles = CompileBlueprintBundles(blueprints);
  // update list of blueprint pragma names from compiled bundle
  const bpNamesList = GetBlueprintNamesList(bpBundles);
  // updating charcontrol
  const charControlBpidList = GenerateCharControlBpidList(bpBundles);
  // updating ptrack
  const ptrackControlBpidList = GeneratePTrackControlBpidList(bpBundles);
  // updating pozyx
  const pozyxControlBpidList = GeneratePozyxControlBpidList(bpBundles);
  updateKey({
    bpidList,
    bpNamesList,
    bpBundles,
    charControlBpidList,
    ptrackControlBpidList,
    pozyxControlBpidList
  });
  _publishState({
    bpidList,
    bpNamesList,
    bpBundles,
    charControlBpidList,
    ptrackControlBpidList,
    pozyxControlBpidList
  });
}

/// Update the main blueprint property
/// AND also update dervied properties
function updateAndPublish(blueprints) {
  const bpidList = GetBlueprintIDsList(blueprints);
  updateKey({ blueprints, bpidList });
  _publishState({ blueprints, bpidList });
}

/// INTERCEPT STATE UPDATE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let AUTOTIMER;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Intercept changes to blueprints so we can cache the changes
 *  for later write to DB after some time has elapsed. Returns the modified
 *  values, if any, for subsequent update to GSTATE and publishState.
 *
 *  You don't need to use this if you are not filtering data before it being
 *  saved. You can also optionally return NOTHING; returning an array forces
 *  the rewrite to occur, otherwise nothing happens and the change data is
 *  written as-is.
 */
function hook_Filter(key, propOrValue, propValue) {
  if (DBG) console.log('ac-blueprints: hook_Filter', key, propOrValue, propValue);
  // No need to return anything if data is not being filtered.
  // if (key === 'rounds') return [key, propOrValue, propValue];
  // return undefined;
  if (key === 'blueprints') {
    // update and publish bpidList too
    const blueprints = propOrValue;
    updateAndPublishDerivedBpLists(blueprints);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Optionally fire once all state change hooks have been processed.
 *  This is provided as the second arg of addChangeHook()
 */
function hook_Effect(effectKey, propOrValue, propValue) {
  if (DBG) console.log('hook_Effect called', effectKey, propOrValue, propValue);
  if (effectKey === 'blueprints') {
    if (DBG) console.log(...PR(`effect ${effectKey} = ${propOrValue}`));
    // (a) start async autosave
    if (AUTOTIMER) clearInterval(AUTOTIMER);
    AUTOTIMER = setInterval(() => {
      const projId = _getKey('projId');
      const blueprints = propOrValue;
      UR.CallMessage('LOCAL:DC_WRITE_BLUEPRINTS', {
        projId,
        blueprints
      }).then(status => {
        const { err } = status;
        if (err) console.error(err);
        return status;
      });
      clearInterval(AUTOTIMER);
      AUTOTIMER = 0;
    }, 1000);
  }
  // otherwise return nothing to handle procesing normally
}

/// ADD LOCAL MODULE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
addChangeHook(hook_Filter);
addEffectHook(hook_Effect);

/// UPDATERS //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export function SetBlueprints(projId, blueprints) {
  updateKey({ projId });
  updateAndPublish(blueprints);
  updateAndPublishDerivedBpLists(blueprints);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// Used to inject Cursor
/// This runs AFTER other blueprints have been compiled
/// Initiated by mod-sim-control.SimPlaces
export function InjectBlueprint(projId, blueprintDef) {
  // Add new blueprint
  const def = {
    id: blueprintDef.id,
    label: blueprintDef.label,
    scriptText: blueprintDef.scriptText
  };
  const bp = new Blueprint(def);
  // Remove it if it already exists
  const blueprints = _getKey('blueprints').filter(b => b.id !== blueprintDef.id);
  blueprints.push(bp.get());
  // Update derived states
  updateAndPublishDerivedBpLists(blueprints);

  // NOTE: Not updating 'blueprints' state, nor writing to db
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export function UpdateBlueprint(projId, bpid, scriptText) {
  const blueprints = _getKey('blueprints');
  const index = blueprints.findIndex(b => b.id === bpid);
  console.log('updatebluperint', bpid, scriptText);
  if (index > -1) {
    // Replace existing blueprint
    const blueprint = {
      ...blueprints[index]
    }; // clone
    // Update the script
    blueprint.scriptText = scriptText;
    blueprints[index] = blueprint;
  } else {
    // Add new blueprint
    // This is also called if the name of the blueprint changed
    // (the old one is deleted)
    const def = {
      id: bpid,
      label: bpid,
      scriptText
    };
    const blueprint = new Blueprint(def);
    blueprints.push(blueprint.get());
  }
  updateKey({ projId });
  updateAndPublish(blueprints);
  console.error('...updating blueprints to', blueprints);
  UR.WriteState('blueprints', 'blueprints', blueprints);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export function DeleteBlueprint(bpid) {
  const blueprints = _getKey('blueprints');
  const index = blueprints.findIndex(b => b.id === bpid);
  if (index < 0) {
    console.warn(...PR(`Trying to delete non-existent bpid ${bpid}`));
    return;
  }
  blueprints.splice(index, 1);
  // REVIEW: This can potentially trigger multiple state updates
  //         See sim-agents.AllAgentsProgram / FilterBlueprints
  //         Do we need a way to do multiple deletes with a delayed
  //         state update?
  UR.WriteState('blueprints', 'blueprints', blueprints);
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Handled by class-project
