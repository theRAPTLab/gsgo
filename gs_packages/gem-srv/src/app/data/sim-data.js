// HACK
// Bare Bones SIM DATA Module
//
// This hack was created to make it easy to create
// and load different sets of simulations scripts for
// any given model.
//
// This just listens for requests via URSYS and sends data back.
// This should be replaced by a proper database module.
//
// As of 2021-02-25, the instance updates just update
// instances for the current session.  No data is saved.

import UR from '@gemstep/ursys/client';
import { GetAgentById, GetAllInstances } from 'modules/datacore/dc-agents';
import * as SIM from 'modules/sim/api-sim';
import * as TRANSPILER from 'script/transpiler';

// HACK DATA LOADING
import { MODEL as AquaticModel } from './aquatic';
import { MODEL as DecompositionModel } from './decomposition';
import { MODEL as MothsModel } from './moths';
import { MODEL as SaltModel } from './salt';
import { MODEL as BeesModel } from './bees';

/// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

let SEED = 100;
function GetUID() {
  return SEED++;
}

/// CLASS DEFINTION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SimData {
  constructor() {
    // Properties
    this.currentModelId = '';
    // Bind This
    this.GetSimDataModel = this.GetSimDataModel.bind(this);
    this.GetModels = this.GetModels.bind(this);
    this.GetModel = this.GetModel.bind(this);
    this.GetCurrentModel = this.GetCurrentModel.bind(this);
    this.GetCurrentModelId = this.GetCurrentModelId.bind(this);
    this.GetBlueprintProperties = this.GetBlueprintProperties.bind(this);
    this.ScriptUpdate = this.ScriptUpdate.bind(this);
    this.SendSimDataModels = this.SendSimDataModels.bind(this);
    this.HandleSimDataModelRequest = this.HandleSimDataModelRequest.bind(this);
    this.HandleRequestCurrentModel = this.HandleRequestCurrentModel.bind(this);
    this.SendSimDataModel = this.SendSimDataModel.bind(this);
    this.InstanceAdd = this.InstanceAdd.bind(this);
    this.InstanceUpdate = this.InstanceUpdate.bind(this);
    this.InstanceUpdatePosition = this.InstanceUpdatePosition.bind(this);
    this.ReplacePropLine = this.ReplacePropLine.bind(this);
    this.InstanceRequestEdit = this.InstanceRequestEdit.bind(this);
    this.InstanceSelect = this.InstanceSelect.bind(this);
    this.InstanceDeselect = this.InstanceDeselect.bind(this);
    this.InstanceHoverOver = this.InstanceHoverOver.bind(this);
    this.InstanceOverOut = this.InstanceHoverOut.bind(this);
    // Register Listeners
    UR.HandleMessage('LOCAL:INSTANCE_ADD', this.InstanceAdd);
    UR.HandleMessage('NET:SCRIPT_UPDATE', this.ScriptUpdate);
    UR.HandleMessage('NET:INSTANCE_UPDATE', this.InstanceUpdate);
    UR.HandleMessage('NET:INSTANCE_UPDATE_POSITION', this.InstanceUpdatePosition);
    UR.HandleMessage('NET:INSTANCE_REQUEST_EDIT', this.InstanceRequestEdit);
    UR.HandleMessage('NET:INSTANCE_SELECT', this.InstanceSelect);
    UR.HandleMessage('NET:INSTANCE_DESELECT', this.InstanceDeselect);
    UR.HandleMessage('INSTANCE_HOVEROVER', this.InstanceHoverOver);
    UR.HandleMessage('INSTANCE_HOVEROUT', this.InstanceHoverOut);
    UR.HandleMessage('*:REQUEST_MODELS', this.SendSimDataModels);
    UR.HandleMessage('NET:REQUEST_MODEL', this.HandleSimDataModelRequest);
    UR.HandleMessage('NET:REQUEST_CURRENT_MODEL', this.HandleRequestCurrentModel);
  }

  /// LOAD MODEL DATA ///////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  GetSimDataModel(modelId) {
    let model;
    switch (modelId) {
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

  /// API CALLS: REQUEST MODEL DATA //////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  GetModels() {
    return [
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
  GetModel(modelId) {
    this.currentModelId = modelId;
    return this.GetSimDataModel(modelId);
  }
  GetCurrentModel() {
    return this.GetSimDataModel(this.currentModelId);
  }
  GetCurrentModelId() {
    return this.currentModelId;
  }
  GetBlueprintProperties(modelId, blueprintName) {
    // HACK
    // 1. Start with built in properties
    let properties = [
      { name: 'x', type: 'number', defaultValue: 0, isFeatProp: false },
      { name: 'y', type: 'number', defaultValue: 0, isFeatProp: false }
    ];
    // 2. Brute force deconstruct added properties
    //    by walking down script and looking for `addProp`
    const model = this.GetSimDataModel(modelId);
    const blueprint = model.scripts.find(s => s.id === blueprintName);
    const script = blueprint.script;
    const scriptUnits = TRANSPILER.ScriptifyText(script);
    scriptUnits.forEach(unit => {
      if (unit[0] && unit[0].token === 'addProp') {
        properties.push({
          name: unit[1].token,
          type: unit[2].token.toLowerCase(),
          defaultValue: unit[3].value,
          isFeatProp: false
        });
      }
    });
    return properties;
  }

  /**
   *
   * @param {Object} data -- { script }
   */
  ScriptUpdate(data) {
    const model = this.GetCurrentModel();
    const source = TRANSPILER.ScriptifyText(data.script);
    const bundle = TRANSPILER.CompileBlueprint(source); // compile to get name
    const blueprintName = bundle.name;
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

    this.SendSimDataModel();

    // Add an instance if the sim is not running
    const bp = TRANSPILER.RegisterBlueprint(bundle);
    const instancesSpec = model.instances.filter(i => i.blueprint === bp.name);
    if (instancesSpec.length < 1) {
      // If the map has not been defined yet, then generate a single instance
      // instancesSpec.push({ name: `${bp.name}01`, init: '' });
      this.InstanceAdd({
        modelId: this.GetCurrentModelId(),
        blueprintName: bp.name
      });
    }
  }

  /// URSYS REQUEST MODEL DATA //////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   *
   * @param {Object} data -- { modelId: <string> }
   */
  SendSimDataModels() {
    const models = this.GetModels();
    UR.RaiseMessage('LOCAL:UPDATE_MODELS', { models });
  }

  /**
   *
   * @param {Object} data -- { modelId: <string> }
   */
  HandleSimDataModelRequest(data) {
    this.SendSimDataModel(data.modelId);
  }
  HandleRequestCurrentModel() {
    this.SendSimDataModel();
  }
  SendSimDataModel(modelId = this.currentModelId) {
    const model = this.GetSimDataModel(modelId);
    UR.RaiseMessage('NET:UPDATE_MODEL', { modelId, model });
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
      init: `prop x setTo ${Math.trunc(Math.random() * 50 - 25)}
prop y setTo ${Math.trunc(Math.random() * 50 - 25)}`
    };
    model.instances.push(instance);
    //
    // REVIEW
    // This needs to send data to db
    //
    if (sendUpdate) this.SendSimDataModel(data.modelId);
  }
  /**
   *
   * @param {Object} data -- { modelId, instanceId, instanceName, updatedData }
   * where `updatedData` = { init } -- init is scriptText.
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
    instance.init = data.instanceInit || instance.init;
    model.instances[instanceIndex] = instance;
    this.SendSimDataModel(data.modelId);
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
    let scriptTextLines = instance.init ? instance.init.split('\n') : [];
    this.ReplacePropLine('x', 'setTo', data.updatedData.x, scriptTextLines);
    this.ReplacePropLine('y', 'setTo', data.updatedData.y, scriptTextLines);
    const scriptText = scriptTextLines.join('\n');
    instance.init = scriptText;
    model.instances[instanceIndex] = instance;
    this.SendSimDataModel(data.modelId);
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
        `sim-data.ReplacePositionLine: No "prop ${propName} ${propMethod}..." line found.  Inserting new line.`
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
    agent.setSelected(true);
    // 2. Update UI
    UR.RaiseMessage('INSTANCE_EDIT_ENABLE', data);
    // 3. Update Sim View
    UR.RaiseMessage('AGENTS_RENDER');
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
    agent.setSelected(false);
    UR.RaiseMessage('AGENTS_RENDER');
  }
  /**
   * Turns hover on
   * @param {object} data -- {modelId, agentId}
   */
  InstanceHoverOver(data) {
    const agent = GetAgentById(data.agentId);
    agent.setHovered(true);
    UR.RaiseMessage('AGENTS_RENDER');
  }
  /**
   * Turns hover off
   * @param {object} data -- {modelId, agentId}
   */
  InstanceHoverOut(data) {
    const agent = GetAgentById(data.agentId);
    agent.setHovered(false);
    UR.RaiseMessage('AGENTS_RENDER');
  }
}

const SIMDATA = new SimData();

export default SIMDATA;
