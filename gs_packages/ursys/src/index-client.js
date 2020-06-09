/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS C:OEMT

  chrome:   events, exec, extensions, link, network, pubsub
  commmon:  datamap, messager, netmessage, valuebinding, datestring, session

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NetChannel = require('./client-urchan');
const Net = require('./client-urnet');
const Exec = require('./client-exec');
const Prompts = require('./util/prompts');

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
const nc_sub = new NetChannel('ursys-sub');
const nc_pub = new NetChannel('ursys-pub');

/// LIBRARY INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initialize dependent libraries
 */
const Initialize = (initializers = []) => {
  console.groupCollapsed('** System: Initialize');
  // autoconnect to URSYS network during NET_CONNECT
  Exec.SystemHook(
    'NET_CONNECT',
    () =>
      new Promise((res, rej) =>
        Net.Connect(nc_sub, { success: res, failure: rej })
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
  return Net.Connect(nc_sub, options);
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
  SystemBoot: Exec.SystemBoot,
  SystemHook: Exec.SystemHook,
  SystemRun: Exec.SystemRun,
  SystemRestage: Exec.SystemRestage,
  SystemReboot: Exec.SystemReboot,
  SystemUnload: Exec.SystemUnload,
  // HELPER CLASSES
  class: {
    PhaseMachine
  },
  // CONVENIENCE Mpo
  util: { Prompts }
};
