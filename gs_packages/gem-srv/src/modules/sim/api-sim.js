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
import './sim-agents';
import './sim-referee';
import './sim-features';
import './sim-render';
import {
    RoundsReset,
    RoundInit,
    RoundStart,
    RoundStop,
    StageInit
} from './sim-rounds';

// import submodules
import { GAME_LOOP } from './api-sim-gameloop';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM');

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
    completed: false,
    timer: undefined
};

/// RXJS STREAM COMPUTER //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let SIM_FRAME_MS = interval((1 / 30) * 1000);
let RX_SUB;
let SIM_RATE = 0; // 0 = stopped, 1 = going. HACKY for DEC 1
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Step(frameCount) {
    /* insert conditional run control here */
    GAME_LOOP.executePhase('GLOOP', frameCount);
    if (frameCount % 30 === 0) UR.RaiseMessage('SCRIPT_EVENT', { type: 'Tick' });
    /* insert game logic here */
}
// Timer PRERUN loop
function m_PreRunStep(frameCount) {
    GAME_LOOP.executePhase('GLOOP_PRERUN', frameCount);
}
// Timer PLACES loop
function m_CostumesStep(frameCount) {
    GAME_LOOP.executePhase('GLOOP_COSTUMES', frameCount);
}
// Timer POSTRUN loop
function m_PostRunStep(frameCount) {
    GAME_LOOP.executePhase('GLOOP_POSTRUN', frameCount);
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// LOADING CONTROL ///////////////////////////////////////////////////////////
function Stage() {
<<<<<<< HEAD
  // load agents and assets
  // prep recording buffer
  (async () => {
    // Unsubscribe if previously run, otherwise it'll keep running.
    if (RX_SUB) RX_SUB.unsubscribe();
    console.log(...PR('Loading Simulation'));
    await GAME_LOOP.executePhase('GLOOP_LOAD');
    console.log(...PR('Simulation Loaded'));
    console.log(...PR('Staging Simulation'));
    await GAME_LOOP.executePhase('GLOOP_STAGED');
    console.log(...PR('Simulation Staged'));
    StageInit();
    SIMSTATUS.currentLoop = LOOP.STAGED;
    SIMSTATUS.completed = false;
    // NextRound();

    // On first staging, do prerun WITHOUT RoundInit
    // so that characters get drawn on screen.
    RX_SUB = SIM_FRAME_MS.subscribe(m_PreRunStep);
  })();
=======
    // load agents and assets
    // prep recording buffer
    (async() => {
        // Unsubscribe if previously run, otherwise it'll keep running.
        if (RX_SUB) RX_SUB.unsubscribe();
        console.log(...PR('Loading Simulation'));
        await GAME_LOOP.executePhase('GLOOP_LOAD');
        console.log(...PR('Simulation Loaded'));
        console.log(...PR('Staging Simulation'));
        await GAME_LOOP.executePhase('GLOOP_STAGED');
        console.log(...PR('Simulation Staged'));
        StageInit();
        SIMSTATUS.currentLoop = LOOP.STAGED;
        SIMSTATUS.completed = false;
        // NextRound();

        // On first staging, do prerun WITHOUT RoundInit
        // so that characters get drawn on screen.
        RX_SUB = SIM_FRAME_MS.subscribe(m_PreRunStep);
    })();
>>>>>>> coreyacttwo
}

/// RUNTIME CONTROL ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NextRound() {
    // stop simulation
    console.log(...PR('NextRound'));
    if (RX_SUB) RX_SUB.unsubscribe();
    SIM_RATE = 0;
    console.log(...PR('Pre-run Loop Starting'));
    SIMSTATUS.currentLoop = LOOP.PRERUN;
    RoundInit(SIMSTATUS);
    UR.RaiseMessage('SCRIPT_EVENT', { type: 'RoundInit' });
    RX_SUB = SIM_FRAME_MS.subscribe(m_PreRunStep);
    console.log(...PR('Pre-run Loop Running...Monitoring Inputs'));
}

function Costumes() {
    console.log(...PR('Costumes!'));
    // Unsubscribe from PRERUN, otherwise it'll keep running.
    if (RX_SUB) RX_SUB.unsubscribe();
    RX_SUB = SIM_FRAME_MS.subscribe(m_CostumesStep);
    SIMSTATUS.currentLoop = LOOP.COSTUMES;
    UR.RaiseMessage('SCRIPT_EVENT', { type: 'Costumes' });
}

function Run() {
    // prepare to run simulation and do first-time setup
    // compiles happen after Run()
    // but simulation has not started
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** once the simluation is initialized, start the periodic frame update */
function Start() {
    if (SIM_RATE === 1) {
        console.log(...PR('Simulation already started'));
        return;
    }
    console.log(...PR('Simulation Timestep Started'));
    SIM_RATE = 1;
    // Unsubscribe from PRERUN, otherwise it'll keep running.
    if (RX_SUB) RX_SUB.unsubscribe();
    RX_SUB = SIM_FRAME_MS.subscribe(m_Step);
    SIMSTATUS.currentLoop = LOOP.RUN;
    RoundStart(Stop);
    UR.RaiseMessage('SCRIPT_EVENT', { type: 'Start' });
}

/// MODE CHANGE CONTROL ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Restage() {
    // application host has changed
    console.log(...PR('Global Simulation State has changed! Broadcasting SYSEX'));
    GAME_LOOP.execute('SYSEX');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Pause() {
    // set the playback rate from 0 to 10
    // can we support backing up in the buffer?
    // can we offer forward simulation from the playback buffer
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Stop() {
    // stop simulation (pause, allow resume)
    console.log(...PR('Stop'));
    RX_SUB.unsubscribe();
    SIM_RATE = 0;
    console.log(...PR('Post-run Loop Starting'));
    SIMSTATUS.currentLoop = LOOP.POSTRUN;
    SIMSTATUS.completed = RoundStop();
    UR.RaiseMessage('SCRIPT_EVENT', { type: 'RoundStop' });
    RX_SUB = SIM_FRAME_MS.subscribe(m_PostRunStep);
    console.log(...PR('Post-run Loop Running...Monitoring Inputs'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function End() {
    // end simulation
    console.log(...PR('End'));
    RX_SUB.unsubscribe();
    SIM_RATE = 0;
    console.log(...PR('Pre-run Loop Starting'));
    SIMSTATUS.currentLoop = LOOP.PRERUN;
    RX_SUB = SIM_FRAME_MS.subscribe(m_PreRunStep);
    console.log(...PR('Pre-run Loop Running...Monitoring Inputs'));
}

/// MODEL LOAD/SAVE CONTROL ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Export() {
    // grab data from the simulation
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Reset() {
    // return simulation to starting state, ready to run
    (async() => {
        // Orig Code
        // await GAME_LOOP.executePhase('GLOOP_LOAD');

        // Reset Rounds
        RoundsReset();
        SIMSTATUS.completed = false;

        // Re-Stage
        Stage(); // results in agentWidgets already in blueprint
    })();
}

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsRunning() {
    return SIM_RATE > 0;
}

function RoundsCompleted() {
    return SIMSTATUS.completed;
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('UR/APP_STAGE', Stage);
UR.HookPhase('UR/APP_RUN', Run);
UR.HookPhase('UR/APP_RESET', Reset);
UR.HookPhase('UR/APP_RESTAGE', Restage);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
    Stage,
    Costumes,
    Start,
    Pause,
    Stop,
    NextRound,
    End,
    Export,
    Reset,
    IsRunning,
    RoundsCompleted
};
