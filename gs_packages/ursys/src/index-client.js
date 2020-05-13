/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS C:OEMT

  chrome:   events, exec, extensions, link, network, pubsub
  commmon:  datamap, messager, netmessage, valuebinding, datestring, session

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const COMMON_MODULES = require('./modules-common');
const URLink = require('./client-urlink');
const URNet = require('./client-urnet');

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
const URLINK_SUB = new URLink('ursys-sub');
const URLINK_PUB = new URLink('ursys-pub');

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** connect to URSYS network
 */
const Connect = options => {
  return URNet.Connect(URLINK_SUB, options);
};
/** forward URLINK_SUB methods
 *
 */
const { Subscribe, Unsubscribe } = URLINK_SUB;
const { LocalSignal, LocalPublish, LocalCall } = URLINK_PUB;

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
  URLink,
  URNet,
  PubSub,
  // CONVENIENCE
  ...COMMON_MODULES
};
