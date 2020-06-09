/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
// runtime data modules
import INPUTS from './inputs';
import CONDITIONS from './conditions';
import AGENTS from './agents';
import MANAGERS from './managers';
import REFEREE from './referee';

/// DEBUG /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.util.Prompts.makeLogHelper('SIM');
const DBG = false;

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GameLoop = new UR.class.PhaseMachine({
  PHASE_WORLD: ['INPUTS', 'PHYSICS', 'TIMERS', 'CONDITIONS'],
  PHASE_AGENTS: [
    'AGENTS_UPDATE',
    'MANAGERS_UPDATE',
    'MANAGERS_THINK',
    'AGENTS_THINK',
    'MANAGERS_RETHINK',
    'AGENTS_EXEC',
    'MANAGERS_EXEC'
  ],
  PHASE_EVAL: ['SIM_EVAL', 'REFEREE_EVAL']
});

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function LoadSimulation() {
  // load agents and assets
  // prep recording buffer
}
function StartSimulation() {
  // initialize agents and assets
  // start the clock
  // start recording buffer
  function u_dump(phases, index) {
    if (!DBG) return;
    if (index === 0) console.log('start of PHASE', index);
    if (index === phases.length) console.log('end of PHASE', index);
    else console.log(`.. executing ${index} ${phases[index]}`);
  }
  //
  GameLoop.Hook('PHASE_WORLD', u_dump);
  GameLoop.Hook('PHASE_AGENTS', u_dump);
  GameLoop.Hook('PHASE_EVAL', u_dump);
  //
}
function PauseSimulation() {
  // set the playback rate from 0 to 10
  // can we support backing up in the buffer?
  // can we offer forward simulation from the playback buffer
}
function EndSimulation() {
  // stop simulation
}
function ExportSimulation() {
  // grab data from the simulation
}
function ResetSimulation() {
  // return simulation to starting state
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function StepSimulation(int_ms) {
  /* insert game pause control here */
  (async () => {
    await GameLoop.ExecutePhase('PHASE_WORLD', int_ms);
    await GameLoop.ExecutePhase('PHASE_AGENTS', int_ms);
    await GameLoop.ExecutePhase('PHASE_EVAL', int_ms);
  })();
  /* insert game logic here */
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Hook into URSYS system for lifecycle events
 */
function Initialize() {
  // hook into URSYS lifecycle
  UR.SystemHook('APP_STAGE', () => {});
  UR.SystemHook('APP_START', () => {});
  UR.SystemHook('APP_RUN', () => {});
  UR.SystemHook('APP_UPDATE', StepSimulation);
  UR.SystemHook('APP_NEXT', () => {});
  //
  INPUTS.Initialize(GameLoop);
  CONDITIONS.Initialize(GameLoop);
  AGENTS.Initialize(GameLoop);
  MANAGERS.Initialize(GameLoop);
  REFEREE.Initialize(GameLoop);
  //
  StartSimulation();
} // Initialize

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  Initialize,
  LoadSimulation,
  StartSimulation,
  PauseSimulation,
  EndSimulation,
  ExportSimulation,
  ResetSimulation
};
