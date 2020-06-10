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

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const nc_sub = new URChannel('ursys-sub');
const nc_pub = new URChannel('ursys-pub');

/// LIBRARY INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initialize dependent libraries
 */
const Initialize = (initializers = []) => {
  console.groupCollapsed('** System: Initialize');
  // autoconnect to URSYS network during NET_CONNECT
  URExec.SystemHook(
    'NET_CONNECT',
    () =>
      new Promise((res, rej) =>
        URNet.Connect(nc_sub, { success: res, failure: rej })
      )
  );
  initializers.forEach(f => {
    if (typeof f === 'function') f();
  });
  console.groupEnd();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** deallocate any system resources assigned during Initialize
 */
const Shutdown = () => {
  //
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** connect to URSYS network
 */
const Connect = options => {
  return URNet.Connect(nc_sub, options);
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ...META,
  // MAIN API
  Initialize,
  Connect,
  Shutdown,
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
