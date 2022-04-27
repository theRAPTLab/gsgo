/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage blueprints lists

  See also:
  * ac-project
  * dc-script-engine

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as GAgent from 'lib/class-gagent';
import * as DCAGENTS from 'modules/datacore/dc-agents';
import * as SIMAGENTS from 'modules/sim/sim-agents';
import * as DCPROJECT from 'modules/datacore/dc-project';
import * as DCENGINE from 'modules/datacore/dc-script-engine';
import * as TRANSPILER from '../sim/script/transpiler-v2';
import Blueprint from '../../lib/class-project-blueprint';

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

/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** Blueprint symbols need to be extracted before they are compiled */
function m_SymbolizeBlueprints(blueprints) {
  blueprints.forEach(b => {
    // symbolizeBlueprintHelper in transpiler?
  });
}
/**
 * Use this to compile and add additional blueprints to an already running sim
 * 1. Compiles blueprints
 * 2. Register blueprint with dc-script-engine
 * @param {[ISMCPrograms]} blueprints - array of blueprints (ISMCPrograms)
 */
function m_CompileBlueprints(blueprints) {
  const bundles = blueprints.map(b => {
    const script = TRANSPILER.TextToScript(b.scriptText);
    const bundle = TRANSPILER.CompileBlueprint(script);
    TRANSPILER.RegisterBlueprint(bundle);
    return bundle;
  });
}
/**
 * Use this when reseting the simulation.
 * Clears all ScriptEvents, Blueprints, Agents, and Instances
 * and THEN compiles blueprints.
 * @param {[ISMCPrograms]} blueprints - array of blueprints (ISMCPrograms)
 * @returns
 */
function m_ResetAndCompileBlueprints(blueprints) {
  GAgent.ClearGlobalAgent();
  SIMAGENTS.ClearDOBJ();
  DCENGINE.DeleteAllScriptEvents();
  DCENGINE.DeleteAllBlueprints();
  DCAGENTS.DeleteAllAgents();
  DCAGENTS.DeleteAllInstances();
  m_SymbolizeBlueprints(blueprints);
  return m_CompileBlueprints(blueprints);
}

/// ACCESSORS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetBlueprints() {
  const blueprints = _getKey('blueprints');
  return [...blueprints];
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetBlueprint(bpName) {
  const blueprints = _getKey('blueprints');
  return blueprints.find(b => b.name === bpName);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of blueprint definitions defined for a project
 * Generally used by selector UI for `bpidList` objects
 * Pass 'blueprint' on initial calls before the key is set
 * @returns [...{id, label}]
 */
export function GetBlueprintIDsList(bundles) {
  const bp = bundles || _getKey('blueprints');
  return bp.map(b => {
    // This should use blueprint 'name' not the blueprint's gemproj id
    return { id: b.name, label: b.name };
  });
}


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns an array of blueprint names as specified in `# BLUEPRINT xxx`
 * @returns [...bpName]
 */
export function GetBlueprintNamesList(bundles) {
  return bundles.map(b => b.name);
}
export function GetBpNamesList() {
  return _getKey('bpNamesList');
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of blueprint ids that are CharControllable.
 * @returns [...id]
 */
function GenerateCharControlBpidList(bundles) {
  return bundles
    .filter(bndl => bndl.getTag('isCharControllable'))
    .map(bndl => {
      return bndl.name;
    });
}
export function GetCharControlBpidList() {
  return _getKey('charControlBpidList');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of blueprint ids that are PtrackControllable.
 * NOTE: This does not distinguish between people, poses, and objects
 *       If objects and poses need separate tracking, this should be split out
 * @returns [...id]
 */
export function GeneratePTrackControlBpidList(bundles) {
  return bundles
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
export function GeneratePozyxControlBpidList(bundles) {
  return bundles
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
 * @param {string} bpName
 * @param {string} [modelId=currentModelId]
 * @return {Object[]} [...{ name, type, defaultValue, isFeatProp }]
 */
export function GetBlueprintProperties(bpName) {
  const blueprint = GetBlueprint(bpName);
  if (!blueprint) return []; // blueprint was probably deleted
  return TRANSPILER.ExtractBlueprintProperties(blueprint.scriptText);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetBlueprintPropertiesMap(bpName) {
  const blueprint = GetBlueprint(bpName);
  if (!blueprint) return []; // blueprint was probably deleted
  return TRANSPILER.ExtractBlueprintPropertiesMap(blueprint.scriptText);
}

/// LOADER ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function updateAndPublishDerivedBpLists(blueprints) {
  const bundles = DCENGINE.GetAllBlueprints();
  const bpidList = GetBlueprintIDsList(bundles);
  // update list of blueprint pragma names from compiled bundle
  const bpNamesList = GetBlueprintNamesList(bundles);
  // updating charcontrol
  const charControlBpidList = GenerateCharControlBpidList(bundles);
  // updating ptrack
  const ptrackControlBpidList = GeneratePTrackControlBpidList(bundles);
  // updating pozyx
  const pozyxControlBpidList = GeneratePozyxControlBpidList(bundles);
  updateKey({
    bpidList,
    bpNamesList,
    charControlBpidList,
    ptrackControlBpidList,
    pozyxControlBpidList
  });
  _publishState({
    bpidList,
    bpNamesList,
    charControlBpidList,
    ptrackControlBpidList,
    pozyxControlBpidList
  });
}

/// Update the main blueprint property
function updateAndPublish(blueprints) {
  updateKey({ blueprints });
  _publishState({ blueprints });
  // update datacore
  DCPROJECT.UpdateProjectData({ blueprints });
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
    DCPROJECT.ProjectFileRequestWrite();
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
  // 1. Compile the blueprints
  m_ResetAndCompileBlueprints(blueprints);
  // 2. Update state
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
  // 1. Compile just the injected blueprints
  m_SymbolizeBlueprints([bp]);
  m_CompileBlueprints([bp]);
  // NOTE: Not updating 'blueprints' state, nor writing to db
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export function UpdateBlueprint(projId, bpName, scriptText) {
  const blueprints = _getKey('blueprints');
  const index = blueprints.findIndex(b => b.name === bpName);
  let blueprint;
  if (index > -1) {
    // Replace existing blueprint
    blueprint = {
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
    blueprint = new Blueprint(def).get();
    blueprints.push(blueprint);
  }
  // 1. Compile the new blueprint
  m_SymbolizeBlueprints([blueprint]);
  m_CompileBlueprints([blueprint]);
  // 2. Update derived states
  updateKey({ projId });
  updateAndPublish(blueprints);
  updateAndPublishDerivedBpLists(blueprints);

  UR.WriteState('blueprints', 'blueprints', blueprints);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export function DeleteBlueprint(bpName) {
  const blueprints = _getKey('blueprints');
  const index = blueprints.findIndex(b => b.name === bpName);
  if (index < 0) {
    console.warn(...PR(`Trying to delete non-existent bpid ${bpName}`));
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
