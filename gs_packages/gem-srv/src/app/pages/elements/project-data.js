/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Data - Data Module for Mission Control

  This loads and manages the project definition data, specifically:
  * blueprints
  * instance defintions

  NOTE: This should NOT be used directly by ScriptEditor or PanelScript!!!

  Currently this is a placeholder class.  No data is saved between sessions.
  Eventually it will communicate with as erver database.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import UR from '@gemstep/ursys/client';
import * as TRANSPILER from 'script/transpiler';
import {
  DeleteInstance,
  GetAllAgents,
  GetAgentById,
  DeleteAgent,
  GetInstancesType
} from 'modules/datacore/dc-agents';
import { POZYX_TRANSFORM, InputsReset } from 'modules/datacore/dc-inputs';
import {
  PROJECT,
  LoadProject,
  GetProject,
  UpdateDCModel,
  GetBoundary,
  GetBlueprintProperties
} from 'modules/datacore/dc-project';
import * as INPUT from 'modules/input/api-input';
import { ReportMemory } from 'modules/render/api-render';
import { IsRunning, RoundsCompleted } from 'modules/sim/api-sim';

import { ReadProjectsList, ReadProject } from './project-db';

const merge = require('deepmerge');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ProjectData');
const DBG = false;

let CURRENT_MODEL_ID;
let CURRENT_MODEL;
const MONITORED_INSTANCES = [];

/// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

let SEED = 100; // ids for instances created via SETUP
function m_GetUID() {
  return String(SEED++);
}

function getLocaleIdFromLocalStorage() {
  const localeId = localStorage.getItem('localeId');
  return Number(localeId !== null ? localeId : 4);
}
function saveLocaleIdToLocalStorage(id) {
  localStorage.setItem('localeId', id);
}

/// PROJECT DATA INIT /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function ProjectDataInit() {
  UR.SubscribeState('locales', HandleLocaleUpdated);

  // Load currently saved locale
  const localeId = getLocaleIdFromLocalStorage();
  UR.WriteState('locales', 'localeId', localeId);
}

function HandleLocaleUpdated(stateObj, cb) {
  console.error('locale updated', stateObj);

  // if update was to localeID, save localeID to localStorage
  if (stateObj.localeId) saveLocaleIdToLocalStorage(stateObj.localeId);

  // Read the current transforms
  const state = UR.ReadFlatStateGroups('locales');

  // Copy to POZYX_TRANSFORM
  const data = state.transform;
  POZYX_TRANSFORM.scaleX = data.xScale;
  POZYX_TRANSFORM.scaleY = data.yScale;
  POZYX_TRANSFORM.translateX = data.xOff;
  POZYX_TRANSFORM.translateY = data.yOff;
  POZYX_TRANSFORM.useAccelerometer = data.useAccelerometer;
}

/// API CALLS: MODEL DATA REQUESTS ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// 1. Reads project from db
/// 2. Updates dc-project data
export async function LoadProject(modelId) {
  CURRENT_MODEL_ID = modelId;
  CURRENT_MODEL = await ReadProject(modelId);
  UpdateDCModel(CURRENT_MODEL);
  UR.HookPhase('SIM/UI_UPDATE', this.SendInspectorUpdate);
  return CURRENT_MODEL;
}
/// Retrieves cached model or reads from db
function GetProject(modelId = CURRENT_MODEL_ID) {
  if (!modelId) throw new Error('Tried to GetProject before setting modelId');
  if (modelId === CURRENT_MODEL_ID) return CURRENT_MODEL;
  return ReadProject(modelId);
}
/// Used for URSYS requests for full project data, e.g. Viewer
function GetCurrentModelData() {
  return {
    modelId: CURRENT_MODEL_ID,
    model: CURRENT_MODEL
  };
}
/// Used to inject the Cursor blueprint
export function InjectBlueprint(data) {
  const blueprint = data.script;
  // Skip if already defined
  if (CURRENT_PROJECT.blueprints.find(s => s.id === blueprint.id)) return;
  CURRENT_PROJECT.blueprints.push(blueprint);
  const source = TRANSPILER.ScriptifyText(blueprint.scriptText);
  const bundle = TRANSPILER.CompileBlueprint(source);
  TRANSPILER.RegisterBlueprint(bundle);
}

/// TRANSFORM UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HandlePozyxTransformSet(data) {
  if (data.scaleX !== undefined) POZYX_TRANSFORM.scaleX = Number(data.scaleX);
  if (data.scaleY !== undefined) POZYX_TRANSFORM.scaleY = Number(data.scaleY);
  if (data.translateX !== undefined)
    POZYX_TRANSFORM.translateX = Number(data.translateX);
  if (data.translateY !== undefined)
    POZYX_TRANSFORM.translateY = Number(data.translateY);
  if (data.rotate !== undefined) POZYX_TRANSFORM.rotate = Number(data.rotate);
  if (data.useAccelerometer !== undefined)
    POZYX_TRANSFORM.useAccelerometer = Boolean(data.useAccelerometer);
  UR.RaiseMessage('NET:POZYX_TRANSFORM_UPDATE', { transform: POZYX_TRANSFORM });
}
function HandlePozyxTransformReq() {
  return { transform: POZYX_TRANSFORM };
}
/// MODEL UPDATE BROADCASTERS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RaiseModelsUpdate() {
  const models = ReadProjectsList();
  UR.RaiseMessage('LOCAL:UPDATE_MODELS', { models });
}
function RaiseModelUpdate(modelId = CURRENT_MODEL_ID) {
  const model = GetProject(modelId);
  UpdateDCModel(model); // update dc-project
  // MissionControl instances need to be updated as well.
  UR.RaiseMessage('NET:UPDATE_MODEL', { modelId, model });
}

function GetBpidList(projId = CURRENT_PROJECT_ID) {
  const bpidList = PROJECT.GetBlueprintIDsList();
  console.error('GetBpidList', bpidList);
  return { projId, bpidList };
}
function RaiseBpidListUpdate(projId = CURRENT_PROJECT_ID) {
  UR.RaiseMessage('NET:BPIDLIST_UPDATE', this.GetBpidList(projId));
}
function GetInstancesList(projId = CURRENT_PROJECT_ID) {
  const instancesList = PROJECT.GetInstancesList();
  return { projId, instancesList };
}
function RaiseInstancesListUpdate(projId = CURRENT_PROJECT_ID) {
  UR.RaiseMessage('NET:INSTANCESLIST_UPDATE', this.GetInstancesList(projId));
}

/// API CALLS: BLUEPRINT DATA REQUESTS ////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Used by InstanceEditor and props.tsx to look up property types
 * NOTE: Non-MissionControl panels should always call this with a
 * modelId, since currentModelId may not be set.
 * @param {string} blueprintName
 * @param {string} modelId
 * @return {map} [ ...{name: type}]
 */
function GetBlueprintPropertiesTypeMap(
  blueprintName,
  modelId = CURRENT_MODEL_ID
) {
  if (modelId === '')
    console.error(
      'GetBlueprintPRopertiesTypeMap needs to specify modelId -- You are probably calling this from PanelScript!'
    );
  const properties = GetBlueprintProperties(blueprintName, modelId);
  const map = new Map();
  properties.forEach(p => map.set(p.name, p.type));
  return map;
}
/**
 * Returns array of blueprint names that are controllable by user input.
 * Used to set sim-inputs and CharControl.
 * CharControl requests this list directly via REQ:PROJ_DATA
 * @return {string[]} [ ...bpid ]
 */
function GetCharControlBpidList() {
  return PROJECT.GetCharControlBpidList();
}
function GetPozyxBPNames() {
  return PROJECT.GetPozyxControlBpidList();
}
/**
 * Removes the script from `model` and related `model.instances`
 * Does not remove sim instances/agents.
 * @param {string} blueprintName
 */
function BlueprintDelete(blueprintName, modelId = CURRENT_PROJECT_ID) {
  const model = GetProject(modelId);
  // 1. Delete the old blueprint from model
  const index = model.blueprints.findIndex(s => s.id === blueprintName);
  if (index > -1) {
    // Remove existing blueprint
    model.blueprints.splice(index, 1);
  }
  // 2. Delete any existing instances from model definition
  model.instances = model.instances.filter(i => i.blueprint !== blueprintName);
  // 3. REVIEW: Write changes to DB???
}
function HandleBlueprintDelete(data) {
  BlueprintDelete(data.blueprintName, data.modelId);
  RaiseModelUpdate();
  RaiseBpidListUpdate();
}

/// INSTANCE SPEC UTILS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// This handles the editing of the <project>.js file's `instances` object
/// specification.  It does not create actual agent instances.
/**
 * Used by InstanceUpdatePosition to find and replace existing
 * prop setting lines.
 * @param {string} propName -- Name of the prop to change, e.g. x/y
 * @param {string} propMethd -- Prop method to change, e.g. setTo
 * @param {string} params -- Parameter for the prop method, e.g. 200
 * @param {string[]} scriptTextLines -- Full ScriptText as an array of strings
 */
function ReplacePropLine(propName, propMethod, params, scriptTextLines) {
  const lineNumber = scriptTextLines.findIndex(line => {
    let found = line.includes(`prop ${propName} ${propMethod}`);
    if (!found) found = line.includes(`prop agent.${propName} ${propMethod}`);
    return found;
  });
  const newLine = `prop ${propName} ${propMethod} ${params}`;
  if (lineNumber === -1) {
    console.warn(
      `project-data.ReplacePositionLine: No "prop ${propName} ${propMethod}..." line found.  Inserting new line.`
    );
    scriptTextLines.push(newLine);
  } else {
    scriptTextLines[lineNumber] = newLine;
  }
}
/**
 *
 * @param {Object} data -- { modelId, blueprintName, initScript }
 */
export function InstanceAdd(data, sendUpdate = true) {
  console.log('...InstanceAdd', data);
  const model = GetProject(data.modelId);
  console.log('....model is ', model);
  const instance = {
    id: m_GetUID(),
    name: `${data.blueprintName}${model.instances.length}`,
    blueprint: data.blueprintName,
    initScript: data.initScript
  };

  // If blueprint has `# PROGRAM INIT` we run that
  // otherwise we auto-place the agent around the center of the screen
  const blueprint = model.blueprints.find(s => s.id === data.blueprintName);
  const hasInit = TRANSPILER.HasDirective(blueprint.script, 'INIT');
  const SPREAD = 100;
  if (!hasInit && !instance.initScript) {
    instance.initScript = `prop x setTo ${Math.trunc(RNG() * SPREAD - SPREAD / 2)}
prop y setTo ${Math.trunc(RNG() * SPREAD - SPREAD / 2)}`;
  }

  model.instances.push(instance);
  //
  // REVIEW
  // This needs to send data to db
  //
  if (sendUpdate) {
    RaiseModelUpdate(data.modelId);
    RaiseInstancesListUpdate();
  }
}
/**
 *
 * @param {Object} data -- { modelId, instanceId, instanceName, updatedData }
 * where `updatedData` = { initScript } -- initScript is scriptText.
 *                 Leave instanceName or instanceInit undefined
 *                 if they're not being set.
 */
export function InstanceUpdate(data) {
  const model = GetProject(data.modelId);
  const instanceIndex = model.instances.findIndex(i => i.id === data.instanceId);
  const instance = model.instances[instanceIndex];
  instance.name = data.instanceName || instance.name;
  instance.initScript =
    data.instanceInit !== undefined // data.instanceInit might be ''
      ? data.instanceInit
      : instance.initScript;
  model.instances[instanceIndex] = instance;
  RaiseModelUpdate(data.modelId);
  RaiseInstancesListUpdate();
}
/**
 * HACK: Manually change the init script when updating position.
 * This is mostly used to support drag and drop
 * @param {Object} data -- { modelId, instanceId, updatedData: {x, y} }
 */
export function InstanceUpdatePosition(data) {
  const model = GetProject(data.modelId);
  const instanceIndex = model.instances.findIndex(i => i.id === data.instanceId);
  const instance = model.instances[instanceIndex];
  if (!instance) return; // Pozyx/PTrack instances are not in model.instances, so ignore
  let scriptTextLines = instance.initScript
    ? instance.initScript.split('\n')
    : [];
  ReplacePropLine('x', 'setTo', data.updatedData.x, scriptTextLines);
  ReplacePropLine('y', 'setTo', data.updatedData.y, scriptTextLines);
  const scriptText = scriptTextLines.join('\n');
  instance.initScript = scriptText;
  model.instances[instanceIndex] = instance;
  RaiseModelUpdate(data.modelId);
  RaiseInstancesListUpdate();
}
/**
 * User is requesting to edit an instance
 * Can be triggered by:
 *   * Simulation View: Clicking on an instance in simulation
 *   * Map Instances View: Clicking on an instance in list
 * @param {object} data -- {modelId, agentId}
 */
export function InstanceRequestEdit(data) {
  // 0. Check for Locking
  //    TODO: Prevent others from editing?
  //          May not be necessary if we only allow one map editor
  // 1. Set Agent Data
  const agent = GetAgentById(data.agentId);
  // 2. If already selected, deselect it.
  if (agent.isSelected) {
    // 2a. Deselect it
    agent.setSelected(false);
    // Update UI
    UR.RaiseMessage('INSTANCE_EDIT_DISABLE', data);
  } else {
    // 2b. Select it for editing
    agent.setSelected(true);
    // Update UI
    UR.RaiseMessage('INSTANCE_EDIT_ENABLE', data);
  }
}
/**
 *
 * @param {Object} data -- { modelId, instanceDef }
 */
export function InstanceDelete(data) {
  // Remove from Blueprint
  const model = GetProject(data.modelId);
  const instanceIndex = model.instances.findIndex(
    i => i.id === data.instanceDef.id
  );
  model.instances.splice(instanceIndex, 1);

  // Remove from Sim
  DeleteInstance(data.instanceDef);
  DeleteAgent(data.instanceDef);
  RaiseModelUpdate(data.modelId);
  RaiseInstancesListUpdate();

  // REVIEW
  // Update the DB!
}

/// API CALLS: SCRIPT DATA REQUESTS ////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Scrubs the init script and removes any invalid props
 * Used by ScriptUpdate in case edit removed props that are no longer valid
 * Should ignore featProps and other calls
 * @param {object} instance instanceDef from models.instances
 * @param {string[]} validPropNames e.g. ['x', 'y']
 * @return {object} InstanceDef with init scrubbed
 */
function m_RemoveInvalidPropsFromInstanceInit(instance, validPropNames) {
  const scriptUnits = TRANSPILER.ScriptifyText(instance.initScript);
  const scrubbedScriptUnits = scriptUnits.filter(unit => {
    if (unit[0] && unit[0].token === 'prop') {
      return validPropNames.includes(unit[1].token);
    }
    return true; // ignore other methods
  });
  instance.initScript = TRANSPILER.TextifyScript(scrubbedScriptUnits);
  return instance;
}

/**
 * Update the script for a single blueprint (not all blueprints in the model)
 * This should just update the `model.scripts` and `model.instances` data.
 * Any sim instance/agent data updates should be hanlded by sim-agents.
 * ASSUMES: Updating the current model
 * @param {Object} data -- { script, origBlueprintName }
 */
function ScriptUpdate(data) {
  const model = GetProject();
  const source = TRANSPILER.ScriptifyText(data.script);
  const bundle = TRANSPILER.CompileBlueprint(source); // compile to get name
  const blueprintName = bundle.name;

  // 1. Did the blueprint name change?
  if (data.origBlueprintName !== blueprintName) {
    // If name changed, remove the original
    BlueprintDelete(data.origBlueprintName);
    // NOTE sim agents and instances are added/removed in sim-agents.AllAgentsProgramUpdate
  }

  // 2. Update the new blueprint
  let blueprint;
  const index = model.blueprints.findIndex(s => s.id === blueprintName);
  if (index > -1) {
    // Replace existing blueprint
    // 1. Clone all properties
    blueprint = merge.all([model.blueprints[index]]);
    // 2. Modify new propreites
    blueprint.id = blueprintName;
    blueprint.label = blueprintName;
    // 3. Replace the script
    blueprint.script = data.script;
    // Replace existing blueprint
    model.blueprints[index] = blueprint;
  } else {
    // Add new blueprint
    blueprint = {
      id: blueprintName,
      label: blueprintName,
      // REVIEW: Need to set isControllable here?
      // For now automatically make it controllable.
      isControllable: true,
      script: data.script
    };
    // New Blueprint
    model.blueprints.push(blueprint);
  }

  // 3. Clean the init scripts
  const validPropDefs = TRANSPILER.ExtractBlueprintProperties(data.script);
  const validPropNames = validPropDefs.map(d => d.name);
  model.instances = model.instances.map(i => {
    // Only clean init scripts for the submitted blueprint
    if (i.blueprint !== blueprintName) return i;
    return m_RemoveInvalidPropsFromInstanceInit(i, validPropNames);
  });

  // 4. Delete the old instance
  //    If the sim is not running, delete the old instance
  //    so AllAgentsPropgramUpdate will recreate it with
  //    the new script.
  //    If the sim IS running, we want to leave the instance
  //    running with the old blueprint code.
  if (!IsRunning() && RoundsCompleted()) {
    GetInstancesType(blueprintName).forEach(a => DeleteAgent(a));
    // Also delete input agents
    InputsReset();
  }

  // DEPRECATED
  // This was helpful for early testing
  //
  // // 5. Add an instance if one isn't already defined
  // // Should not affect running sim until reset
  // const bp = TRANSPILER.RegisterBlueprint(bundle);
  // const instancesSpec = model.instances.filter(i => i.blueprint === bp.name);
  // if (instancesSpec.length < 1) {
  //   // If the map has not been defined yet, then generate a single instance
  //   // instancesSpec.push({ name: `${bp.name}01`, init: '' });
  //   InstanceAdd(
  //     {
  //       modelId: CURRENT_MODEL_ID,
  //       blueprintName: bp.name
  //     },
  //     false
  //   );
  // }

  RaiseModelUpdate();
  RaiseBpidListUpdate();
  RaiseInstancesListUpdate();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RoundUpdate(data) {
  const model = GetProject();
  const round = data.round;
  model.rounds.roundDefs = model.rounds.roundDefs.map(r => {
    return r.id === round.id ? round : r;
  });
  RaiseModelUpdate();
}

/// INSPECTOR UTILS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * On every system loop, we broadcast instance updates
 * for any instances that have registered for modeling.
 * We keep this list small to keep from flooding the net with data.
 */
export function SendInspectorUpdate(frametime) {
  if (frametime % 30 !== 0) return;
  // walk down agents and broadcast results for monitored agents
  const agents = GetAllAgents();
  // Send all instances, but minmize non-monitored
  const inspectorAgents = agents.map(a =>
    MONITORED_INSTANCES.includes(a.id)
      ? a
      : { id: a.id, name: a.name, blueprint: a.blueprint }
  );

  // Debug PIXI Output
  // if (DBG) ReportMemory(frametime);

  // Broadcast data
  UR.RaiseMessage('NET:INSPECTOR_UPDATE', { agents: inspectorAgents });
}
/**
 * PanelSimulation keeps track of any instances that have been requested
 * for inspector monitoring.
 * We allow duplicate registrations so that when one device unregisters,
 * the instance is still considered monitored.
 * @param {Object} data { name: <string> } where name is the agent name.
 */
export function DoRegisterInspector(data) {
  const id = data.id;
  MONITORED_INSTANCES.push(id);
  // force inspector update immediately so that the inspector
  // will open up.  otherwise there is a 1 second delay
  SendInspectorUpdate(30);
}
export function DoUnRegisterInspector(data) {
  const id = data.id;
  const i = MONITORED_INSTANCES.indexOf(id);
  if (i > -1) MONITORED_INSTANCES.splice(i, 1);
}

/// INSTANCE SELECTION HANDLERS ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Toggles the selection state of the agent
 * @param {object} data -- {modelId, agentId}
 */
export function InstanceSelect(data) {
  const agent = GetAgentById(data.agentId);
  agent.setSelected(true);
}
/**
 * Deselects the selection state of the agent
 * @param {object} data -- {modelId, agentId}
 */
export function InstanceDeselect(data) {
  const agent = GetAgentById(data.agentId);
  if (agent) {
    // agent may have been deleted, so make sure it still exists
    agent.setSelected(false);
  }
}
/**
 * Turns hover on
 * @param {object} data -- {modelId, agentId}
 */
export function InstanceHoverOver(data) {
  const agent = GetAgentById(data.agentId);
  if (agent) {
    // agent may have been deleted, so make sure it still exists
    agent.setHovered(true);
  }
}
/**
 * Turns hover off
 * @param {object} data -- {modelId, agentId}
 */
export function InstanceHoverOut(data) {
  const agent = GetAgentById(data.agentId);
  if (agent) {
    // agent may have been deleted, so make sure it still exists
    agent.setHovered(false);
  }
}

/// URSYS MODEL DATA REQUESTS//////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Flexible Project Data Requester
 * 1. Checks if the passed request is a valid function
 * 2. If so, execute it.
 * @param {*} data
 * @returns
 */
/// Functions that are allowed to be requested via `NET:REQ_PROJDATA`
const API_PROJDATA = [
  'ReadProjectsList',
  'GetProject',
  'GetCurrentModelData',
  'GetProjectBoundary',
  'GetCharControlBpidList',
  'GetBlueprintProperties',
  'GetBpidList',
  'GetInstancesList'
];
/// Map mod.<functionName> so they can be called by HandleREquestProjData
const mod = {};
mod.ReadProjectsList = ReadProjectsList;
mod.GetProject = GetProject;
mod.GetCurrentModelData = GetCurrentModelData;
mod.GetProjectBoundary = GetBoundary; // Mapping clarifies target
mod.GetCharControlBpidList = GetCharControlBpidList;
mod.GetBlueprintProperties = GetBlueprintProperties;
mod.GetBpidList = GetBpidList;
mod.GetInstancesList = GetInstancesList;
/// Call Handler
function HandleRequestProjData(data) {
  if (DBG) console.log('NET:REQ_PROJDATA got request', data);
  if (!data.fnName) {
    console.error(...PR('NET:REQ_PROJDATA got bad function name', data.fnName));
    return { result: undefined };
  }
  if (!API_PROJDATA.includes(data.fnName)) {
    console.error(
      ...PR(`NET:REQ_PROJDATA Calling ${data.fnName} is not allowed!`)
    );
    return { result: undefined };
  }
  const fn = mod[data.fnName]; // convert into a function
  if (typeof fn === 'function') {
    let res;
    if (data.parms && Array.isArray(data.parms)) res = fn(...data.parms);
    else res = fn();
    return { result: res };
  }
  return { result: undefined };
}

/// UR HANDLERS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// TRANSFORM UTILS -----------------------------------------------------------
UR.HandleMessage('NET:POZYX_TRANSFORM_SET', HandlePozyxTransformSet);
UR.HandleMessage('NET:POZYX_TRANSFORM_REQ', HandlePozyxTransformReq);
/// PROJECT DATA UTILS ----------------------------------------------------
UR.HandleMessage('REQ_PROJDATA', HandleRequestProjData);
UR.HandleMessage('NET:REQ_PROJDATA', HandleRequestProjData);
UR.HandleMessage('NET:SCRIPT_UPDATE', ScriptUpdate);
UR.HandleMessage('NET:ROUND_UPDATE', RoundUpdate);
UR.HandleMessage('NET:BLUEPRINT_DELETE', HandleBlueprintDelete);
UR.HandleMessage('INJECT_BLUEPRINT', InjectBlueprint);
/// INSTANCE EDITING UTILS ----------------------------------------------------
UR.HandleMessage('LOCAL:INSTANCE_ADD', InstanceAdd);
UR.HandleMessage('NET:INSTANCE_UPDATE', InstanceUpdate);
UR.HandleMessage('NET:INSTANCE_UPDATE_POSITION', InstanceUpdatePosition);
UR.HandleMessage('NET:INSTANCE_REQUEST_EDIT', InstanceRequestEdit);
UR.HandleMessage('NET:INSTANCE_DELETE', InstanceDelete);
// INSPECTOR UTILS --------------------------------------------------------
UR.HandleMessage('NET:INSPECTOR_REGISTER', DoRegisterInspector);
UR.HandleMessage('NET:INSPECTOR_UNREGISTER', DoUnRegisterInspector);
// INSTANCE SELECTION HANDLERS --------------------------------------------
UR.HandleMessage('NET:INSTANCE_SELECT', InstanceSelect);
UR.HandleMessage('NET:INSTANCE_DESELECT', InstanceDeselect);
UR.HandleMessage('INSTANCE_HOVEROVER', InstanceHoverOver);
UR.HandleMessage('INSTANCE_HOVEROUT', InstanceHoverOut);

/// UR HOOKS //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('UR/APP_READY', ProjectDataInit);

/// EXPORT MODULE API /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for exports

export {
  GetProject,
  GetCurrentModelData,
  GetBlueprintPropertiesTypeMap,
  GetPozyxBPNames,
  BlueprintDelete
};
