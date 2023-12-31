/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  RUNTIME

  It is the "master controller" for the simulation module. It creates the
  'SIM' PhaseMachine. All sim-* modules hook into the SIM PhaseMachine
  independently to participate in the simulation lifecycle.

  Ultimately, these methods are invoked from the GUI routed through
  mod-sim-control (now named mx-sim-control)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { interval } from 'rxjs';
// runtime data modules
// these have their own phasemachine interface hooks
import './sim-inputs';
import './sim-conditions';
import './sim-agents';
import './sim-referee';
import './sim-features';
import './sim-render';
import * as ROUNDMGR from './sim-rounds';
import { GAME_LOOP } from './api-sim-gameloop';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM');
const DBG = false;

const LOOP = {
  LOAD: 'load',
  STAGED: 'staged',
  PRERUN: 'prerun',
  COSTUMES: 'costumes',
  RUN: 'run',
  POSTRUN: 'postrun'
};

// used by PanelPlayback to determine which buttons to display
// updated directly by sim-round
export const SIMSTATUS = {
  currentLoop: LOOP.LOAD,
  roundHasBeenStarted: false, // used to prevent script updates after round has started
  completed: false,
  timer: undefined
};

/// RXJS STREAM COMPUTER //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const SIM_TICKS_PER_SEC = 30; // key sim frame rate definition
let SIM_FRAME_MS = interval((1 / SIM_TICKS_PER_SEC) * 1000);
let RX_SUB; // frame step heartbeat provided by RXJS
let SIM_RATE = 0; // 0 = stopped, 1 = going. HACKY for DEC 1
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Step(frameCount) {
  /* insert conditional run control here */
  GAME_LOOP.executePhase('GLOOP', frameCount);
  if (frameCount % SIM_TICKS_PER_SEC === 0)
    UR.RaiseMessage('SCRIPT_EVENT', { type: 'Tick' });
  /* insert game logic here */
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Timer PRERUN loop */
function m_PreRunStep(frameCount) {
  GAME_LOOP.executePhase('GLOOP_PRERUN', frameCount);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Timer PLACES loop */
function m_CostumesStep(frameCount) {
  GAME_LOOP.executePhase('GLOOP_COSTUMES', frameCount);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Timer POSTRUN loop */
function m_PostRunStep(frameCount) {
  GAME_LOOP.executePhase('GLOOP_POSTRUN', frameCount);
}

/// LOAD SIMULATION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// This is initially called by UR.SystemAppRun (via UR.SystemAppConfig)
/// On Main, it is triggered by Main.componentDidMount
///
/// APP_RUN will cause project-server to run Initialize,
/// which will run SIMCTRL.DoSimReset, which in turn triggers
/// this.Reset() and then this.Stage().  The Reset and second
/// Stage() call ends up happening while the first
let STAGE_IS_BEING_INITED = false;
function Stage() {
  if (STAGE_IS_BEING_INITED) {
    console.warn(
      ...PR(
        'Stage() was already called and is still in progress!  Skipping.  Please review call order!'
      )
    );
    return;
  }
  STAGE_IS_BEING_INITED = true;
  // load agents and assets
  // prep recording buffer
  if (RX_SUB) {
    RX_SUB.unsubscribe();
    RX_SUB = undefined;
  }
  void (async () => {
    // load everything, then stage it
    // NOTE these async loops may take a while to finish executing!!!
    if (DBG) console.log(...PR('Loading Simulation'));
    await GAME_LOOP.executePhase('GLOOP_LOAD');
    if (DBG) console.log(...PR('Simulation Loaded'));
    if (DBG) console.log(...PR('Staging Simulation'));
    await GAME_LOOP.executePhase('GLOOP_STAGED');
    if (DBG) console.log(...PR('Simulation Staged'));
    // also stage the round manager
    ROUNDMGR.StageInit();
    // ok, prepare to exit Stage()
    SIMSTATUS.currentLoop = LOOP.STAGED;
    SIMSTATUS.roundHasBeenStarted = false;
    SIMSTATUS.completed = false;
    if (DBG) console.log(...PR('Starting GLOOP_PRERUN Phase'));
    // On first staging, do prerun WITHOUT RoundInit
    // so that characters get drawn on screen.
    RX_SUB = SIM_FRAME_MS.subscribe(m_PreRunStep);
    STAGE_IS_BEING_INITED = false;
  })();
}

/// SPECIAL MODES /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Runs the GLOOP_COSTUMES Phase where pozyx/ptrack/charcontrol inputs
 *  can pickup and inhabit agents BEFORE the simulation starts running. it's
 *  invoked from Main as "Pick Characters" */
function GotoCostumeLoop() {
  if (DBG) console.log(...PR('GotoCostumeLoop!'));
  // Unsubscribe from PRERUN, otherwise it'll keep running.
  if (RX_SUB) RX_SUB.unsubscribe();
  RX_SUB = SIM_FRAME_MS.subscribe(m_CostumesStep);
  SIMSTATUS.currentLoop = LOOP.COSTUMES;
  UR.RaiseMessage('SCRIPT_EVENT', { type: 'Costumes' }); // PickCostumes
}

/// RUNTIME CONTROL ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This is called by PREP ROUND button, which happens before the round
 *  has run despite this name */
function NextRound() {
  if (DBG) console.log(...PR('NextRound'));
  // disable the step update when prepping next round
  if (RX_SUB) RX_SUB.unsubscribe();
  SIM_RATE = 0;
  if (DBG) console.log(...PR('Pre-run Loop Starting'));
  SIMSTATUS.currentLoop = LOOP.PRERUN;
  ROUNDMGR.RoundInit(SIMSTATUS);
  UR.RaiseMessage('SCRIPT_EVENT', { type: 'RoundInit' });
  RX_SUB = SIM_FRAME_MS.subscribe(m_PreRunStep);
  if (DBG) console.log(...PR('Pre-run Loop Running...Monitoring Inputs'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** once the simluation is initialized, start the periodic frame update */
function Start() {
  if (SIM_RATE === 1) {
    if (DBG) console.log(...PR('Simulation already started'));
    return;
  }
  if (DBG) console.log(...PR('Simulation Timestep Started'));
  SIM_RATE = 1;
  // Unsubscribe from PRERUN, otherwise it'll keep running.
  if (RX_SUB) RX_SUB.unsubscribe();
  RX_SUB = SIM_FRAME_MS.subscribe(m_Step);
  SIMSTATUS.currentLoop = LOOP.RUN;
  SIMSTATUS.roundHasBeenStarted = true;
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  ROUNDMGR.RoundStart(Stop);
  UR.RaiseMessage('SCRIPT_EVENT', { type: 'Start' });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** stop the current round */
function Stop() {
  // stop simulation (pause, allow resume)
  if (DBG) console.log(...PR('Stop'));
  RX_SUB.unsubscribe();
  SIM_RATE = 0;
  console.log(...PR('Post-run Loop Starting'));
  SIMSTATUS.currentLoop = LOOP.POSTRUN;
  SIMSTATUS.completed = ROUNDMGR.RoundStop();
  UR.RaiseMessage('SCRIPT_EVENT', { type: 'RoundStop' });
  RX_SUB = SIM_FRAME_MS.subscribe(m_PostRunStep);
  if (DBG) console.log(...PR('Post-run Loop Running...Monitoring Inputs'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** run the next round after current round */
function End() {
  // end simulation
  if (DBG) console.log(...PR('End'));
  RX_SUB.unsubscribe();
  SIM_RATE = 0;
  if (DBG) console.log(...PR('Pre-run Loop Starting'));
  SIMSTATUS.currentLoop = LOOP.PRERUN;
  RX_SUB = SIM_FRAME_MS.subscribe(m_PreRunStep);
  if (DBG) console.log(...PR('Pre-run Loop Running...Monitoring Inputs'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** start from the beginning at round 1 */
function Reset() {
  // return simulation to starting state, ready to run
  void (async () => {
    ROUNDMGR.RoundsReset();
    SIMSTATUS.completed = false;
    // Re-Stage
    Stage(); // results in Graphing already in blueprint
  })();
}

/// STATUS METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsRunning() {
  return SIM_RATE > 0;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RoundsCompleted() {
  return SIMSTATUS.completed;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RoundHasBeenStarted() {
  return SIMSTATUS.roundHasBeenStarted;
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// @BEN: this is a legacy startup that Ben should explicitly set somewhere
/// else UR/APP_STAGE refers to the reference GLOOP in URSYS. If you take this
/// out, then the sim doesn't draw

// BL NOTE: Each app (e.g. Main, ScriptEditor, CharController, Viewer), should call
// UR.SystemAppConfig({autoRun:true}), which will in turn call api-sim.Stage().
// If they don't then this call is necessary.  But if you use this call,
// watch out for overlapping Stage() calls which can result in multiple
// simultaneous game loops running.  STAGE_IS_BEING_INITED should prevent that.
// UR.HookPhase('UR/APP_STAGE', Stage);

// UR.HookPhase('UR/APP_RESET', Reset); // never reached in ursys app gloop
// UR.HookPhase('UR/APP_RUN', Run); // empty function
// UR.HookPhase('UR/APP_RESTAGE', Restage); // unused function

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// pseudo state machine
export {
  Stage, //
  Start, //
  Stop, //
  NextRound, //
  End, //
  Reset //
};
/// pseudo state machine external side states
export {
  GotoCostumeLoop // invoked by "Pick Characters" in Main
};
export {
  IsRunning, // sim is running
  RoundsCompleted, // number of rounds
  RoundHasBeenStarted // round is running
};
