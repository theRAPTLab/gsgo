/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  RUNTIME

  It is the "master controller" for the simulation module. It creates the
  'SIM' PhaseMachine. All sim_* modules hook into the SIM PhaseMachine
  independently to participate in the simulation lifecycle.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { interval } from 'rxjs';
// runtime data modules
// these have their own phasemachine interface hooks
import './sim_inputs';
import './sim_conditions';
import './sim_agents';
import './sim_referee';
import './sim_features';
import './sim_render';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_RUNTIME', 'TagCyan');
const DBG = false;

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// create PhaseMachine to manage gameloop
const GAME_LOOP = new UR.class.PhaseMachine('SIM', {
  GLOOP_LOAD: ['RESET', 'SETMODE', 'WAIT', 'PROGRAM', 'INIT', 'READY'],
  GLOOP_CONTROL: ['SYSEX'], // system change before start of GLOOP
  GLOOP: [
    // get state and queue derived state
    'INPUTS',
    'PHYSICS',
    'TIMERS',
    // agent/groups autonomous updates
    'AGENTS_UPDATE',
    'GROUPS_UPDATE',
    'FEATURES_UPDATE',
    // process conditions and collection
    'CONDITIONS_UPDATE',
    // agent/groups script execution and queue actions
    'FEATURES_THINK',
    'GROUPS_THINK',
    'AGENTS_THINK',
    'GROUPS_VETO',
    // agent/groups execute queue actions
    'FEATURES_EXEC',
    'AGENTS_EXEC',
    'GROUPS_EXEC',
    // simulation
    'SIM_EVAL',
    'REFEREE_EVAL',
    // display output
    'VIS_UPDATE',
    'VIS_RENDER'
  ]
});
console.log(...PR('SimLoop Created'));

/// RXJS STREAM COMPUTER //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let SIM_FRAME_MS = interval(33);
let RX_SUB;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_StepSimulation(frameCount) {
  /* insert conditional run control here */
  GAME_LOOP.ExecutePhase('GLOOP', frameCount);
  /* insert game logic here */
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// LOADING CONTROL ///////////////////////////////////////////////////////////
function LoadSimulation() {
  // load agents and assets
  // prep recording buffer
  (async () => {
    await GAME_LOOP.ExecutePhase('GLOOP_LOAD');
    console.log(...PR('Simulation Loaded'));
  })();
}

/// RUNTIME CONTROL ///////////////////////////////////////////////////////////
function RunSimulation() {
  // prepare to run simulation and do first-time setup
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** once the simluation is initialized, start the periodic frame update */
function StartSimulation() {
  console.log(...PR('Simulation Timestep Started'));
  RX_SUB = SIM_FRAME_MS.subscribe(m_StepSimulation);
}

/// MODE CHANGE CONTROL ///////////////////////////////////////////////////////
function UpdateSimulation() {
  // application host has changed
  console.log(...PR('Global Simulation State has changed! Broadcasting SYSEX'));
  GAME_LOOP.Execute('SYSEX');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PauseSimulation() {
  // set the playback rate from 0 to 10
  // can we support backing up in the buffer?
  // can we offer forward simulation from the playback buffer
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function EndSimulation() {
  // stop simulation
  console.log(...PR('EndSimulation'));
  RX_SUB.unsubscribe();
}

/// MODEL LOAD/SAVE CONTROL ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ExportSimulation() {
  // grab data from the simulation
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ResetSimulation() {
  // return simulation to starting state, ready to run
  (async () => {
    console.log(...PR('ResetSimulation'));
    await GAME_LOOP.ExecutePhase('GLOOP_LOAD');
  })();
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('UR', 'APP_STAGE', LoadSimulation);
UR.SystemHook('UR', 'APP_START', StartSimulation);
UR.SystemHook('UR', 'APP_RUN', RunSimulation);
UR.SystemHook('UR', 'APP_UPDATE', UpdateSimulation);
UR.SystemHook('UR', 'APP_RESET', ResetSimulation);
// register debugging messages for GAME_LOOP phases
const u_dump = (phases, index) => {
  if (!DBG) return;
  if (index === 0) console.log('start of PHASE', index);
  if (index === phases.length) console.log('end of PHASE', index);
  else console.log(`.. executing ${index} ${phases[index]}`);
};
GAME_LOOP.Hook('GLOOP_LOAD', u_dump);
GAME_LOOP.Hook('GLOOP', u_dump);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  LoadSimulation,
  StartSimulation,
  PauseSimulation,
  EndSimulation,
  ExportSimulation,
  ResetSimulation
};
