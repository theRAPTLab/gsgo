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
const PR = UR.util.PROMPTS.makeLogHelper('SIM');
const DBG = false;

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** create PhaseMachine to manage gameloop
 */
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
function StartSimulation() {}
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
  // return simulation to starting state, ready to run
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RunSimulation() {
  // prepare to run simulation and do first-time setup
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
  UR.SystemHook('APP_STAGE', LoadSimulation);
  UR.SystemHook('APP_START', ResetSimulation);
  UR.SystemHook('APP_RUN', RunSimulation);
  UR.SystemHook('APP_UPDATE', () => {});
  UR.SystemHook('APP_RESET', () => {});

  // register debugging messages for GameLoop phases
  const u_dump = (phases, index) => {
    if (!DBG) return;
    if (index === 0) console.log('start of PHASE', index);
    if (index === phases.length) console.log('end of PHASE', index);
    else console.log(`.. executing ${index} ${phases[index]}`);
  };
  GameLoop.Hook('PHASE_WORLD', u_dump);
  GameLoop.Hook('PHASE_AGENTS', u_dump);
  GameLoop.Hook('PHASE_EVAL', u_dump);

  // initialize modules that are participating in this gameloop
  INPUTS.Initialize(GameLoop);
  CONDITIONS.Initialize(GameLoop);
  AGENTS.Initialize(GameLoop);
  MANAGERS.Initialize(GameLoop);
  REFEREE.Initialize(GameLoop);
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
