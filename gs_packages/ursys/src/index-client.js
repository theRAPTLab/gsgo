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
const Events = {};
const Exec = {};
const Extensions = {};
// const Link = {};
// const URNet = {};
const PubSub = {};

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const EP = new URLink('ursys-client');

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** connect to URSYS network
 *  TODO: need some way to automatically know what the server address is
 */
function Connect(options) {
  return URNet.Connect(EP, options);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ...META,
  // MAIN API
  Connect,
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
