/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as ACBlueprints from 'modules/appcore/ac-blueprints';
import {
  InputInit,
  InputsUpdate,
  GetInputDefs
} from 'modules/datacore/dc-inputs';
import {
  GetCharacterById,
  DeleteCharacter
} from 'modules/datacore/dc-sim-agents';
import SyncMap from '../../lib/class-syncmap';
import InputDef from '../../lib/class-input-def';
import * as TRANSPILER from './script/transpiler-v2';

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
 * SRI: Why is agent/sim stuff in INPUT?
 * @param {InputDef} newInputDef
 * @param {InputDef} oldInputDef
 */
function UpdateAgent(newInputDef, oldInputDef) {
  let agent = GetCharacterById(newInputDef.id);
  if (!agent) {
    agent = TRANSPILER.MakeAgent(newInputDef);
  } else if (agent.blueprint.name !== newInputDef.bpid) {
    // char control changed blueprints
    // ISSUE: Since we re-use the agentID, certain parameters set by the
    //        old agent might not be reset with the new agent.
    //        We have to clear these manually.
    DeleteCharacter(oldInputDef);
    agent = TRANSPILER.MakeAgent(newInputDef);
  }
  // Only update oldInputDef AFTER possible deletion or bpname will not match
  oldInputDef.bpid = newInputDef.bpid;
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
  agent.setModePuppet();
}

// REVIEW: This is probably an abuse of syncMap
//         Maybe just use a Pool object?
// SRI: Is an "input def" the same as a "control object"?
INPUTDEF_TO_AGENT.setMapFunctions({
  onAdd: (newInputDef, oldInputDef) => {
    UpdateAgent(newInputDef, oldInputDef);
  },
  onUpdate: (newInputDef, oldInputDef) => {
    UpdateAgent(newInputDef, oldInputDef);
  },
  onRemove: inputDef => {
    DeleteCharacter(inputDef);
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
UR.HookPhase('SIM/INPUTS_READ', ProcessInputs);
/// ASYNCH MESSAGE ////////////////////////////////////////////////////////////

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function InputsInit(frameTime) {
  const BPNAMES = ACBlueprints.GetCharControlBpNames();
  // GetInputBPnames();
  BPNAMES.forEach(b => InputInit(b));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// REVIEW
// We can't init input until we get the blueprint names after loading the model
// Should this really be triggered by a UR message?
// Or should it be a phase?
UR.HandleMessage('NET:SET_CHARCONTROL_BPIDLIST', InputsInit);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {};
