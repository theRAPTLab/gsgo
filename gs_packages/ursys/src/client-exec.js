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
const URSession = require('./client-session');
const URPhaseMachine = require('./class-phase-machine');
const PR = require('./util/prompts').makeStyleFormatter('UR.EXC');

/// CONSTANTS /////////////////////////////////////////////////////////////////
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
    'APP_UPDATE', // app modules configuration update
    'APP_RESET' // app_module will jump back to APP_RUN
  ],
  PHASE_PAUSED: [
    'APP_PAUSE', // app modules should enter "paused state"
    'APP_UPDATE', // app modules configuration update
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
let PHASE_MACHINE = new URPhaseMachine('UR', PHASES, '');
const { ExecutePhase, Execute } = PHASE_MACHINE;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: check options passed to SystemBoot, etc
 */
function m_CheckOptions(options) {
  const { autoRun, netProps, ...other } = options;
  const unknown = Object.keys(other);
  if (unknown.length) {
    console.log(...PR(`warn - L1_OPTION unknown param: ${unknown.join(', ')}`));
    throw Error('URSYS: bad option object');
  }
  // return true if there were no unknown option properties
  return unknown.length === 0;
}

/// RUNTIME API CALLS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: start the lifecycle state engine
 */
async function SystemBoot(options = {}) {
  //
  if (DBG) console.groupCollapsed('** URSYS: Boot');
  m_CheckOptions(options);
  URSession.InitializeNetProps(options.netProps);
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
  if (DBG) console.groupCollapsed('** URSYS: Run');
  m_CheckOptions(options);
  //
  await Execute('APP_STAGE');
  await Execute('APP_START');
  await Execute('APP_RUN');

  if (DBG) console.groupEnd();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: something important application-wide has updated
 */
async function SystemUpdate() {
  if (DBG) console.groupCollapsed('** URSYS: Restage');
  //
  await Execute('APP_UPDATE');
  //
  if (DBG) console.groupEnd();
  SystemRun();
}
/// - - - - - - - - -
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: force loop back to run
 */
async function SystemRestage() {
  if (DBG) console.groupCollapsed('** URSYS: Restage');
  //
  await Execute('APP_RESET');
  //
  if (DBG) console.groupEnd();
  SystemRun();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: end the lifecycle state engine
 */
async function SystemUnload() {
  if (DBG) console.groupCollapsed('** URSYS: Unload');
  //
  await ExecutePhase('PHASE_UNLOAD');
  //
  if (DBG) console.groupEnd();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: restart the lifecycle from boot
 */
async function SystemReboot() {
  if (DBG) console.groupCollapsed('** URSYS: Reboot');
  //
  await ExecutePhase('PHASE_REBOOT');
  //
  if (DBG) console.groupEnd();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  SystemBoot,
  SystemRun,
  SystemUpdate,
  SystemRestage,
  SystemUnload,
  SystemReboot
};
