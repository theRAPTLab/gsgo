/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS C:OEMT

  chrome:   events, exec, extensions, link, network, pubsub
  commmon:  datamap, messager, netmessage, valuebinding, datestring, session

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URChan = require('./client-urchan');
const URNet = require('./client-urnet');
const URExec = require('./client-exec');
const Prompts = require('./util/prompts');

/// META-DATA /////////////////////////////////////////////////////////////////
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
const Exec = {};
const Extensions = {};
const PubSub = {};

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URCHAN_SUB = new URChan('ursys-sub');
const URCHAN_PUB = new URChan('ursys-pub');

/// LIBRARY INITIALIZATION ////////////////////////////////////////////////////
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
        URNet.Connect(URCHAN_SUB, { success: res, failure: rej })
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

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** connect to URSYS network
 */
const Connect = options => {
  return URNet.Connect(URCHAN_SUB, options);
};
/** forward URCHAN methods
 */
const { Subscribe, Unsubscribe } = URCHAN_SUB;
const { LocalSignal, LocalPublish, LocalCall } = URCHAN_PUB;
/** forward UREXEC methods
 */
const {
  SystemBoot,
  SystemHook,
  SystemRun,
  SystemRestage,
  SystemReboot,
  SystemUnload
} = URExec;

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ...META,
  // MAIN API
  Initialize,
  Shutdown,
  Connect,
  Subscribe,
  Unsubscribe,
  Publish: LocalPublish,
  Signal: LocalSignal,
  Call: LocalCall,
  // SERVICES API
  Events,
  Exec,
  Extensions,
  URChan,
  URNet,
  PubSub,
  // EXEC API
  SystemBoot,
  SystemHook,
  SystemRun,
  SystemRestage,
  SystemReboot,
  SystemUnload,
  // CONVENIENCE
  Prompts
};
