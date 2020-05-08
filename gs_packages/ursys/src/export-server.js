/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS FEATURES STUB

  node:     database, express, logger, network, serve
  commmon:  datamap, messager, netmessage, valuebinding, datestring, session

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URNet = require('./server/urnet');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const VERSION = '1.0.0';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// SERVER-SIDE ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URStore = {};
const URWeb = {};
const URLogger = {};
// const URNet = {};
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
  _SERVER: true,
  Init: () => {
    console.log(`URSYS SERVER INITIALIZING: v${VERSION}`);
  },
  URStore,
  URWeb,
  URLogger,
  URNet,
  URMedia,
  Datamap,
  Messager,
  NetMessage,
  ValueBinding,
  DateString,
  Session
};
