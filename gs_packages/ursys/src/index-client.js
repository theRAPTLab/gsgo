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
const PR = PROMPTS.makeLogHelper('_URS');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const nc_sub = new URChannel('ursys-sub');
const nc_pub = new URChannel('ursys-pub');
let URSYS_RUNNING = false;

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initialize dependent libraries
 */
function URSYS_Initialize(initializers = []) {
  if (URSYS_RUNNING) {
    console.log(...PR('URSYS_Initialize: Already running!!!'));
    return false;
  }
  console.groupCollapsed('** URSYS: Initialize');

  // autoconnect to URSYS network during NET_CONNECT
  URExec.SystemHook(
    'NET_CONNECT',
    () =>
      new Promise((resolvbe, reject) =>
        URNet.Connect(nc_sub, { success: resolvbe, failure: reject })
      )
  );
  const u_log = msg => console.log(...PR('URSYS_Initialize:', msg));
  initializers.forEach((mod = {}) => {
    const { UR_Initialize: initalizer } = mod;
    if (initalizer) {
      const retvalue = initalizer(u_log);
      if (retvalue) console.log(...PR(`unimplemented: retvalue=${retvalue}`));
    } else {
      console.log(...PR('URSYS_Initialize: no initializer function', mod));
    }
  });
  console.groupEnd();
  URSYS_RUNNING = true;
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** deallocate any system resources assigned during Initialize
 */
function URSYS_Shutdown() {
  if (!URSYS_RUNNING) {
    console.log(...PR('URSYS_Shutdown: URSYS is not running!!!'));
    return;
  }
  // close the network
  URNet.Close();
  URSYS_RUNNING = false;
  // force a reload
  window.location.reload();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ...META,
  // MAIN API
  URSYS_Initialize,
  URSYS_Shutdown,
  // FORWARDED GENERAL PUB/SUB
  Subscribe: nc_sub.Subscribe,
  Unsubscribe: nc_sub.Unsubscribe,
  Publish: nc_pub.LocalPublish,
  Signal: nc_pub.LocalSignal,
  Call: nc_pub.LocalCall,
  // FORWARDED EXEC API
  SystemBoot: URExec.SystemBoot,
  SystemHook: URExec.SystemHook,
  SystemRun: URExec.SystemRun,
  SystemRestage: URExec.SystemRestage,
  SystemReboot: URExec.SystemReboot,
  SystemUnload: URExec.SystemUnload,
  // HELPER CLASSES
  class: {
    PhaseMachine
  },
  // CONVENIENCE MODULES
  util: { PROMPTS }
};
