/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage blueprints lists

  Because blueprint names are determined by the `# BLUEPRINT` pragma and
  may change, the `name` may change any time the script is changed.
  So we retrieve and update the name after compiling the blueprint script.

  For historical reasons, we used a blueprint `id` field in the gemproj file
  and there are still some artifacts of that approach in the code.  These
  will eventually be removed with a proper refactor.


  There are two main blueprint stores the maintain different types of
  blueprint data:

  1. 'bpDefs' state -- An array of gemproj *bpDef* data objects
              e.g. [{name, scriptText},...]
              The raw scriptText is needed for script editing via ScriptEditor
              and for saving blueprints to the gemproj project file.

  2. DCENGINE.BLUEPRINTS -- A map of compiled blueprint *bundles* indexed by bpName
              The bundles are used to extract the name of blueprints, and
              the sim engine uses the bundles to run gemscript programs.
              The compiled blueprint bundles are stored in dc-sim-resources.


  Nomenclature:
  x `bpid`    DEPRECATED!!!!  'bpid' is the unique id of the blueprint in the .gemproj file

              We used to use this to look up blueprints.  In general
              references to 'bpid' should be references to 'bpName'

  * 'bpName'  is the name of the blueprint defined by the blueprint pragma
              e.g. `# BLUEPRINT Moth` bpName = Moth

  * `bpDef`   This is a `TBlueprint`
              bpDef is a wrapper object around scriptText intended to make it
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
                editor: string // not implemented
              }, ... ]

  See also:
  * ac-project
  * dc-sim-resources

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TBlueprint } from 'lib/t-assets.d';
import { ISMCBundle } from 'lib/t-script.d';
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

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('blueprints');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
  // db states
  bpDefs: [], // [{name, scriptText},...] raw blueprint script text used for saving to gemproj file
  // runtime states derived from bpDefs or bpBundles
  bpNamesList: [],
  defaultPozyxBpid: '',
  charControlBpNames: [],
  ptrackControlBpNames: [],
  pozyxControlBpNames: []
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

/** Helper function to merge a new 'bpDef' into 'bpDef's either by:
 *  --  replacing existing bpDef
 *  --  or, inserting a new bpDef
 *  @returns {TBlueprint[]} - bpDefs with new bpDef added/updated
 */
function m_MergeBlueprint(bpDef: TBlueprint, bpDefs: TBlueprint[]): TBlueprint[] {
  const i = bpDefs.findIndex(b => b.name === bpDef.name);
  if (i > -1) {
    bpDefs.splice(i, 1, bpDef); // replace existing
  } else {
    bpDefs.push(bpDef); // insert new
  }
  return bpDefs;
}

/** Blueprint symbols need to be extracted before they are compiled */
function m_SymbolizeBlueprints(blueprints: TBlueprint[]) {
  blueprints.forEach(b => {
    // symbolizeBlueprintHelper in transpiler?
  });
}

/**
 * Use this to compile and add additional blueprints to an already running sim
 * 1. Compiles blueprints
 * 2. Registers blueprint with dc-sim-resources
 * NOTE Does NOT update state!!!
 * NOTE Returns a valid bpDefs array -- use this to convert old gemproj files
 *      that may or may use a blueprint 'id' instead of 'name'
 * @param {TBlueprint[]} bpDefs - array of blueprint definitions [ {name?, scriptText} ]
 *                       Accepts old gemproj files that use 'id' instead of 'name'
 * @returns {TBlueprint[]} - bpDefs that all use 'name', not 'id'
 */
function m_CompileBlueprints(bpDefs: TBlueprint[]): TBlueprint[] {
  return bpDefs.map(b => {
    const script = TRANSPILER.TextToScript(b.scriptText);
    const bundle = TRANSPILER.CompileBlueprint(script);
    TRANSPILER.RegisterBlueprint(bundle); // Save to datacore
    return { name: bundle.name, scriptText: b.scriptText };
  });
}

/**
 * Use this when reseting the simulation.
 * Clears all ScriptEvents, Blueprints, Agents, and Instances
 * and THEN compiles blueprints.
 * NOTE This will accept old gemproj blueprint formats with "id" and return it converted to "name"
 * @param {TBlueprint[]} blueprints - array of blueprint definitions [ {name, scriptText} ]
 * @returns {TBlueprint[]} - bpDefs that all use 'name', not 'id'
 */
function m_ResetAndCompileBlueprints(blueprints: TBlueprint[]): TBlueprint[] {
  GAgent.ClearGlobalAgent();
  SIMAGENTS.ClearDOBJ();
  DCENGINE.DeleteAllScriptEvents();
  DCENGINE.DeleteAllBlueprints();
  DCAGENTS.DeleteAllAgents();
  DCAGENTS.DeleteAllInstances();
  m_SymbolizeBlueprints(blueprints);
  return m_CompileBlueprints(blueprints);
}

/// API ACCESSORS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Returns a single blueprint definition object
 *  @param {string} projId
 *  @returns {TBlueprint[]}[ {name, scriptText }]
 */
function GetBpDefs(projId: string): TBlueprint[] {
  // REVIEW NOTE this should support getting a list of blueprints for a specific
  // project that is NOT the CURRENT_PROJECT.
  return _getKey('bpDefs');
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Returns a single blueprint definition object
 *  @param {string} bpName
 *  @returns {TBlueprint} {name, scriptText} - bpDef
 */
function GetBlueprint(bpName: string): TBlueprint {
  return _getKey('bpDefs').find(b => b.name === bpName);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Returns a single blueprint bundle object
 *  @param {string} bpName
 *  @returns {ISMCBundle} f
 */
function GetBlueprintBundle(bpName: string): ISMCBundle {
  return DCENGINE.GetBlueprint(bpName);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Returns a list of blueprints with names and scriptText.
 *  Requested by ScriptEditor (via project-server) to display of list of
 *  editable blueprints.
 *  @param {string} projId
 *  @returns {TBlueprint[]} [ {name, scriptText }]
 */
function GetBpEditList(projId: string): TBlueprint[] {
  // REVIEW NOTE this should support getting a list of blueprints for a specific
  // project that is NOT the CURRENT_PROJECT.
  // REVIEW: Currently does not return info about openeditors, but it should
  return _getKey('bpDefs');
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Generates an array of blueprint names (as specified in `# BLUEPRINT xxx`)
 * from bundles.
 * @returns {string[]} - [ bpName ]
 */
function m_ExtractBlueprintNamesList(bundles: ISMCBundle[]): string[] {
  return bundles.map(b => b.name);
}
/** API: Used by mod-sim-control to get array of bpNames for AllAgentsProgram
 *  to know which blueprints to create agents for.
 *  @returns {string[]} - [ bpName ]
 */
function GetBpNamesList(): string[] {
  return _getKey('bpNamesList');
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Generates an array of blueprint names that have been tagged
 * as CharControllable by inspecting the bundle.
 * Used to populate agent selection on charController.
 * @returns {string[]} - [ name ]
 */
function m_GenerateCharControlBpNames(bundles: ISMCBundle[]): string[] {
  return bundles
    .filter(bndl => bndl.getTag('isCharControllable'))
    .map(bndl => {
      return bndl.name;
    });
}
/** API: Returns array of blueprint names that are CharControllable.
 * @returns {string[]} - [ name ]
 */
function GetCharControlBpNames(): string[] {
  return _getKey('charControlBpNames');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Generates an array of blueprint names that have been tagged
 * as Ptrack controllable by inspecting the bundle.
 * NOTE: This does not distinguish between people, poses, and objects
 *       If objects and poses need separate tracking, this should be split out
 * @return {string[]} - [ bpName ]
 */
function m_GeneratePTrackControlBpNames(bundles: ISMCBundle[]): string[] {
  return bundles
    .filter(bndl => bndl.getTag('isPTrackControllable'))
    .map(bndl => {
      return bndl.name;
    });
}
/** API: Returns array of blueprint names that are PTrack controllable.
 * @returns {string[]} - [ bpName ]
 */
function GetPTrackControlBpNames(): string[] {
  return _getKey('ptrackControlBpNames');
}
/**
 * API: returns the first ptrack controllable blueprint name as the default bp to use
 * Used by dc-inputs to determine mapping of inputs to agents
 * @returns {string} - bpName
 */
function GetPTrackControlDefaultBpName(): string {
  const ptrackBpNames = _getKey('ptrackControlBpNames');
  if (ptrackBpNames.length < 1) return undefined;
  return ptrackBpNames[0];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Generates an array of blueprint names that have been tagged
 * as Pozyx controllable by inspecting the bundle.
 * @returns {string[]} - [ bpName ]
 */
function m_GeneratePozyxControlBpNames(bundles: ISMCBundle[]): string[] {
  return bundles
    .filter(bndl => bndl.getTag('isPozyxControllable'))
    .map(bndl => {
      return bndl.name;
    });
}
/** API: Returns array of blueprint names that are Pozyx controllable.
 *  @returns {string[]} - [ bpName ]
 */
function GetPozyxControlBpNames(): string[] {
  return _getKey('pozyxControlBpNames');
}
/**
 * API: Returns the first pozyx controllable blueprint name as the default bp to use
 * Used dc-inputs to determine mapping
 * @returns {string} - bpName
 */
function GetPozyxControlDefaultBpName(): string {
  const pozyxBpNames = _getKey('pozyxControlBpNames');
  if (pozyxBpNames.length < 1) return undefined;
  return pozyxBpNames[0];
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * API: Returns array of properties {name, type, defaultvalue, isFeatProp}
 * that have been defined by the blueprint.
 * Used to populate property menus when selecting properties to show
 * in InstanceInspectors
 * @param {string} bpName
 * @return {Object[]} [...{ name, type, defaultValue, isFeatProp }]
 */
function GetBlueprintProperties(bpName: string): object[] {
  const blueprint = GetBlueprint(bpName);
  if (!blueprint) return []; // blueprint was probably deleted
  // REVIEW: SymbolHelpers might replace this
  return TRANSPILER.ExtractBlueprintProperties(blueprint.scriptText);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Parses the blueprint scriptText to find the properties that
 *  have been defined.  Used by instanceEditor to display current
 *  instance properties.
 */
function GetBlueprintPropertiesMap(bpName: string): Map<string, object> {
  const blueprint = GetBlueprint(bpName);
  if (!blueprint) return new Map(); // blueprint was probably deleted
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
  const bpNamesList = m_ExtractBlueprintNamesList(bundles);
  const charControlBpNames = m_GenerateCharControlBpNames(bundles);
  const ptrackControlBpNames = m_GeneratePTrackControlBpNames(bundles);
  const pozyxControlBpNames = m_GeneratePozyxControlBpNames(bundles);
  updateKey({
    bpNamesList,
    charControlBpNames,
    ptrackControlBpNames,
    pozyxControlBpNames
  });
  _publishState({
    bpNamesList,
    charControlBpNames,
    ptrackControlBpNames,
    pozyxControlBpNames
  });
}

/// Update the main blueprint property
function updateAndPublishBpDefs(bpDefs: TBlueprint[]) {
  updateKey({ bpDefs });
  _publishState({ bpDefs });
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
  // return undefined;
  if (key === 'bpDefs') {
    const blueprints = propOrValue;
    // update datacore
    DCPROJECT.UpdateProjectData({ blueprints }); // note blueprints:blueprints object
    // update and publish bpidList too
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
  if (effectKey === 'bpDefs') {
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

/** API: Use this to initialize the state
 *  Called by ac-project with gemproj data
 *  @param {[]} blueprints - Array of {name, scripText} from gemproj file
 */
function SetBlueprints(projId: string, blueprints: TBlueprint[]) {
  // 1. Compile the blueprints
  //    Converts old gemproj data format -- 'id' => 'name'
  const bpDefs = m_ResetAndCompileBlueprints(blueprints);
  // 2. Update datacore
  DCPROJECT.UpdateProjectData({ blueprints }); // note blueprints:blueprints object

  // 3. Update state
  updateAndPublishBpDefs(bpDefs);
  updateAndPublishDerivedBpLists();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Used to inject Cursor
 *  This runs AFTER other blueprints have been compiled
 *  Initiated by mod-sim-control.SimPlaces
 *
 *  NOTE: Does not trigger state update since this is only used for cursor?
 */
function InjectBlueprint(projId: string, bpDef: TBlueprint) {
  // Add new blueprint
  const def = {
    scriptText: bpDef.scriptText
  };
  const bp = new Blueprint(def);
  // 1. Compile just the injected blueprints
  m_SymbolizeBlueprints([bp]);
  m_CompileBlueprints([bp]);
  // NOTE: Not updating 'blueprints' state, nor writing to db
  // because this is used to insert cursors, which do not need a UI
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Add new blueprint or update existing blueprint */
function UpdateBlueprint(projId: string, bpName: string, scriptText: string) {
  const def = { scriptText };
  const bpDef = { name: bpName, scriptText };
  // 1. Compile the new blueprint
  m_SymbolizeBlueprints([bpDef]);
  m_CompileBlueprints([bpDef]); // add/update BPTEXTMAP as a side effect

  // 2. Update states and derived states
  const bpDefs = m_MergeBlueprint(bpDef, _getKey('bpDefs'));
  UR.WriteState('blueprints', 'bpDefs', bpDefs);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: */
function DeleteBlueprint(bpName: string) {
  // 1. Remove from DCEngine
  DCENGINE.DeleteBlueprint(bpName); // bpBndles

  // 2. Update states and derived states
  const bpDefs = _getKey('bpDefs').filter(b => b.name !== bpName);
  UR.WriteState('blueprints', 'bpDefs', bpDefs);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  GetBpDefs,
  GetBlueprint,
  GetBlueprintBundle,
  // Derived Blueprint Lists
  GetBpEditList, // used by ScriptEditor to display list of bp to edit
  GetBpNamesList,
  GetCharControlBpNames,
  GetPTrackControlBpNames,
  GetPTrackControlDefaultBpName,
  GetPozyxControlBpNames,
  GetPozyxControlDefaultBpName,
  GetBlueprintProperties,
  GetBlueprintPropertiesMap,
  // Updaters
  SetBlueprints,
  InjectBlueprint,
  UpdateBlueprint,
  DeleteBlueprint
};
