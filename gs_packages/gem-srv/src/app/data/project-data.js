/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Data - Data Module for Mission Control

  This manages the project definition data, specifically:
  * blueprints
  * instance defintions

  Also, this sets up all of the phase hooks that manage the running of
  the sim.

  NOTE: This should NOT be used directly by ScriptEditor or PanelScript!!!

  Currently this is a placeholder class.  No data is saved between sessions.
  Eventually it will communicate with as erver database.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as TRANSPILER from 'script/transpiler';
import * as SIM from 'modules/sim/api-sim';
import * as DATACORE from 'modules/datacore';
import * as RENDERER from 'modules/render/api-render';
import {
  DeleteInstance,
  GetAllAgents,
  GetAgentById,
  DeleteAgent,
  GetInstancesType
} from 'modules/datacore/dc-agents';
import {
  SetInputStageBounds,
  SetInputBPnames,
  InputsReset
} from 'modules/datacore/dc-inputs';
import {
  UpdateDCModel,
  UpdateDCBounds,
  GetBounds,
  GetBoundary
} from 'modules/datacore/dc-project';
import * as INPUT from '../../modules/input/api-input';

// HACK DATA LOADING
import { MODEL as SpringPilot } from './2021SpringPilot';
import { MODEL as AquaticModel } from './aquatic';
import { MODEL as DecompositionModel } from './decomposition';
import { MODEL as MothsModel } from './moths';
import { MODEL as SaltModel } from './salt';
import { MODEL as BeesModel } from './bees';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ProjectData');
const DBG = false;

let DEVICE_UDID; // registered UDID

let CURRENT_MODEL;

/// Functions that are allowed to be requested via `NET:REQ_PROJDATA`
const API_PROJDATA = [
  'GetModels',
  'GetModel',
  'GetCurrentModelData',
  'GetProjectBoundary',
  'GetInputBPNames',
  'GetBlueprintProperties'
];

/// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

let SEED = 100;
function GetUID() {
  return SEED++;
}

// InstanceDef Ids should be strings, but hand-editing project files can
// result in numeric ids.  This will cause problems with AGENT_DICT lookups.
function FixInstanceIds(model) {
  if (!model) return {}; // not loaded yet
  const cleaned = model;
  cleaned.instances = cleaned.instances.map(i => {
    i.id = String(i.id);
    return i;
  });
  return cleaned;
}

/// CLASS DEFINTION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ProjectData {
  constructor() {
    // Properties
    this.currentModelId = '';
    this.MONITORED_INSTANCES = [];

    // INITIALIZATION /////////////////////////////////////////////////////////
    this.GetUDID = this.GetUDID.bind(this);
    this.GetSimDataModel = this.GetSimDataModel.bind(this);
    // API CALLS //////////////////////////////////////////////////////////////
    // MODEL DATA REQUESTS ----------------------------------------------------
    this.GetModels = this.GetModels.bind(this);
    this.LoadModel = this.LoadModel.bind(this);
    this.SetCurrentModelId = this.SetCurrentModelId.bind(this);
    this.GetCurrentModelId = this.GetCurrentModelId.bind(this);
    this.GetModel = this.GetModel.bind(this);
    this.GetCurrentModelData = this.GetCurrentModelData.bind(this);
    this.GetProjectBoundary = this.GetProjectBoundary.bind(this);
    this.GetBlueprintPropertiesTypeMap = this.GetBlueprintPropertiesTypeMap.bind(
      this
    );
    this.GetInputBPNames = this.GetInputBPNames.bind(this);
    this.BlueprintDelete = this.BlueprintDelete.bind(this);
    this.RemoveInvalidPropsFromInstanceInit = this.RemoveInvalidPropsFromInstanceInit.bind(
      this
    );
    this.SendBoundary = this.SendBoundary.bind(this);
    // URSYS CALLS ////////////////////////////////////////////////////////////
    // MODEL DATA REQUESTS ----------------------------------------------------
    this.HandleRequestProjData = this.HandleRequestProjData.bind(this);
    this.ScriptUpdate = this.ScriptUpdate.bind(this);
    this.RaiseModelsUpdate = this.RaiseModelsUpdate.bind(this);
    this.RaiseModelUpdate = this.RaiseModelUpdate.bind(this);
    UR.HandleMessage('REQ_PROJDATA', this.HandleRequestProjData);
    UR.HandleMessage('NET:REQ_PROJDATA', this.HandleRequestProjData);
    UR.HandleMessage('NET:SCRIPT_UPDATE', this.ScriptUpdate);
    // INPUT UTILS ------------------------------------------------------------
    // BLUEPRINT UTILS --------------------------------------------------------
    this.HandleBlueprintDelete = this.HandleBlueprintDelete.bind(this);
    UR.HandleMessage('NET:BLUEPRINT_DELETE', this.HandleBlueprintDelete);
    // INSPECTOR UTILS --------------------------------------------------------
    this.DoRegisterInspector = this.DoRegisterInspector.bind(this);
    this.DoUnRegisterInspector = this.DoUnRegisterInspector.bind(this);
    this.SendInstanceInspectorUpdate = this.SendInstanceInspectorUpdate.bind(
      this
    );
    UR.HandleMessage('NET:INSPECTOR_REGISTER', this.DoRegisterInspector);
    UR.HandleMessage('NET:INSPECTOR_UNREGISTER', this.DoUnRegisterInspector);
    // INSTANCE UTILS ---------------------------------------------------------
    this.InstanceAdd = this.InstanceAdd.bind(this);
    this.InstanceUpdate = this.InstanceUpdate.bind(this);
    this.InstanceUpdatePosition = this.InstanceUpdatePosition.bind(this);
    this.ReplacePropLine = this.ReplacePropLine.bind(this);
    this.InstanceRequestEdit = this.InstanceRequestEdit.bind(this);
    this.InstanceDelete = this.InstanceDelete.bind(this);
    UR.HandleMessage('LOCAL:INSTANCE_ADD', this.InstanceAdd);
    UR.HandleMessage('NET:INSTANCE_UPDATE', this.InstanceUpdate);
    UR.HandleMessage('NET:INSTANCE_UPDATE_POSITION', this.InstanceUpdatePosition);
    UR.HandleMessage('NET:INSTANCE_REQUEST_EDIT', this.InstanceRequestEdit);
    UR.HandleMessage('NET:INSTANCE_DELETE', this.InstanceDelete);
    // INSTANCE SELECTION HANDLERS --------------------------------------------
    this.InstanceSelect = this.InstanceSelect.bind(this);
    this.InstanceDeselect = this.InstanceDeselect.bind(this);
    this.InstanceHoverOver = this.InstanceHoverOver.bind(this);
    this.InstanceOverOut = this.InstanceHoverOut.bind(this);
    UR.HandleMessage('NET:INSTANCE_SELECT', this.InstanceSelect);
    UR.HandleMessage('NET:INSTANCE_DESELECT', this.InstanceDeselect);
    UR.HandleMessage('INSTANCE_HOVEROVER', this.InstanceHoverOver);
    UR.HandleMessage('INSTANCE_HOVEROUT', this.InstanceHoverOut);
    // RUN HANDLERS -----------------------------------------------------------
    this.DoSimPlaces = this.DoSimPlaces.bind(this);
    this.DoSimReset = this.DoSimReset.bind(this);
    this.DoSimStart = this.DoSimStart.bind(this);
    this.DoSimStop = this.DoSimStop.bind(this);
    UR.HandleMessage('*:SIM_PLACES', this.DoSimPlaces);
    // Let MissionControl handle NET:HACK_SIM_RESET, then call this.DoSimReset directly.
    // UR.HandleMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.HandleMessage('NET:HACK_SIM_START', this.DoSimStart);
    UR.HandleMessage('NET:HACK_SIM_STOP', this.DoSimStop);

    // SYSTEM HOOKS ///////////////////////////////////////////////////////////
    UR.HookPhase('SIM/UI_UPDATE', this.SendInstanceInspectorUpdate);
  }

  GetUDID() {
    return DEVICE_UDID;
  }
  GetSimDataModel(modelId = this.currentModelId) {
    let model;
    switch (modelId) {
      case 'pilot':
        model = SpringPilot;
        break;
      case 'aquatic':
        model = AquaticModel;
        break;
      case 'decomposition':
        model = DecompositionModel;
        break;
      case 'moths':
        model = MothsModel;
        break;
      case 'salt':
        model = SaltModel;
        break;
      case 'bees':
        model = BeesModel;
        break;
      default:
        break;
    }
    const res = FixInstanceIds(model);
    return res;
  }

  /// API CALLS: MODEL DATA REQUESTS ////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  GetModels() {
    return [
      { id: 'pilot', label: 'Spring 2021 Pilot' },
      { id: 'aquatic', label: 'Aquatic Ecosystems' },
      { id: 'decomposition', label: 'Decomposition' },
      { id: 'moths', label: 'Moths' },
      { id: 'salt', label: 'Salt' },
      { id: 'bees', label: 'Bees' }
    ];
  }
  // Main Load Model Call -- sets dc-project parameters
  LoadModel(modelId) {
    this.currentModelId = modelId;
    CURRENT_MODEL = this.GetSimDataModel(modelId);
    const bounds = CURRENT_MODEL.bounds || {
      top: -400, // default if not set
      right: 400,
      bottom: 400,
      left: -400
    };
    UpdateDCModel(CURRENT_MODEL);
    UpdateDCBounds(bounds);
    return CURRENT_MODEL;
  }
  SetCurrentModelId(modelId) {
    this.currentModelId = modelId;
  }
  GetCurrentModelId() {
    return this.currentModelId;
  }
  GetModel(modelId = this.currentModelId) {
    if (!modelId) throw 'Tried to GetModel before setting modelId';
    return CURRENT_MODEL || this.LoadModel(modelId);
  }
  // Used for URSYS requests for full project data, e.g. Viewer
  GetCurrentModelData() {
    return {
      modelId: this.GetCurrentModelId(),
      model: this.GetModel()
    };
  }
  GetProjectBoundary() {
    return GetBoundary();
  }
  SendBoundary() {
    const boundary = GetBoundary();
    UR.RaiseMessage('NET:SET_BOUNDARY', {
      width: boundary.width,
      height: boundary.height,
      bgcolor: boundary.bgcolor
    });
  }

  /**
   * Used by InstanceEditor and props.tsx to look up property types
   * NOTE: Non-MissionControl panels should always call this with a
   * modelId, since currentModelId may not be set.
   * @param {*} blueprintName
   * @param {*} modelId
   * @return {map} [ ...{name: type}]
   */
  GetBlueprintPropertiesTypeMap(blueprintName, modelId = this.currentModelId) {
    if (modelId === '')
      console.error(
        'GetBlueprintPRopertiesTypeMap needs to specify modelId -- You are probably calling this from PanelScript!'
      );
    const properties = this.GetBlueprintProperties(blueprintName, modelId);
    const map = new Map();
    properties.forEach(p => map.set(p.name, p.type));
    return map;
  }

  /**
   * Returns array of blueprint names that are controllable by user input.
   * Used to set sim-inputs and CharControl.
   * @param {string} modelId
   * @return {string[]} [ ...bpnames ]
   */
  GetInputBPNames(modelId = this.currentModelId) {
    if (DBG) console.log(...PR('GetInputBPNames called with', modelId));
    const model = this.GetModel(modelId);
    if (!model)
      console.error(...PR('GetInputBPNames could not load model', modelId));
    const scripts = model.scripts;
    const res = scripts.filter(s => s.isControllable).map(s => s.id);
    return res;
  }
  /**
   * Removes the script from `model` and related `model.instances`
   * Does not remove sim instances/agents.
   * @param {string} blueprintName
   */
  BlueprintDelete(blueprintName) {
    const model = this.GetModel();
    // 1. Delete the old blueprint from model
    const index = model.scripts.findIndex(s => s.id === blueprintName);
    if (index > -1) {
      // Remove existing blueprint
      model.scripts.splice(index, 1);
    }
    // 2. Delete any existing instances from model definition
    model.instances = model.instances.filter(i => i.blueprint !== blueprintName);
  }

  /**
   * Scrubs the init script and removes any invalid props
   * Primarily used by ScriptUpdate.
   * @param {object} instance instanceDef from models.instances
   * @param {string[]} validPropNames e.g. ['x', 'y']
   * @return {object} InstanceDef with init scrubbed
   */
  RemoveInvalidPropsFromInstanceInit(instance, validPropNames) {
    const scriptUnits = TRANSPILER.ScriptifyText(instance.initScript);
    const scrubbedScriptUnits = scriptUnits.filter(unit => {
      if (unit[0] && (unit[0].token === 'prop' || unit[0].token === 'featProp')) {
        return validPropNames.includes(unit[1].token);
      }
      return false;
    });
    instance.initScript = TRANSPILER.TextifyScript(scrubbedScriptUnits);
    return instance;
  }

  /// URSYS MODEL DATA REQUESTS//////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  HandleRequestProjData(data) {
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
    const fn = this[data.fnName]; // convert into a function
    if (typeof fn === 'function') {
      let res;
      if (data.parms && Array.isArray(data.parms)) res = fn(...data.parms);
      else res = fn();
      return { result: res };
    }
    return { result: undefined };
  }

  /**
   * Update the script for a single blueprint (not all blueprints in the model)
   * This should just update the `model.scripts` and `model.instances` data.
   * Any sim instance/agent data updates should be hanlded by sim-agents.
   * @param {Object} data -- { script, origBlueprintName }
   */
  ScriptUpdate(data) {
    const model = this.GetModel();
    const source = TRANSPILER.ScriptifyText(data.script);
    const bundle = TRANSPILER.CompileBlueprint(source); // compile to get name
    const blueprintName = bundle.name;

    // 1. Did the blueprint name change?
    if (data.origBlueprintName !== blueprintName) {
      // If name changed, remove the original
      this.BlueprintDelete(data.origBlueprintName);
      // NOTE sim agents and instances are added/removed in sim-agents.AllAgentsProgramUpdate
    }

    // 2. Update the new blueprint
    const blueprint = {
      id: blueprintName,
      label: blueprintName,
      script: data.script
    };
    const index = model.scripts.findIndex(s => s.id === blueprintName);
    if (index > -1) {
      // Copy isControllable
      blueprint.isControllable = model.scripts[index].isControllable;
      // Replace existing blueprint
      model.scripts[index] = blueprint;
    } else {
      // REVIEW: Need to set isControllable here?
      // For now automatically make it controllable.
      blueprint.isControllable = true;
      // New Blueprint
      model.scripts.push(blueprint);
    }

    // 3. Clean the init scripts
    const validPropDefs = TRANSPILER.ExtractBlueprintProperties(data.script);
    const validPropNames = validPropDefs.map(d => d.name);
    model.instances = model.instances.map(i => {
      // Only clean init scripts for the submitted blueprint
      if (i.blueprint !== blueprintName) return i;
      return this.RemoveInvalidPropsFromInstanceInit(i, validPropNames);
    });

    // 4. Delete the old instance
    //    If the sim is not running, delete the old instance
    //    so AllAgentsPropgramUpdate will recreate it with
    //    the new script.
    //    If the sim IS running, we want to leave the instance
    //    running with the old blueprint code.
    if (!SIM.IsRunning()) {
      GetInstancesType(blueprintName).forEach(a => DeleteAgent(a));
      // Also delete input agents
      InputsReset();
    }

    // 5. Add an instance if one isn't already defined
    // Should not affect running sim until reset
    const bp = TRANSPILER.RegisterBlueprint(bundle);
    const instancesSpec = model.instances.filter(i => i.blueprint === bp.name);
    if (instancesSpec.length < 1) {
      // If the map has not been defined yet, then generate a single instance
      // instancesSpec.push({ name: `${bp.name}01`, init: '' });
      this.InstanceAdd(
        {
          modelId: this.GetCurrentModelId(),
          blueprintName: bp.name
        },
        false
      );
    }

    this.RaiseModelUpdate();
  }

  RaiseModelsUpdate() {
    const models = this.GetModels();
    UR.RaiseMessage('LOCAL:UPDATE_MODELS', { models });
  }
  RaiseModelUpdate(modelId = this.currentModelId) {
    const model = this.GetSimDataModel(modelId);
    UpdateDCModel(model); // update dc-project

    // MissionControl instances need to be updated as well.
    UR.RaiseMessage('NET:UPDATE_MODEL', { modelId, model });
  }

  /// INPUT UTILS /////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /// BLUEPRINT UTILS ////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  HandleBlueprintDelete(data) {
    this.BlueprintDelete(data.blueprintName);
    this.RaiseModelUpdate();
  }

  /// INSPECTOR UTILS ////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * PanelSimulation keeps track of any instances that have been requested
   * for inspector monitoring.
   * We allow duplicate registrations so that when one device unregisters,
   * the instance is still considered monitored.
   * @param {Object} data { name: <string> } where name is the agent name.
   */
  DoRegisterInspector(data) {
    const id = data.id;
    this.MONITORED_INSTANCES.push(id);
  }
  DoUnRegisterInspector(data) {
    const id = data.id;
    const i = this.MONITORED_INSTANCES.indexOf(id);
    if (i > -1) this.MONITORED_INSTANCES.splice(i, 1);
  }

  /**
   * On every system loop, we broadcast instance updates
   * for any instances that have registered for modeling.
   * We keep this list small to keep from flooding the net with data.
   */
  SendInstanceInspectorUpdate() {
    // walk down agents and broadcast results for monitored agents
    const agents = GetAllAgents();
    // Send all instances, but minmize non-monitored
    const inspectorAgents = agents.map(a =>
      this.MONITORED_INSTANCES.includes(a.id)
        ? a
        : { id: a.id, name: a.name, blueprint: a.blueprint }
    );
    // Broadcast data
    UR.RaiseMessage('NET:INSPECTOR_UPDATE', { agents: inspectorAgents });
  }

  /// INSTANCE UTILS ////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   *
   * @param {Object} data -- { modelId, blueprintName }
   */
  InstanceAdd(data, sendUpdate = true) {
    const model = this.GetSimDataModel(data.modelId);
    const instance = {
      id: GetUID(),
      name: `${data.blueprintName}${model.instances.length}`,
      blueprint: data.blueprintName
    };

    // If blueprint has `# PROGRAM INIT` we run that
    // otherwise we auto-place the agent around the center of the screen
    const blueprint = model.scripts.find(s => s.id === data.blueprintName);
    const hasInit = TRANSPILER.HasDirective(blueprint.script, 'INIT');
    if (!hasInit) {
      instance.initScript = `prop x setTo ${Math.trunc(Math.random() * 50 - 25)}
prop y setTo ${Math.trunc(Math.random() * 50 - 25)}`;
    }

    model.instances.push(instance);
    //
    // REVIEW
    // This needs to send data to db
    //
    if (sendUpdate) this.RaiseModelUpdate(data.modelId);
  }
  /**
   *
   * @param {Object} data -- { modelId, instanceId, instanceName, updatedData }
   * where `updatedData` = { initScript } -- initScript is scriptText.
   *                 Leave instanceName or instanceInit undefined
   *                 if they're not being set.
   */
  InstanceUpdate(data) {
    const model = this.GetSimDataModel(data.modelId);
    const instanceIndex = model.instances.findIndex(
      i => i.id === data.instanceId
    );
    const instance = model.instances[instanceIndex];
    instance.name = data.instanceName || instance.name;
    instance.initScript =
      data.instanceInit !== undefined // data.instanceInit might be ''
        ? data.instanceInit
        : instance.initScript;
    model.instances[instanceIndex] = instance;
    this.RaiseModelUpdate(data.modelId);
  }
  /**
   * HACK: Manually change the init script when updating position.
   * This is mostly used to support drag and drop
   * @param {Object} data -- { modelId, instanceId, updatedData: {x, y} }
   */
  InstanceUpdatePosition(data) {
    const model = this.GetSimDataModel(data.modelId);
    const instanceIndex = model.instances.findIndex(
      i => i.id === data.instanceId
    );
    const instance = model.instances[instanceIndex];
    let scriptTextLines = instance.initScript
      ? instance.initScript.split('\n')
      : [];
    this.ReplacePropLine('x', 'setTo', data.updatedData.x, scriptTextLines);
    this.ReplacePropLine('y', 'setTo', data.updatedData.y, scriptTextLines);
    const scriptText = scriptTextLines.join('\n');
    instance.initScript = scriptText;
    model.instances[instanceIndex] = instance;
    this.RaiseModelUpdate(data.modelId);
  }
  /**
   * Used by InstanceUpdatePosition to find and replace existing
   * prop setting lines.
   * @param {string} propName -- Name of the prop to change, e.g. x/y
   * @param {string} propMethd -- Prop method to change, e.g. setTo
   * @param {string} params -- Parameter for the prop method, e.g. 200
   * @param {string[]} scriptTextLines -- Full ScriptText as an array of strings
   */
  ReplacePropLine(propName, propMethod, params, scriptTextLines) {
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
   * User is requesting to edit an instance
   * Can be triggered by:
   *   * Simulation View: Clicking on an instance in simulation
   *   * Map Instances View: Clicking on an instance in list
   * @param {object} data -- {modelId, agentId}
   */
  InstanceRequestEdit(data) {
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
  InstanceDelete(data) {
    // Remove from Blueprint
    const model = this.GetSimDataModel(data.modelId);
    const instanceIndex = model.instances.findIndex(
      i => i.id === data.instanceDef.id
    );
    model.instances.splice(instanceIndex, 1);

    // Remove from Sim
    DeleteInstance(data.instanceDef);
    DeleteAgent(data.instanceDef);
    this.RaiseModelUpdate(data.modelId);

    // REVIEW
    // Update the DB!
  }

  /// INSTANCE SELECTION HANDLERS ///////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Toggles the selection state of the agent
   * @param {object} data -- {modelId, agentId}
   */
  InstanceSelect(data) {
    // REVIEW: Does model matter?
    // Or just retrieve the agent from the currently running model?
    const model = this.GetSimDataModel(data.modelId);
    const agent = GetAgentById(data.agentId);
    agent.setSelected(true);
  }
  /**
   * Deselects the selection state of the agent
   * @param {object} data -- {modelId, agentId}
   */
  InstanceDeselect(data) {
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
  InstanceHoverOver(data) {
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
  InstanceHoverOut(data) {
    const agent = GetAgentById(data.agentId);
    if (agent) {
      // agent may have been deleted, so make sure it still exists
      agent.setHovered(false);
    }
  }

  /// RUN HANDLERS //////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Compiles blueprints after model loading.
   * Also updates the boundary display (since model might define new boundaries)
   */
  DoSimPlaces() {
    if (DBG) console.warn(...PR('DoSimPlaces! Compiling...'));
    // 1. Load Model
    const model = this.GetModel();

    // Skip if no model is loaded
    if (!model) return;

    // 2. Show Boundary
    const boundary = GetBoundary();
    RENDERER.SetBoundary(boundary.width, boundary.height, boundary.bgcolor);
    // And Set Listeners too
    this.SendBoundary();

    // 3. Update Input System
    //    Set Input transforms
    SetInputStageBounds(boundary.width, boundary.height); // dc-inputs
    //    Set Input controlled agents
    const inputBPnames = this.GetInputBPNames();
    SetInputBPnames(inputBPnames); // dc-inputs
    UR.RaiseMessage('NET:SET_INPUT_BPNAMES', { bpnames: inputBPnames });

    // 4. Compile All Agents
    const scripts = model.scripts;
    const sources = scripts.map(s => TRANSPILER.ScriptifyText(s.script));
    const bundles = sources.map(s => TRANSPILER.CompileBlueprint(s));
    const blueprints = bundles.map(b => TRANSPILER.RegisterBlueprint(b));
    const blueprintNames = blueprints.map(b => b.name);

    // 5. Create/Update All Instances
    const instancesSpec = model.instances;
    UR.RaiseMessage('ALL_AGENTS_PROGRAM', {
      blueprintNames,
      instancesSpec
    });

    // 6. Update Agent Display
    // Agent displays are automatically updated during SIM/VIS_UPDATE

    // 7. Update Inspectors
    // Inspectors will be automatically updated during SIM/UI_UPDATE phase
  }

  /**
   * WARNINGS:
   * * Do not call this before the simulation has loaded.
   * * Do not call this directly.  The call should originate from MissionControl
   */
  DoSimReset() {
    DATACORE.DeleteAllTests();
    // DATACORE.DeleteAllGlobalConditions(); // removed in script-xp branch
    DATACORE.DeleteAllScriptEvents();
    DATACORE.DeleteAllBlueprints();
    DATACORE.DeleteAllAgents();
    DATACORE.DeleteAllInstances();
    SIM.Reset();
    // MissionControl will take care of reloading and calling SimPlaces
  }

  DoSimStart() {
    SIM.Start();
  }

  DoSimStop() {
    SIM.End();
  }
}

const PROJECTDATA = new ProjectData();

export default PROJECTDATA;
