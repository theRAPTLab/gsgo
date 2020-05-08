/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS FEATURES STUB

  chrome:   events, exec, extensions, link, network, pubsub
  commmon:  datamap, messager, netmessage, valuebinding, datestring, session
  node:     database, express, logger, network, serve

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// const URNet = require('./server/urnet');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const VERSION = '1.0.0';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLIENT-SIDE ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Events = {};
const Exec = {};
const Extensions = {};
const Link = {};
const Network = {};
const PubSub = {};

/// COMMON ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Datamap = {};
const Messager = {};
const NetMessage = {};
const ValueBinding = {};
const DateString = {};
const Session = {};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  _VERSION: VERSION,
  _CLIENT: true,
  Init: () => {
    console.log(`URSYS CLIENT INITIALIZING: v${VERSION}`);
  },
  Events,
  Exec,
  Extensions,
  Link,
  Network,
  PubSub,
  Datamap,
  Messager,
  NetMessage,
  ValueBinding,
  DateString,
  Session
};
