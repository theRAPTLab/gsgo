/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS SERVER

  node:     database, express, logger, network, serve
  commmon:  datamap, messager, netmessage, valuebinding, datestring, session

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const COMMON_MODULES = require('./modules-common');
const URNet = require('./server-urnet');

/// META DATA /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const META = {
  _SERVER: true,
  _SCRIPT: __filename,
  _VERSION: '0.0.1'
};

/// SERVER-SIDE ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URStore = {};
const URWeb = {};
const URLogger = {};
// const URNet = {};
const URMedia = {};

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** start the server
 *  StartServer({port,uaddr}) sets up the socket server options
 *  StartNetwork()
 */
function StartServer(options) {
  return URNet.StartNetwork(options);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // META
  ...META,
  // MAIN API
  StartServer,
  // SERVICES API
  URStore,
  URWeb,
  URLogger,
  URNet,
  URMedia,
  // CONVENIENCE
  ...COMMON_MODULES
};
