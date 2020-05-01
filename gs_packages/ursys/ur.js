/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS FEATURES STUB

  chrome:   events, exec, extensions, link, network, pubsub
  commmon:  datamap, messager, netmessage, valuebinding, datestring, session
  node:     database, express, logger, network, serve

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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

/// SERVER-SIDE ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URStore = {};
const URWeb = {};
const URLogger = {};
const URNet = {};
const URMedia = {};

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
  Init: () => {
    console.log(`URSYS INITIALIZING: v${VERSION}`);
  },
  Client: { Events, Exec, Extensions, Link, Network, PubSub },
  Server: { URStore, URWeb, URLogger, URNet, URMedia },
  Data: { Datamap, Messager, NetMessage, ValueBinding, DateString, Session }
};
