/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage blueprints lists


  Because blueprint names are determined by the `# BLUEPRINT` pragma and
  may change, we do not save the `name` in the gemproj file.  Instead we
  retrieve the name after compiling the blueprint script.

  For historical reasons, we used a blueprint `id` field in the gemproj file
  and there are still some artifacts of that approach in the code.  These
  will eventually be removed with a proper refactor.


  There are two main blueprint stores:

  1. BPTEXTMAP -- A map of blueprint scriptText indexed by bpName
              The raw scriptText is needed for script editing via ScriptEditor
              and stored locally in the BPTEXTMAP map.

  2. DCENGINE.BLUEPRINTS -- A map of compiled blueprint bundles indexed by bpName
              The bundles are used to
              The compiled blueprint bundles are stored in dc-sim-resources.

  Nomenclature:
  * `bpid`    is the unique id of the blueprint in the .gemproj file
              This is now DEPRECATED!
              We used to use this to look up blueprints.  In general
              references to 'bpid' should be references to 'bpName'

  * 'bpName'  is the name of the blueprint defined by the blueprint pragma
              e.g. `# BLUEPRINT Moth` bpName = Moth

  * `bpDef`   is a wrapper object around scriptText intended to make it
              easier to retrieve and reference the changeable bpName
              without having to recompile the blueprint.
              bpDef {
                name: string;
                scriptText: string;
              }

  * 'bpEditList' is an array of wraped blueprint text used to
              populate the list of blueprints in ScriptEditor.
              e.g. bpEditList = [ {
                name: string;
                scriptText: string;
                editor: string
              }, ... ]

  See also:
  * ac-project
  * dc-sim-resources

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as GAgent from 'lib/class-gagent';
import * as DCAGENTS from 'modules/datacore/dc-sim-agents';
import * as DCENGINE from 'modules/datacore/dc-sim-resources';
import * as DCPROJECT from 'modules/datacore/dc-project';
import * as SIMAGENTS from 'modules/sim/sim-agents';
import * as TRANSPILER from '../sim/script/transpiler-v2';
import Blueprint from '../../lib/class-project-blueprint';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-BPRNT', 'TagCyan');
const DBG = false;

// A local store of raw `scriptText` indexed by `bpName`
// Auto-generated during m_CompileBlueprints
// Used as source of derived values
const BPTEXTMAP = new Map(); // [ ...[bpName, bpScriptText] ]

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('blueprints');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
  // db states
  blueprints: [], // [{scriptText},...] raw blueprint text used for saving to gemproj file
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
 * 2. Registers blueprint with dc-sim-resources
 * 3. Registers BPTEXTMAP
 * @param {[ISMCPrograms]} blueprints - array of blueprints (ISMCPrograms)
 * @return SM_Bundle[]
 */
function m_CompileBlueprints(blueprints) {
  const bundles = blueprints.map(b => {
    const script = TRANSPILER.TextToScript(b.scriptText);
    const bundle = TRANSPILER.CompileBlueprint(script);
    // Save to datacore
    TRANSPILER.RegisterBlueprint(bundle);
    // Save local reference
    BPTEXTMAP.set(bundle.name, b.scriptText);
    return bundle;
  });
  return bundles;
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

/// BPTEXTMAP EXTRACTOR METHODS ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Returns array of objects with just scriptText.
 * Generally used to generate bare bones arrays for saving to the project file.
 * @returns [ {scriptText} ]
 */
function m_GetBpScriptList() {
  return [...BPTEXTMAP.values()].map(s => {
    return { scriptText: s };
  });
}

/**
 * Returns array of objects with bpName and scriptText (bpDef).
 * @returns [ {name, scriptText} ]
 */
function m_GetBpNameScriptList() {
  const bpEditList = [];
  BPTEXTMAP.forEach((val, key) => {
    // REVIEW: Also need to stuff in edit status?  (e.g. whehter someone else is editing)
    bpEditList.push({ name: key, scriptText: val });
  });
  return bpEditList;
}

/// API ACCESSORS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies

// /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// DEPRECATED?
// function GetBlueprints() {
//   const blueprints = _getKey('blueprints');
//   return [...blueprints];
// }

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns a single blueprint definition object
 * @param {string} bpName
 * @returns {name, scriptText} - bpDef
 */
function GetBlueprint(bpName) {
  return BPTEXTMAP.get(bpName);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetBlueprintBundle(bpName) {
  return DCENGINE.GetBlueprint(bpName);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns a list of blueprints with names and scriptText for editing by the
 * ScriptEditor.
 * bpEditList does not need to be a state because it is requested by
 * ScriptEditor (via a project-server REQ_PROJDATA call) when it opens.
 * @param {string} projId
 * @returns [ {name, scriptText }]
 */
function GetBpEditList(projId) {
  // REVIEW: Need to look up project?
  const bpEditList = m_GetBpNameScriptList();
  return bpEditList;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of blueprint definitions defined for a project
 * Generally used by selector UI for `bpidList` objects
 * Pass 'blueprint' on initial calls before the key is set
 * @returns [ ...{id, label} ]
 */
function GetBlueprintIDsList(bundles) {
  const bp = bundles || _getKey('blueprints');
  return bp.map(b => {
    // REVIEW: This should be deprecated.  No need to keep separate
    // id and label lists, just a single [bpName] array ought to suffice.
    // This should use blueprint 'name' not the blueprint's gemproj id
    return { id: b.name, label: b.name };
  });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Generates an array of blueprint names as specified in `# BLUEPRINT xxx`
 * from bundles.
 * @returns [...bpName]
 */
function GetBlueprintNamesList(bundles) {
  return bundles.map(b => b.name);
}
function GetBpNamesList() {
  return _getKey('bpNamesList');
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of blueprint ids that have been designated
 * as CharControllable.  Used to populate agent selection on charController.
 * @returns [...id]
 */
function m_GenerateCharControlBpidList(bundles) {
  return bundles
    .filter(bndl => bndl.getTag('isCharControllable'))
    .map(bndl => {
      return bndl.name;
    });
}
function GetCharControlBpidList() {
  return _getKey('charControlBpidList');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of blueprint ids that are PtrackControllable.
 * NOTE: This does not distinguish between people, poses, and objects
 *       If objects and poses need separate tracking, this should be split out
 * @returns [...id]
 */
function m_GeneratePTrackControlBpidList(bundles) {
  return bundles
    .filter(bndl => bndl.getTag('isPTrackControllable'))
    .map(bndl => {
      return bndl.name;
    });
}
function GetPTrackControlBpidList() {
  return _getKey('ptrackControlBpidList');
}
/**
 * Returns the first ptrack controllable blueprint as the default bp to use
 * Used by dc-inputs to determine mapping
 * @returns id
 */
function GetPTrackControlDefaultBpid() {
  const ptrackBpidList = _getKey('ptrackControlBpidList');
  if (ptrackBpidList.length < 1) return undefined;
  return ptrackBpidList[0];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of blueprint ids that are PozyxControllable.
 * @returns [...id]
 */
function m_GeneratePozyxControlBpidList(bundles) {
  return bundles
    .filter(bndl => bndl.getTag('isPozyxControllable'))
    .map(bndl => {
      return bndl.name;
    });
}
function GetPozyxControlBpidList() {
  return _getKey('pozyxControlBpidList');
}
/**
 * Returns the first pozyx controllable blueprint as the default bp to use
 * Used dc-inputs to determine mapping
 * @returns id
 */
function GetPozyxControlDefaultBpid() {
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
function GetBlueprintProperties(bpName) {
  const blueprint = GetBlueprint(bpName);
  if (!blueprint) return []; // blueprint was probably deleted
  // REVIEW: SymbolHelpers might replace this
  return TRANSPILER.ExtractBlueprintProperties(blueprint.scriptText);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetBlueprintPropertiesMap(bpName) {
  const blueprint = GetBlueprint(bpName);
  if (!blueprint) return []; // blueprint was probably deleted
  // REVIEW: SymbolHelpers might replace this
  return TRANSPILER.ExtractBlueprintPropertiesMap(blueprint.scriptText);
}

/// LOADER ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Generate and publish derived blueprint lists from the bundles in DCENGINE.
 * The derived blueprint lists are generally used to populate react UI
 * controllers and components.
 */
function updateAndPublishDerivedBpLists() {
  const bundles = DCENGINE.GetAllBlueprints();
  const bpidList = GetBlueprintIDsList(bundles);
  // update list of blueprint pragma names from compiled bundle
  const bpNamesList = GetBlueprintNamesList(bundles);
  // updating charcontrol
  const charControlBpidList = m_GenerateCharControlBpidList(bundles);
  // updating ptrack
  const ptrackControlBpidList = m_GeneratePTrackControlBpidList(bundles);
  // updating pozyx
  const pozyxControlBpidList = m_GeneratePozyxControlBpidList(bundles);
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
    updateAndPublishDerivedBpLists();
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

function SetBlueprints(projId, blueprints) {
  // 1. Compile the blueprints
  m_ResetAndCompileBlueprints(blueprints);
  // 2. Update state
  // convert to new blueprints format
  const bpScriptList = m_GetBpScriptList();
  updateAndPublish(bpScriptList);
  updateAndPublishDerivedBpLists();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// Used to inject Cursor
/// This runs AFTER other blueprints have been compiled
/// Initiated by mod-sim-control.SimPlaces
///
/// NOTE: Does not trigger state update since this is only used for cursor?
function InjectBlueprint(projId, blueprintDef) {
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

/** Add new blueprint or update existing blueprint */
function UpdateBlueprint(projId, bpName, scriptText) {
  // const blueprints = DCENGINE.GetAllBlueprints();
  // const index = blueprints.findIndex(b => b.name === bpName);
  // let blueprint;
  // if (index > -1) {
  //   // Replace existing blueprint
  //   blueprint = {
  //     ...blueprints[index]
  //   }; // clone
  //   // Update the script
  //   blueprint.scriptText = scriptText;
  //   blueprints[index] = blueprint;
  // } else {
  //   // Add new blueprint
  //   // This is also called if the name of the blueprint changed
  //   // (the old one is deleted)
  //   const def = {
  //     // id: bpid,
  //     // label: bpid,
  //     scriptText
  //   };
  //   blueprint = new Blueprint(def).get();
  //   blueprints.push(blueprint);
  // }

  const def = { scriptText };
  const blueprint = new Blueprint(def).get();
  // 1. Compile the new blueprint
  m_SymbolizeBlueprints([blueprint]);
  m_CompileBlueprints([blueprint]); // add/update BPTEXTMAP as a side effect

  // 2. Update states and derived states
  const bpScriptList = m_GetBpScriptList();
  updateAndPublish(bpScriptList); // triggers write
  updateAndPublishDerivedBpLists();

  // REVIEW: Is this WriteState call necessary if we're already calling updateKey and updateAndPublish?
  // UR.WriteState('blueprints', 'blueprints', blueprints);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function DeleteBlueprint(bpName) {
  BPTEXTMAP.delete(bpName); // local
  DCENGINE.DeleteBlueprint(bpName); // bpBndles
  const bpScriptList = m_GetBpScriptList();
  updateAndPublish(bpScriptList); // triggers write
  updateAndPublishDerivedBpLists();
  // ORIG CODE predating use of BPTEXTMPA and DCENGINE
  //
  // const blueprints = _getKey('blueprints');
  // const index = blueprints.findIndex(b => b.name === bpName);
  // if (index < 0) {
  //   console.warn(...PR(`Trying to delete non-existent bpid ${bpName}`));
  //   return;
  // }
  // blueprints.splice(index, 1);
  // // REVIEW: This can potentially trigger multiple state updates
  // //         See sim-agents.AllAgentsProgram / FilterBlueprints
  // //         Do we need a way to do multiple deletes with a delayed
  // //         state update?
  // UR.WriteState('blueprints', 'blueprints', blueprints);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  // GetBlueprints, // deprecated
  GetBlueprint,
  GetBlueprintBundle,
  // Derived Blueprint Lists
  GetBpEditList, // used by ScriptEditor to display list of bp to edit
  GetBlueprintIDsList,
  GetBlueprintNamesList,
  GetBpNamesList,
  GetCharControlBpidList,
  GetPTrackControlBpidList,
  GetPTrackControlDefaultBpid,
  GetPozyxControlBpidList,
  GetPozyxControlDefaultBpid,
  GetBlueprintProperties,
  GetBlueprintPropertiesMap,
  // Updaters
  SetBlueprints,
  InjectBlueprint,
  UpdateBlueprint,
  DeleteBlueprint
};
