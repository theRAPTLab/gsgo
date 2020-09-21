/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { interval } from 'rxjs';
// runtime data modules
import INPUTS from './sim_inputs';
import CONDITIONS from './sim_conditions';
import AGENTS from './sim_agents';
import REFEREE from './sim_referee';
import FEATURES from './sim_features';
import RENDERER from '../vis/sim_render';
import TestRenderer from '../tests/test-renderer';

/// DEBUG /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('RUNTIME');
const DBG = false;

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// create PhaseMachine to manage gameloop
const GameLoop = new UR.class.PhaseMachine('SIM', {
  PHASE_LOAD: ['RESET', 'SETMODE', 'WAIT', 'PROGRAM', 'INIT', 'READY'],
  PHASE_LOOP: [
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
    'RENDER'
  ]
});
console.log(...PR('SimLoop Created'));

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// RXJS TESTS ////////////////////////////////////////////////////////////////
let obs_frame_interval = interval(33);
let sub_frame;

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function LoadSimulation() {
  // load agents and assets
  // prep recording buffer
  console.log(...PR('LoadSimulation'));
  (async () => {
    await GameLoop.ExecutePhase('PHASE_LOAD');
  })();
}

/// MAIN RUN CONTROL //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RunSimulation() {
  // prepare to run simulation and do first-time setup
  console.log(...PR('RunSimulation'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function StepSimulation(frame) {
  /* insert game pause control here */
  // synchronous version
  // (async () => {
  //   await GameLoop.ExecutePhase('PHASE_LOOP', frame);
  // })();
  // async version
  GameLoop.ExecutePhase('PHASE_LOOP', frame);
  /* insert game logic here */
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function StartSimulation() {
  console.log(...PR('StartSimulation'));

  sub_frame = obs_frame_interval.subscribe(StepSimulation);
  // console.log(obs_frame_interval);
}

/// SUPPORTING CONTROLS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function UpdateSimulation() {
  // application host has changed
  console.log(...PR('RunSimulation'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PauseSimulation() {
  // set the playback rate from 0 to 10
  // can we support backing up in the buffer?
  // can we offer forward simulation from the playback buffer
  console.log(...PR('PauseSimulation'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function EndSimulation() {
  // stop simulation
  console.log(...PR('EndSimulation'));
  sub_frame.unsubscribe();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ExportSimulation() {
  // grab data from the simulation
  console.log(...PR('ExportSimulation'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ResetSimulation() {
  // return simulation to starting state, ready to run
  console.log(...PR('ResetSimulation'));
  (async () => {
    await GameLoop.ExecutePhase('PHASE_LOAD');
  })();
}

/// MODULE INIT ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('UR', 'APP_STAGE', LoadSimulation);
UR.SystemHook('UR', 'APP_START', StartSimulation);
UR.SystemHook('UR', 'APP_RUN', RunSimulation);
UR.SystemHook('UR', 'APP_UPDATE', UpdateSimulation);
UR.SystemHook('UR', 'APP_RESET', ResetSimulation);
// register debugging messages for GameLoop phases
const u_dump = (phases, index) => {
  if (!DBG) return;
  if (index === 0) console.log('start of PHASE', index);
  if (index === phases.length) console.log('end of PHASE', index);
  else console.log(`.. executing ${index} ${phases[index]}`);
};
GameLoop.Hook('PHASE_LOAD', u_dump);
GameLoop.Hook('PHASE_LOOP', u_dump);

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
