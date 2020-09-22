/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS CLIENT MAIN ENTRY

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URChannel = require('./client-channel');
const URNet = require('./client-network');
const URExec = require('./client-exec');
const PROMPTS = require('./util/prompts');

const PR = PROMPTS.makeStyleFormatter('UR');

/// CLASSES ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PhaseMachine = require('./class-phase-machine');

/// META DATA /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** these properties are exported from the library so you can tell if the
 *  ur instance you're using is serverside or clientside, if that needs
 *  to be checked
 */
const META = {
  _CLIENT: true,
  _SCRIPT: __filename,
  _VERSION: '0.0.1'
};

/// CLIENT-SIDE ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// to be implemented
const Events = {};
const Extensions = {};
const PubSub = {};

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const nc_sub = new URChannel('ursys-sub');
const nc_pub = new URChannel('ursys-pub');
let URSYS_RUNNING = false;

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initialize modules that participate in UR EXEC PhaseMachine before running
 *  SystemBoot, which starts the URSYS lifecycle.
 */
async function SystemStart() {
  if (URSYS_RUNNING) {
    console.log(...PR('SystemStart: URSYS already running!!!'));
    return Promise.reject();
  }
  // autoconnect to URSYS network during NET_CONNECT
  PhaseMachine.QueueHookFor(
    'UR',
    'NET_CONNECT',
    () =>
      new Promise((resolvbe, reject) =>
        URNet.Connect(nc_sub, { success: resolvbe, failure: reject })
      )
  );
  URSYS_RUNNING = true;
  return Promise.resolve();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** deallocate any system resources assigned during Initialize
 */
async function SystemStop() {
  if (!URSYS_RUNNING) {
    console.log(...PR('SystemModulesStop: URSYS is not running!!!'));
    return Promise.resolve();
  }
  // close the network
  await URNet.Close();
  URSYS_RUNNING = false;
  return Promise.resolve();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ...META,
  // FORWARDED PUB/SUB
  Subscribe: nc_sub.Subscribe,
  Unsubscribe: nc_sub.Unsubscribe,
  Publish: nc_pub.LocalPublish,
  Signal: nc_pub.LocalSignal,
  Call: nc_pub.LocalCall,
  // FORWARDED GENERIC PHASE MACHINE
  SystemHook: PhaseMachine.QueueHookFor,
  // SYSTEM STARTUP
  SystemStart,
  SystemStop,
  // FORWARDED SYSTEM CONTROL VIA UREXEC
  SystemBoot: URExec.SystemBoot,
  SystemRun: URExec.SystemRun,
  SystemRestage: URExec.SystemRestage,
  SystemReboot: URExec.SystemReboot,
  SystemUnload: URExec.SystemUnload,
  // FORWARDED PROMPT UTILITY
  PrefixUtil: PROMPTS.makeStyleFormatter,
  SetPromptColor: PROMPTS.setPromptColor,
  // FORWARDED CLASSES
  class: { PhaseMachine }
};
