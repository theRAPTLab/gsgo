/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Data - Data Module for Mission Control

  NOTE: This should NOT be used by ScriptEditor or PanelScript!!!

  Currently this is a placeholder class.  No data is saved between sessions.
  Eventually it will communicate with as erver database.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as INPUT from '../../modules/input/api-input';
import * as DATACORE from 'modules/datacore';
import * as RENDERER from 'modules/render/api-render';
import {
  GetAllInstances,
  DeleteInstance,
  GetAllAgents,
  GetAgentById,
  DeleteAgent,
  GetInstancesType
} from 'modules/datacore/dc-agents';
import * as SIM from 'modules/sim/api-sim';
import * as TRANSPILER from 'script/transpiler';

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
const DBG = true;

/// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

let SEED = 100;
function GetUID() {
  return SEED++;
}

/// CLASS DEFINTION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ProjectData {
  constructor() {
    // Properties
    this.currentModelId = '';
    this.MONITORED_INSTANCES = [];

    // INITIALIZATION /////////////////////////////////////////////////////////
    this.GetSimDataModel = this.GetSimDataModel.bind(this);
    // API CALLS //////////////////////////////////////////////////////////////
    // MODEL DATA REQUESTS ----------------------------------------------------
    this.GetModels = this.GetModels.bind(this);
    this.GetModel = this.GetModel.bind(this);
    this.GetCurrentModel = this.GetCurrentModel.bind(this);
    this.GetCurrentModelId = this.GetCurrentModelId.bind(this);
    this.GetBounds = this.GetBounds.bind(this);
    this.Wraps = this.Wraps.bind(this);
    this.GetBlueprintProperties = this.GetBlueprintProperties.bind(this);
    this.GetBlueprintPropertiesTypeMap = this.GetBlueprintPropertiesTypeMap.bind(
      this
    );
    this.BlueprintDelete = this.BlueprintDelete.bind(this);
    this.RemoveInvalidPropsFromInstanceInit = this.RemoveInvalidPropsFromInstanceInit.bind(
      this
    );
    // URSYS CALLS ////////////////////////////////////////////////////////////
    // MODEL DATA REQUESTS ----------------------------------------------------
    this.ScriptUpdate = this.ScriptUpdate.bind(this);
    this.RaiseModelsUpdate = this.RaiseModelsUpdate.bind(this);
    this.RaiseModelUpdate = this.RaiseModelUpdate.bind(this);
    this.HandleModelRequest = this.HandleModelRequest.bind(this);
    this.HandleCurrentModelRequest = this.HandleCurrentModelRequest.bind(this);
    UR.HandleMessage('NET:SCRIPT_UPDATE', this.ScriptUpdate);
    UR.HandleMessage('*:REQUEST_MODELS', this.RaiseModelsUpdate);
    UR.HandleMessage('NET:REQUEST_MODEL', this.HandleModelRequest);
    UR.HandleMessage('NET:REQUEST_CURRENT_MODEL', this.HandleCurrentModelRequest);
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
    UR.HandleMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.HandleMessage('NET:HACK_SIM_START', this.DoSimStart);
    UR.HandleMessage('NET:HACK_SIM_STOP', this.DoSimStop);

    // SYSTEM HOOKS ///////////////////////////////////////////////////////////
    UR.HookPhase('SIM/UI_UPDATE', this.SendInstanceInspectorUpdate);
  }

  /// INITIALIZATION ////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  GetSimDataModel(modelId) {
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
    return model;
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
  /**
   * API Call
   * @param {string} modelId
   */
  SetCurrentModelId(modelId) {
    this.currentModelId = modelId;
  }
  GetModel(modelId) {
    return this.GetSimDataModel(modelId);
  }
  GetCurrentModel() {
    return this.GetSimDataModel(this.currentModelId);
  }
  GetCurrentModelId() {
    return this.currentModelId;
  }
  GetBounds(modelId = this.currentModelId) {
    const model = this.GetSimDataModel(modelId);
    const bounds = model.bounds || {
      top: -400, // default if not set
      right: 400,
      bottom: 400,
      left: -400
    };
    return bounds;
  }
  Wraps(wall = 'any', modelId = this.currentModelId) {
    const model = this.GetSimDataModel(modelId);
    const wrap = model && model.bounds ? model.bounds.wrap : undefined;
    let wallWrap;
    if (!wrap) {
      // default if wrap is not set
      wallWrap = [false, false, false, false];
    } else if (!Array.isArray(wrap)) {
      wallWrap = [wrap, wrap, wrap, wrap];
    } else if (wrap.length === 4) {
      wallWrap = wrap;
    } else if (wrap.length === 2) {
      wallWrap = [wrap[0], wrap[1], wrap[0], wrap[1]];
    }
    switch (wall) {
      case 'top':
        return wallWrap[0];
      case 'right':
        return wallWrap[1];
      case 'bottom':
        return wallWrap[2];
      case 'left':
        return wallWrap[3];
      case 'any':
      default:
        // Generally you should only call this if there is a single wrap setting
        return wallWrap[0];
    }
  }
  /**
   * Returns array of properties {name, type, defaultvalue, isFeatProp}
   * that have been defined by the blueprint.
   * Used to populate property menus when selecting properties to show
   * in InstanceInspectors
   * @param {string} blueprintName
   * @param {string} [modelId=currentModelId]
   * @return {Object[]} [...{ name, type, defaultValue, isFeatProp }]
   */
  GetBlueprintProperties(blueprintName, modelId = this.currentModelId) {
    const model = this.GetSimDataModel(modelId);
    if (!model) return []; // Called too early?
    const blueprint = model.scripts.find(s => s.id === blueprintName);
    if (!blueprint) return []; // blueprint was probably deleted
    const script = blueprint.script;
    return TRANSPILER.ExtractBlueprintProperties(script);
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
   * Removes the script from `model` and related `model.instances`
   * Does not remove sim instances/agents.
   * @param {string} blueprintName
   */
  BlueprintDelete(blueprintName) {
    const model = this.GetCurrentModel();
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

  /**
   * Update the script for a single blueprint (not all blueprints in the model)
   * This should just update the `model.scripts` and `model.instances` data.
   * Any sim instance/agent data updates should be hanlded by sim-agents.
   * @param {Object} data -- { script, origBlueprintName }
   */
  ScriptUpdate(data) {
    const model = this.GetCurrentModel();
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
      // Replace existing blueprint
      model.scripts[index] = blueprint;
    } else {
      // New Blueprint
      model.scripts.push(blueprint);
    }

    // 3. Clean the init scripts
    const validPropDefs = TRANSPILER.ExtractBlueprintProperties(data.script);
    const validPropNames = validPropDefs.map(d => d.name);
    model.instances = model.instances.map(i =>
      this.RemoveInvalidPropsFromInstanceInit(i, validPropNames)
    );

    // 4. Delete the old instance
    //    If the sim is not running, delete the old instance
    //    so AllAgentsPropgramUpdate will recreate it with
    //    the new script.
    //    If the sim IS running, we want to leave the instance
    //    running with the old blueprint code.
    if (!SIM.IsRunning()) {
      GetInstancesType(blueprintName).forEach(a => DeleteAgent(a));
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

  /**
   *
   * @param {Object} data -- { modelId: <string> }
   */
  HandleModelRequest(data) {
    this.RaiseModelUpdate(data.modelId);
  }
  HandleCurrentModelRequest() {
    this.RaiseModelUpdate();
  }
  RaiseModelUpdate(modelId = this.currentModelId) {
    const model = this.GetSimDataModel(modelId);
    UR.RaiseMessage('NET:UPDATE_MODEL', { modelId, model });
  }

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
      blueprint: data.blueprintName,
      initScript: `prop x setTo ${Math.trunc(Math.random() * 50 - 25)}
prop y setTo ${Math.trunc(Math.random() * 50 - 25)}`
    };
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
    // 3. Update Sim View
    UR.RaiseMessage('AGENTS_RENDER');
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
    UR.RaiseMessage('AGENTS_RENDER');
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
      UR.RaiseMessage('AGENTS_RENDER');
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
      UR.RaiseMessage('AGENTS_RENDER');
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
      UR.RaiseMessage('AGENTS_RENDER');
    }
  }

  /// RUN HANDLERS //////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Compiles blueprints after model loading.
   * Also updates the boundary display (since model might define new boundaries)
   */
  DoSimPlaces() {
    if (DBG) console.warn(...PR('DoSimPlaces! Commpiling...'));
    // 1. Load Model
    const model = this.GetCurrentModel();

    // Skip if no model is loaded
    if (!model) return;

    // 2. Show Boundary
    const bounds = this.GetBounds();
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    RENDERER.ShowBoundary(width, height);
    // And Set Listeners too
    UR.RaiseMessage('NET:SET_BOUNDARY', { width, height });

    // 2. Compile All Agents
    const scripts = model.scripts;
    const sources = scripts.map(s => TRANSPILER.ScriptifyText(s.script));
    const bundles = sources.map(s => TRANSPILER.CompileBlueprint(s));
    const blueprints = bundles.map(b => TRANSPILER.RegisterBlueprint(b));
    const blueprintNames = blueprints.map(b => b.name);

    // 3. Create/Update All Instances
    const instancesSpec = model.instances;
    // Use 'UPDATE' so we don't clobber old instance values.
    UR.RaiseMessage('ALL_AGENTS_PROGRAM', {
      blueprintNames,
      instancesSpec
    });

    // 4. Update Agent Display
    // Agent displays are automatically updated during SIM/VIS_UPDATE

    // 5. Update Inspectors
    // Inspectors will be automatically updated during SIM/UI_UPDATE phase
  }

  /**
   * WARNING: Do not call this before the simulation has loaded.
   */
  DoSimReset() {
    DATACORE.DeleteAllTests();
    // DATACORE.DeleteAllGlobalConditions(); // removed in script-xp branch
    DATACORE.DeleteAllScriptEvents();
    DATACORE.DeleteAllBlueprints();
    DATACORE.DeleteAllAgents();
    DATACORE.DeleteAllInstances();
    SIM.Reset();
    // SimPlaces is called by Mission Control.
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
