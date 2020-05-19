/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS C:OEMT

  chrome:   events, exec, extensions, link, network, pubsub
  commmon:  datamap, messager, netmessage, valuebinding, datestring, session

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const COMMON_MODULES = require('./modules-common');
const URChan = require('./client-urchan');
const URNet = require('./client-urnet');
const URExec = require('./client-exec');

/// META-DATA /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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

/// HOOKED OPERATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** autoconnect to URSYS network during NET_CONNECT
 */
URExec.SystemHook(
  'NET_CONNECT',
  () =>
    new Promise((res, rej) =>
      URNet.Connect(URCHAN_SUB, { success: res, failure: rej })
    )
);

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
const { SystemBoot, SystemUnload, SystemHook, SystemReboot } = URExec;

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ...META,
  // MAIN API
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
  SystemUnload,
  SystemHook,
  SystemReboot,
  // CONVENIENCE
  ...COMMON_MODULES
};
