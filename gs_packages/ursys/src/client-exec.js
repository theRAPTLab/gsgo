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
const PR = require('./util/prompts').makeStyleFormatter('SYSTEM', 'TagBlue');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// PRIVATE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PHASES = {
  PHASE_BOOT: [
    'TEST_INIT', // set any testing parameters or modes
    'SYS_BOOTSTRAP' // grab initial props to load the rest of URSYS
  ],
  PHASE_INIT: [
    'SYS_INIT', // initialize key runtime parameters
    'DOM_READY', // the dom is stable
    'TEST_LOCAL' // run local tests that don't require network calls
  ],
  PHASE_CONNECT: [
    'NET_CONNECT', // initiate connection
    'NET_REGISTER', // initiate registration
    'NET_READY', // the network is stable
    'TEST_NET' // run tests that require network readiness
  ],
  PHASE_LOAD: [
    'LOAD_CONFIG', // app modules can request asynchronous loads
    'LOAD_ASSETS' // can use loaded configs to load assets
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
    'APP_UPDATE', // periodic heartbeat
    'APP_RESET', // app_module will jump back to APP_RUN
    'APP_RESTAGE' // significant context change, should do deeper restart
  ],
  PHASE_PAUSED: [
    'APP_PAUSE', // app modules should enter "paused state"
    'APP_PAUSED', // app modules receive configuration update
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
const { executePhase, execute } = PHASE_MACHINE;

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
/** API: start the lifecycle state engine, connecting to the network
 */
async function SystemBoot(options = {}) {
  //
  if (DBG) console.group('** URSYS: Boot');
  //
  m_CheckOptions(options);
  URSession.InitializeNetProps(options.netProps);
  //
  await executePhase('PHASE_BOOT');
  await executePhase('PHASE_INIT');
  await executePhase('PHASE_CONNECT');
  //
  if (DBG) console.groupEnd();
}
//// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: initialize, configure, and load data after SystemBoot
 */
async function SystemConfig(options = {}) {
  //
  if (DBG) console.group('** URSYS: Config');
  //
  await executePhase('PHASE_LOAD');
  await executePhase('PHASE_CONFIG');
  //
  await executePhase('PHASE_READY');
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
  // PART 1 - SYSTEM RUN (part of PHASE_RUN group)
  m_CheckOptions(options);
  //
  console.log(...PR('URSYS: STAGE START RUN'));
  await execute('APP_STAGE');
  await execute('APP_START');
  await execute('APP_RUN');
  console.log(...PR('URSYS: PHASED STARTUP COMPLETE'));
  // PART 2 - after the run has started, there are no periodic updates
  //          unless you add them yourself
  if (DBG) console.groupEnd();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: something important application-wide has updated
 */
async function SystemUpdate() {
  if (DBG) console.groupCollapsed('** URSYS: Restage');
  //
  await execute('APP_RESTAGE');
  //
  if (DBG) console.groupEnd();
  SystemRun();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: force loop back to run
 */
async function SystemRestage() {
  if (DBG) console.groupCollapsed('** URSYS: Restage');
  //
  await execute('APP_RESET');
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
  await executePhase('PHASE_UNLOAD');
  //
  if (DBG) console.groupEnd();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: restart the lifecycle from boot
 */
async function SystemReboot() {
  if (DBG) console.groupCollapsed('** URSYS: Reboot');
  //
  await executePhase('PHASE_REBOOT');
  //
  if (DBG) console.groupEnd();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  SystemBoot,
  SystemConfig,
  SystemRun,
  SystemUpdate,
  SystemRestage,
  SystemUnload,
  SystemReboot
};
