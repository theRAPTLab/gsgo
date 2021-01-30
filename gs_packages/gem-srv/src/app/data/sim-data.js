// HACK
// Bare Bones SIM DATA Module
//
// This hack was created to make it easy to create
// and load different sets of simulations scripts for
// any given model.
//
// This just listens for requests via URSYS and sends data back.
// This should be replaced by a proper database module.

import UR from '@gemstep/ursys/client';

// HACK DATA LOADING
import { MODEL as AquaticModel } from './aquatic';
import { MODEL as DecompositionModel } from './decomposition';
import { MODEL as MothsModel } from './moths';
import { MODEL as SaltModel } from './salt';
import { MODEL as BeesModel } from './bees';

class SimData {
  constructor() {
    // Register Listeners
    UR.RegisterMessage('HACK_SIMDATA_REQUEST_MODELS', this.RequestSimDataModels);
    UR.RegisterMessage('HACK_SIMDATA_REQUEST_MODEL', this.RequestSimDataModel);
  }

  /**
   *
   * @param {Object} data -- { modelId: <string> }
   */
  RequestSimDataModels() {
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
  RequestSimDataModel(data) {
    let model;
    switch (data.modelId) {
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
    UR.RaiseMessage('HACK_SIMDATA_UPDATE_MODEL', { model });
  }
}

const SIMDATA = new SimData();

export default SIMDATA;
