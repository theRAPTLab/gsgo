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
const NETINFO = require('./client-netinfo');
const PhaseMachine = require('./class-phase-machine');
const PR = require('./util/prompts').makeStyleFormatter('SYSTEM', 'TagBlue');
const { CFG_URNET_SERVICE } = require('./ur-common');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

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
let PHASE_MACHINE = new PhaseMachine('UR', PHASES, '');
const { executePhase, execute } = PHASE_MACHINE;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: check options passed to SystemNetBoot */
function m_CheckNetOptions(netOpt) {
  const { broker, client, ...other } = netOpt;
  const unknown = Object.keys(other);
  if (unknown.length) {
    console.log(...PR(`warn - L1_OPTION unknown param: ${unknown.join(', ')}`));
    throw Error('URSYS: bad option object');
  }
  // return true if there were no unknown option properties
  return unknown.length === 0;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: check options passed to SystemAppConfig */
function m_CheckConfigOptions(cfgOpt) {
  const { autoRun, ...other } = cfgOpt;
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
async function SystemNetBoot() {
  //
  if (DBG) console.groupCollapsed('** URSYS: Boot');
  else console.log(...PR('EXEC PHASE_BOOT, PHASE_INIT, PHASE_CONNECT'));
  // APP INITIALIZATION
  await executePhase('PHASE_BOOT');
  await executePhase('PHASE_INIT');
  // CONNECT TO URNET
  const response = await fetch(CFG_URNET_SERVICE);
  const netInfo = await response.json();
  m_CheckNetOptions(netInfo);
  console.log('netinfo', netInfo);
  NETINFO.SaveNetInfo(netInfo);
  await executePhase('PHASE_CONNECT');
  //
  if (DBG) console.groupEnd();
}
//// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: initialize, configure, and load data after SystemNetBoot
 */
async function SystemAppConfig(options = {}) {
  //
  if (DBG) console.groupCollapsed('** URSYS: Config');
  else console.log(...PR('EXEC PHASE_LOAD, PHASE_CONFIG, PHASE_READY'));
  m_CheckConfigOptions(options);
  //
  await executePhase('PHASE_LOAD');
  await executePhase('PHASE_CONFIG');
  //
  await executePhase('PHASE_READY');
  //
  if (options.autoRun) {
    if (DBG) console.log(...PR('info - autoRun to next phase'));
    if (DBG) console.groupEnd();
    SystemAppRun(options);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: start the lifecycle run engine. This code is a bit convoluted because
 *  I'm trying to avoid allocating temporary variables that cause the heap
 *  to grow for each timer.
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function SystemAppRun(options = {}) {
  // PART 1 - SYSTEM RUN (part of PHASE_RUN group)
  m_CheckConfigOptions(options);
  //
  if (DBG) console.log(...PR('URSYS: STAGE START RUN'));
  else console.log(...PR('EXEC APP_STAGE APP_START APP_RUN'));
  await execute('APP_STAGE');
  await execute('APP_START');
  await execute('APP_RUN');
  if (DBG) console.log(...PR('URSYS: PHASED STARTUP COMPLETE'));
  // PART 2 - after the run has started, there are no periodic updates
  //          unless you add them yourself
  if (DBG) console.groupEnd();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: something important application-wide has updated
 */
async function SystemAppUpdate() {
  if (DBG) console.groupCollapsed('** URSYS: Restage');
  //
  await execute('APP_RESTAGE');
  //
  if (DBG) console.groupEnd();
  SystemAppRun();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: force loop back to run
 */
async function SystemAppRestage() {
  if (DBG) console.groupCollapsed('** URSYS: Restage');
  //
  await execute('APP_RESET');
  //
  if (DBG) console.groupEnd();
  SystemAppRun();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: end the lifecycle state engine
 */
async function SystemAppUnload() {
  if (DBG) console.groupCollapsed('** URSYS: Unload');
  //
  await executePhase('PHASE_UNLOAD');
  //
  if (DBG) console.groupEnd();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: restart the lifecycle from boot
 */
async function SystemNetReboot() {
  if (DBG) console.groupCollapsed('** URSYS: Reboot');
  //
  await executePhase('PHASE_REBOOT');
  //
  if (DBG) console.groupEnd();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  SystemNetBoot,
  SystemAppConfig,
  SystemAppRun,
  SystemAppUpdate,
  SystemAppRestage,
  SystemAppUnload,
  SystemNetReboot
};
