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
const URLINK_SUB = new URChan('ursys-sub');
const URLINK_PUB = new URChan('ursys-pub');

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** connect to URSYS network
 */
const Connect = options => {
  return URNet.Connect(URLINK_SUB, options);
};
/** forward URCHAN methods
 */
const { Subscribe, Unsubscribe } = URLINK_SUB;
const { LocalSignal, LocalPublish, LocalCall } = URLINK_PUB;
/** forward UREXEC methods
 */
const { SubscribeHook, Execute, ExecuteGroup } = URExec;

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
  SubscribeHook,
  Execute,
  ExecuteGroup,
  // CONVENIENCE
  ...COMMON_MODULES
};
