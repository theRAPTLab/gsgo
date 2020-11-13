/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  RUNTIME

  It is the "master controller" for the simulation module. It creates the
  'SIM' PhaseMachine. All sim-* modules hook into the SIM PhaseMachine
  independently to participate in the simulation lifecycle.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { interval } from 'rxjs';
// runtime data modules
// these have their own phasemachine interface hooks
import './sim-inputs';
import './sim-conditions';
import * as Agents from './sim-agents';
import './sim-referee';
import './sim-features';
import * as Render from './sim-render';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM');
const DBG = false;

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// create PhaseMachine to manage gameloop
const GAME_LOOP = new UR.class.PhaseMachine('SIM', {
  GLOOP_LOAD: [
    'LOAD_ASSETS',
    'RESET',
    'SETMODE',
    'WAIT',
    'PROGRAM',
    'INIT',
    'READY'
  ],
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

/// RXJS STREAM COMPUTER //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let SIM_FRAME_MS = interval((1 / 30) * 1000);
let RX_SUB;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_StepSimulation(frameCount) {
  /* insert conditional run control here */
  GAME_LOOP.executePhase('GLOOP', frameCount);
  /* insert game logic here */
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// LOADING CONTROL ///////////////////////////////////////////////////////////
function StageSimulation() {
  // load agents and assets
  // prep recording buffer
  (async () => {
    console.log(...PR('Loading Simulation'));
    await GAME_LOOP.executePhase('GLOOP_LOAD');
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
function RestageSimulation() {
  // application host has changed
  console.log(...PR('Global Simulation State has changed! Broadcasting SYSEX'));
  GAME_LOOP.execute('SYSEX');
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
    await GAME_LOOP.executePhase('GLOOP_LOAD');
  })();
}

/// AGENT PROGRAMMING /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentProgram(blueprint) {
  Agents.AgentProgram(blueprint);
}

/// URSYS MESSAGE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.RegisterMessage('AGENT_PROGRAM', AgentProgram);

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const u_dump = (phases, index) => {
  if (!DBG) return;
  if (index === 0) console.log('start of PHASE', index);
  if (index === phases.length) console.log('end of PHASE', index);
  else console.log(`.. executing ${index} ${phases[index]}`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('UR/APP_STAGE', StageSimulation);
UR.SystemHook('UR/APP_RUN', RunSimulation);
UR.SystemHook('UR/APP_RESET', ResetSimulation);
UR.SystemHook('UR/APP_RESTAGE', RestageSimulation);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
GAME_LOOP.hook('GLOOP_LOAD', u_dump);
GAME_LOOP.hook('GLOOP', u_dump);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  StageSimulation,
  StartSimulation,
  PauseSimulation,
  EndSimulation,
  ExportSimulation,
  ResetSimulation
};
