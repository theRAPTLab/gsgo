/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

// import * as INPUT from 'modules/input/api-input';
// instead of this, the entities should be in DATACORE

import UR from '@gemstep/ursys/client';
import { interval } from 'rxjs';
import InputDef from 'lib/class-input-def';
import {
  InputInit,
  InputsUpdate,
  GetInputDefs
} from 'modules/datacore/dc-inputs';
import SyncMap from '../../lib/class-syncmap';
import { GetAgentById, DeleteAgent } from 'modules/datacore/dc-agents';
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
    console.error('blueprint changed, deleting old agent', agent, oldInputDef);
    DeleteAgent(oldInputDef);
    agent = TRANSPILER.MakeAgent(newInputDef);
  }
  // Only update oldInputDef AFTER possible deletion
  oldInputDef.bpname = newInputDef.bpname;
  oldInputDef.x = newInputDef.x;
  oldInputDef.y = newInputDef.y;
  agent.x = newInputDef.x;
  agent.y = newInputDef.y;
  // console.log('......UpdateAgent:updated agent', agent);
}

// REVIEW: This is probably an abuse of syncMap
//         Maybe just use a Pool object?
INPUTDEF_TO_AGENT.setMapFunctions({
  onAdd: (newInputDef, oldInputDef) => {
    // console.log('ADD', newInputDef);
    UpdateAgent(newInputDef, oldInputDef);
  },
  onUpdate: (newInputDef, oldInputDef) => {
    // console.log('UPDATE', newInputDef);
    UpdateAgent(newInputDef, oldInputDef); // will also update
  },
  onRemove: inputDef => {
    DeleteAgent(inputDef);
  }
});

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BLUEPRINTS = ['Fish', 'Algae'];
function InputsInit(frameTime) {
  BLUEPRINTS.forEach(b => InputInit(b));
}
function ProcessInputs(frameTime) {
  // if (PRERUNTIMER && !PRERUNTIMER.closed) PRERUNTIMER.unsubscribe();
  // console.log('processinputs');
  InputsUpdate();
  const inputDefs = GetInputDefs();
  // console.log('inputDefs', inputDefs);
  INPUTDEF_TO_AGENT.syncFromArray(inputDefs);
  INPUTDEF_TO_AGENT.mapObjects();
}

// PreRunMonitor Inputs is not necessary.
// Simply running 1) VIS_UPDATE and 2) VIS_RENDER is enough
// let PRERUNTIMER;
// function PreRunMonitorInputs(frameTime) {
//   // PRERUNTIMER = interval(33).subscribe(count => {
//   // console.log('process inputs', count);
//   // ProcessInputs();
//   // UR.RaiseMessage('HACK_AGENTS_UPDATE'); // AGENTS_UPDATE is not necessary for rendering inputs
//   // Render calls AgentUpdate
//   // UR.RaiseMessage('AGENTS_RENDER'); // render causes lightbeam to move

//   // AgentsUPDATE but only for inputs
//   const inputDefs = INPUTDEF_TO_AGENT.getMappedObjects();
//   inputDefs.forEach(d => {
//     const agent = GetAgentById(d.id);
//     agent.agentUPDATE(frameTime);
//   });
//   // UR.RaiseMessage('NET:HACK_VIS_UPDATE');
//   // UR.RaiseMessage('NET:HACK_RENDER');
//   // });
// }

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('SIM/READY', () => console.warn('READY'));
UR.HookPhase('UR/APP_START', InputsInit);
UR.HookPhase('SIM/INPUTS', ProcessInputs);
// UR.HookPhase('SIM/STAGED', PreRunMonitorInputs);
// UR.HookPhase('SIM/INPUT_AGENTS_UPDATE', PreRunMonitorInputs);
/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {};
