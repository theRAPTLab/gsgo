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

// HACK DATA LOADING
import { MODEL as AquaticModel } from './aquatic';
import { MODEL as DecompositionModel } from './decomposition';
import { MODEL as MothsModel } from './moths';
import { MODEL as SaltModel } from './salt';
import { MODEL as BeesModel } from './bees';

class SimData {
  constructor() {
    this.GetSimDataModel = this.GetSimDataModel.bind(this);
    this.SendSimDataModels = this.SendSimDataModels.bind(this);
    this.HandleSimDataModelRequest = this.HandleSimDataModelRequest.bind(this);
    this.SendSimDataModel = this.SendSimDataModel.bind(this);
    this.HackGetSimDataModel = this.HackGetSimDataModel.bind(this);
    this.InstanceAdd = this.InstanceAdd.bind(this);
    this.InstanceUpdateInit = this.InstanceUpdateInit.bind(this);
    this.InstanceUpdatePosition = this.InstanceUpdatePosition.bind(this);
    // Register Listeners
    UR.HandleMessage('NET:INSTANCE_ADD', this.InstanceAdd);
    UR.HandleMessage('NET:INSTANCE_UPDATE_INIT', this.InstanceUpdateInit);
    UR.HandleMessage('NET:INSTANCE_UPDATE_POSITION', this.InstanceUpdatePosition);
    UR.HandleMessage('HACK_SIMDATA_REQUEST_MODELS', this.SendSimDataModels);
    UR.HandleMessage(
      'HACK_SIMDATA_REQUEST_MODEL',
      this.HandleSimDataModelRequest
    );
  }

  componentWillUnmount() {
    UR.UnhandleMessage('NET:INSTANCE_ADD', this.InstanceAdd);
    UR.UnhandleMessage('NET:INSTANCE_UPDATE_INIT', this.InstanceUpdateInit);
    UR.UnhandleMessage(
      'NET:INSTANCE_UPDATE_POSITION',
      this.InstanceUpdatePosition
    );
    UR.UnhandleMessage('HACK_SIMDATA_REQUEST_MODELS', this.SendSimDataModels);
    UR.UnhandleMessage(
      'HACK_SIMDATA_REQUEST_MODEL',
      this.HandleSimDataModelRequest
    );
  }

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

  /**
   *
   * @param {Object} data -- { modelId: <string> }
   */
  SendSimDataModels() {
    let models = [
      { id: 'aquatic', label: 'Aquatic Ecosystems' },
      { id: 'decomposition', label: 'Decomposition' },
      { id: 'moths', label: 'Moths' },
      { id: 'salt', label: 'Salt' },
      { id: 'bees', label: 'Bees' }
    ];
    UR.RaiseMessage('HACK_SIMDATA_UPDATE_MODELS', { models });
  }

  /**
   *
   * @param {Object} data -- { modelId: <string> }
   */
  HandleSimDataModelRequest(data) {
    this.SendSimDataModel(data.modelId);
  }
  SendSimDataModel(modelId) {
    let model = this.GetSimDataModel(modelId);
    UR.RaiseMessage('HACK_SIMDATA_UPDATE_MODEL', { model });
  }

  HackGetSimDataModel(modelId) {
    return this.GetSimDataModel(modelId);
  }

  /**
   *
   * @param {Object} data -- { modelId, blueprintName }
   */
  InstanceAdd(data) {
    const model = this.GetSimDataModel(data.modelId);
    const instance = {
      name: `${data.blueprintName}${model.instances.length}`,
      blueprint: data.blueprintName,
      init: `prop agent.x setTo ${Math.trunc(Math.random() * 50 - 25)}
prop agent.y setTo ${Math.trunc(Math.random() * 50 - 25)}`
    };
    model.instances.push(instance);
    this.SendSimDataModel(data.modelId);
  }

  /**
   *
   * @param {Object} data -- { modelId, instanceName, updatedData }
   * where `updatedData` = { init } -- init is scriptText.
   */
  InstanceUpdateInit(data) {
    const model = this.GetSimDataModel(data.modelId);
    const instanceIndex = model.instances.findIndex(
      i => i.name === data.instanceName
    );
    const instance = model.instances[instanceIndex];
    instance.init = data.updatedData.init;
    model.instances[instanceIndex] = instance;
    this.SendSimDataModel(data.modelId);
  }

  /**
   *
   * @param {Object} data -- { modelId, instanceName, updatedData }
   */
  InstanceUpdatePosition(data) {
    const model = this.GetSimDataModel(data.modelId);
    const instanceIndex = model.instances.findIndex(
      i => i.name === data.instanceName
    );
    const instance = model.instances[instanceIndex];
    instance.init = `prop agent.x setTo ${data.updatedData.x}
prop agent.y setTo ${data.updatedData.y}`;
    model.instances[instanceIndex] = instance;
    this.SendSimDataModel(data.modelId);
  }
}

const SIMDATA = new SimData();

export default SIMDATA;
