/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS SERVER

  node:     database, express, logger, network, serve
  commmon:  datamap, messager, netmessage, valuebinding, datestring, session

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { parse } = require('url');
const requestIp = require('request-ip');
const URNet = require('./server-urnet');
const Prompts = require('./util/debug-styles');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_network_options;

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
  m_network_options = URNet.StartNetwork(options);
  return m_network_options;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Retrieve URNET broker information. The m_network_options object
 *  may contain non-broker information, so we return specific properties
 *  instead of the whole object.
 */
function GetNetBroker() {
  const { host, port, urnet_version, uaddr } = m_network_options;
  return { host, port, urnet_version, uaddr };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Called from a custom server using http.createServer(requestListener).
 *  This listener is hardcoded with the urnet API, so it is independent of
 *  the NextJS and other frameworks.
 */
function HttpRequestListener(req, res) {
  // Be sure to pass `true` as the second argument to `url.parse`.
  // This tells it to parse the query portion of the URL.
  const parsedUrl = parse(req.url, true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { pathname, query } = parsedUrl;
  // Do our route interception here
  if (pathname === '/urnet/getinfo') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    let { host, port, urnet_version, uaddr } = GetNetBroker();
    let client_ip = requestIp.getClientIp(req);
    // prevent socket connection refusal due to mismatch of localhost
    // with use of numeric IP when connecting to server
    if (client_ip.includes('127.0.0.1')) client_ip = 'localhost';
    const netProps = {
      broker: {
        host,
        port,
        urnet_version,
        uaddr
      },
      client: {
        ip: client_ip
      }
    };
    res.end(JSON.stringify(netProps));
    return true;
  }
  return false;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // META
  ...META,
  // MAIN API
  StartServer,
  GetNetBroker,
  HttpRequestListener,
  // SERVICES API
  URStore,
  URWeb,
  URLogger,
  URNet,
  URMedia,
  // CONVENIENCE
  Prompts
};
