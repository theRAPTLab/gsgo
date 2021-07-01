/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

// import * as INPUT from 'modules/input/api-input';
// instead of this, the entities should be in DATACORE

import UR from '@gemstep/ursys/client';
import {
  GetInputBPnames,
  InputInit,
  InputsUpdate,
  GetInputDefs
} from 'modules/datacore/dc-inputs';
import { GetAgentById, DeleteAgent } from 'modules/datacore/dc-agents';
import SyncMap from '../../lib/class-syncmap';
import InputDef from '../../lib/class-input-def';
import * as TRANSPILER from './script/transpiler';

/// DEBUG /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_INPUTS');

/// AGENT METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * From `model.instances` spec to an instance definition
 */
const INPUTDEF_TO_AGENT = new SyncMap({
  Constructor: InputDef,
  autoGrow: true,
  name: 'InputDefToAgent'
});

/**
 * Make or update agent.
 * @param {InputDef} newInputDef
 * @param {InputDef} oldInputDef
 */
function UpdateAgent(newInputDef, oldInputDef) {
  // HACK WORKAROUND
  // REVIEW: instanceDef should refer to 'bpname' not 'blueprint'
  //         because GAGent 'blueprint' is an object not string
  oldInputDef.blueprint = oldInputDef.bpname;
  newInputDef.blueprint = newInputDef.bpname;

  let agent = GetAgentById(newInputDef.id);
  if (!agent) {
    agent = TRANSPILER.MakeAgent(newInputDef);
  } else if (agent.blueprint.name !== newInputDef.bpname) {
    // char control changed blueprints
    // ISSUE: Since we re-use the agentID, certain parameters set by the
    //        old agent might not be reset with the new agent.
    //        We have to clear these manually.
    DeleteAgent(oldInputDef);
    agent = TRANSPILER.MakeAgent(newInputDef);
  }
  // Only update oldInputDef AFTER possible deletion or bpname will not match
  oldInputDef.bpname = newInputDef.bpname;
  oldInputDef.x = newInputDef.x;
  oldInputDef.y = newInputDef.y;
  if (agent.hasFeature('Movement')) {
    // If Movement, use queuePosition so that `isMoving` is calcuated
    agent.callFeatMethod(
      'Movement',
      'queuePosition',
      newInputDef.x,
      newInputDef.y
    );
  } else {
    // If no movement, then set directly
    agent.x = newInputDef.x;
    agent.y = newInputDef.y;
  }
  agent.zIndex = -100; // Force all inputs behind NPCs so NPCs can get clicks
  agent.setModePuppet();
}

// REVIEW: This is probably an abuse of syncMap
//         Maybe just use a Pool object?
INPUTDEF_TO_AGENT.setMapFunctions({
  onAdd: (newInputDef, oldInputDef) => {
    UpdateAgent(newInputDef, oldInputDef);
  },
  onUpdate: (newInputDef, oldInputDef) => {
    UpdateAgent(newInputDef, oldInputDef);
  },
  onRemove: inputDef => {
    DeleteAgent(inputDef);
  }
});

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ProcessInputs(frameTime) {
  InputsUpdate();
  const inputDefs = GetInputDefs();
  INPUTDEF_TO_AGENT.syncFromArray(inputDefs);
  INPUTDEF_TO_AGENT.mapObjects();
}
UR.HookPhase('SIM/INPUTS', ProcessInputs);

/// ASYNCH MESSAGE ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function InputsInit(frameTime) {
  const BPNAMES = GetInputBPnames();
  BPNAMES.forEach(b => InputInit(b));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// REVIEW
// We can't init input until we get the blueprint names after loading the model
// Should this really be triggered by a UR message?
// Or should it be a phase?
UR.HandleMessage('NET:SET_INPUT_BPNAMES', InputsInit);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {};
