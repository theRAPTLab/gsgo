/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable consistent-return */
/* eslint-disable no-debugger */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Application Lifecycle Controller

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/**
 * @module URExec
 */
/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URSESSION = require('./client-session');
const URPHASER = require('./class-phase-machine');
const PR = require('./util/prompts').makeLogHelper('EXEC');

/// DEBUG CONSTANTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// PRIVATE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PHASES = {
  PHASE_BOOT: [
    'TEST_INIT', // hook to set any testing parameters or modes
    'SYS_BOOTSTRAP' // grab initial props to load the rest of URSYS
  ],
  PHASE_INIT: [
    'SYS_INIT', // initialize key runtime parameters
    'DOM_READY' // the dom is stable
  ],
  PHASE_CONNECT: [
    'NET_CONNECT', // initiate connection
    'NET_REGISTER', // initiate registration
    'NET_READY' // the network is stable
  ],
  PHASE_LOAD: [
    'APP_LOAD' // app modules can request asynchronous loads
  ],
  PHASE_CONFIG: [
    'APP_CONFIGURE' // app modules can configure data structure from loaded data
  ],
  PHASE_READY: [
    'APP_READY' // all apps have loaded and configured and are ready to run
  ],
  PHASE_RUN: [
    'APP_STAGE', // app modules receive reset params prior to starting
    'APP_START', // app modules start execution, all modules are ready
    'APP_RUN', // app modules enter run mode
    'APP_UPDATE', // app modules execute a step
    'DOM_ANIMFRAME', // app modules animation frame
    'APP_NEXT' // app_module jump back to start of RUN
  ],
  PHASE_PAUSED: [
    'APP_PAUSE', // app modules should enter "paused state"
    'APP_UPDATE', // app modules still receive update
    'DOM_ANIMFRAME', // app modules still receive animframe
    'APP_UNPAUSE' // app modules cleanup, then back to 'APP_LOOP'
  ],
  PHASE_UNLOAD: [
    'APP_STOP', // app is stopping
    'APP_UNLOAD', // app is shutting down; release assets
    'APP_SHUTDOWN' // app is shut down
  ],
  PHASE_REBOOT: [
    'SYS_REBOOT' // system is about to reboot back to PHASE_BOOT
  ]
};

/// PHASER ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let PHASE_MACHINE = new URPHASER(PHASES, '');
const { ExecutePhase, Execute, Hook, GetHookFunctions } = PHASE_MACHINE;

/// STATE /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let SIM_TIMER_ID; // timer id for sim stepper
let SIM_INTERVAL_MS = 3000;
let SIM_UPDATE_HOOKS = [];
let SYS_ANIMFRAME_RUN = true;
let SYS_ANIMFRAME_HOOKS = [];

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: clear timers
 */
function m_ClearTimers() {
  if (SIM_TIMER_ID) clearInterval(SIM_TIMER_ID);
  SIM_TIMER_ID = 0;
  SYS_ANIMFRAME_RUN = 0;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: check options passed to SystemBoot, etc
 */
function m_CheckOptions(options) {
  const { autoRun, doUpdates, doAnimFrames, netProps, ...other } = options;
  const unknown = Object.keys(other);
  if (unknown.length) {
    console.log(...PR(`warn - L1_OPTION unknown param: ${unknown.join(', ')}`));
    throw Error('URSYS: bad option object');
  } else if (DBG) console.log(...PR('info - L1_OPTION pass'));
  // return true if there were no unknown option properties
  return unknown.length === 0;
}

/// RUNTIME API CALLS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: start the lifecycle state engine
 */
async function SystemBoot(options = {}) {
  //
  if (DBG) console.groupCollapsed('** System: Boot');
  m_CheckOptions(options);
  URSESSION.InitializeNetProps(options.netProps);
  //
  await ExecutePhase('PHASE_BOOT');
  await ExecutePhase('PHASE_INIT');
  await ExecutePhase('PHASE_CONNECT');
  await ExecutePhase('PHASE_LOAD');
  await ExecutePhase('PHASE_CONFIG');
  await ExecutePhase('PHASE_READY');
  //
  if (options.autoRun) {
    if (DBG) console.log(...PR('info - autoRun to next phase'));
    if (DBG) console.groupEnd();
    SystemRun(options);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: start the lifecycle run engine. This code is a bit convoluted because
 *  I'm trying to avoid allocating temporary variables that cause the heap
 *  to grow for each timer.
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function SystemRun(options = {}) {
  // PART 1 - SYSTEM RUN
  if (DBG) console.groupCollapsed('** System: Run');
  m_CheckOptions(options);
  //
  m_ClearTimers();
  //
  await Execute('APP_STAGE');
  await Execute('APP_START');
  await Execute('APP_RUN');

  // PART 2 - SYSTEM UPDATE
  if (DBG) console.groupEnd();
  if (DBG) console.groupCollapsed('** System: Update');
  // static declaration
  let _COUNT;
  // update timer (doesn't grow heap by itself)
  function u_simexec() {
    for (_COUNT = 0; _COUNT < SIM_UPDATE_HOOKS.length; _COUNT++)
      SIM_UPDATE_HOOKS[_COUNT](SIM_INTERVAL_MS);
  }
  // animframe timer (seems to slowly grow heap
  function u_animexec(ts) {
    for (_COUNT = 0; _COUNT < SYS_ANIMFRAME_HOOKS.length; _COUNT++)
      SYS_ANIMFRAME_HOOKS[_COUNT](ts);
  }
  function u_animframe(ts) {
    if (SYS_ANIMFRAME_RUN) window.requestAnimationFrame(u_animframe);
    u_animexec(ts);
  }
  // set up SIM_TIMER
  if (options.doUpdates) {
    if (DBG) console.log(...PR('info - starting simulation updates'));
    SIM_UPDATE_HOOKS = GetHookFunctions('APP_UPDATE');
    if (SIM_TIMER_ID) clearInterval(SIM_TIMER_ID);
    SIM_TIMER_ID = setInterval(u_simexec, SIM_INTERVAL_MS);
  }
  // set up ANIMFRAME
  SYS_ANIMFRAME_RUN = options.doAnimFrames || false;
  if (SYS_ANIMFRAME_RUN) {
    if (DBG) console.log(...PR('info - starting animframe updates'));
    SYS_ANIMFRAME_HOOKS = GetHookFunctions('DOM_ANIMFRAME');
    // start animframe process
    window.requestAnimationFrame(u_animframe);
  }
  if (!(options.doUpdates || options.doAnimFrames)) {
    console.log(...PR('info - no periodic updates are enabled'));
  }
  if (DBG) console.groupEnd();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: force loop back to run
 */
async function SystemRestage() {
  if (DBG) console.groupCollapsed('** System: Restage');
  // clear running timers
  m_ClearTimers();
  //
  await Execute('APP_NEXT');
  //
  if (DBG) console.groupEnd();
  SystemRun();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: end the lifecycle state engine
 */
async function SystemUnload() {
  if (DBG) console.groupCollapsed('** System: Unload');
  // clear running timers
  m_ClearTimers();
  //
  await ExecutePhase('PHASE_UNLOAD');
  //
  if (DBG) console.groupEnd();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: restart the lifecycle from boot
 */
async function SystemReboot() {
  if (DBG) console.groupCollapsed('** System: Reboot');
  // clear running timers
  m_ClearTimers();
  //
  await ExecutePhase('PHASE_REBOOT');
  //
  if (DBG) console.groupEnd();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  SystemHook: Hook,
  SystemBoot,
  SystemRun,
  SystemRestage,
  SystemUnload,
  SystemReboot
};
