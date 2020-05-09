/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS SERVER

  node:     database, express, logger, network, serve
  commmon:  datamap, messager, netmessage, valuebinding, datestring, session

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const COMMON_MODULES = require('./modules-common');
const URNet = require('./server-urnet');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_network_config;

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
/** Start the URNET socket server
 */
function StartServer(options) {
  m_network_config = URNet.StartNetwork(options);
  return m_network_config;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Retrieve URNET broker information
 *  useed in _document.getInitialProps to inject as props
 */
function GetBrokerInfo() {
  const { serverName, port, uaddr } = m_network_config;
  return { serverName, port, uaddr };
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // META
  ...META,
  // MAIN API
  StartServer,
  GetBrokerInfo,
  // SERVICES API
  URStore,
  URWeb,
  URLogger,
  URNet,
  URMedia,
  // CONVENIENCE
  ...COMMON_MODULES
};
