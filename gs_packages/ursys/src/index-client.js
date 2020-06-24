/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS CLIENT MAIN ENTRY

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URChannel = require('./client-channel');
const URNet = require('./client-network');
const URExec = require('./client-exec');
const PROMPTS = require('./util/prompts');

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
const PR = PROMPTS.makeLogHelper('USYS');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const nc_sub = new URChannel('ursys-sub');
const nc_pub = new URChannel('ursys-pub');
let URSYS_RUNNING = false;

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initialize modules that participate in UR EXEC PhaseMachine
 */
async function SystemHookModules(initializers = []) {
  if (URSYS_RUNNING) {
    console.log(...PR('SystemModulesInit: URSYS already running!!!'));
    return Promise.reject();
  }
  // autoconnect to URSYS network during NET_CONNECT
  URExec.HookModules(initializers).then(() => {
    URExec.SystemHook(
      'NET_CONNECT',
      () =>
        new Promise((resolvbe, reject) =>
          URNet.Connect(nc_sub, { success: resolvbe, failure: reject })
        )
    );
  });
  URSYS_RUNNING = true;
  return Promise.resolve();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** deallocate any system resources assigned during Initialize
 */
async function SystemUnhookModules() {
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
  // SYSTEM PHASEMACHINE START/STOP
  SystemHookModules,
  SystemUnhookModules,
  // FORWARDED PUB/SUB
  Subscribe: nc_sub.Subscribe,
  Unsubscribe: nc_sub.Unsubscribe,
  Publish: nc_pub.LocalPublish,
  Signal: nc_pub.LocalSignal,
  Call: nc_pub.LocalCall,
  // FORWARDED UR EXEC PHASEMACHINE
  SystemBoot: URExec.SystemBoot,
  SystemHook: URExec.SystemHook,
  SystemRun: URExec.SystemRun,
  SystemRestage: URExec.SystemRestage,
  SystemReboot: URExec.SystemReboot,
  SystemUnload: URExec.SystemUnload,
  // CONVENIENCE CLASS ACCESS
  class: {
    PhaseMachine
  },
  // CONVENIENCE MODULES ACCESS
  util: { PROMPTS }
};
