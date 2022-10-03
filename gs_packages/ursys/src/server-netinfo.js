/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Web Servive NetInfo Functions

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { URL } = require('url');
const requestIp = require('request-ip');
const { CFG_URNET_SERVICE, CFG_URDB_GQL } = require('./common/ur-constants');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_network_options;

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NetInfoRoute() {
  return CFG_URNET_SERVICE;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given req and response, return URNET connection information
 */
function m_NetInfoRespond(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  let { host, port, urnet_version, uaddr, branch } = m_network_options;
  let client_ip = requestIp.getClientIp(req);
  // prevent socket connection refusal due to mismatch of localhost
  // with use of numeric IP when connecting to server
  if (client_ip.includes('127.0.0.1')) client_ip = 'localhost';
  if (client_ip.includes('::1')) client_ip = 'localhost';
  // try to work around CORS request from localhost to non-localhost block by
  // chrome
  let dbhost = client_ip === 'localhost' ? 'localhost' : host;
  const netInfo = {
    broker: {
      host,
      port,
      urnet_version,
      uaddr
    },
    build: {
      branch
    },
    client: {
      ip: client_ip
    },
    urdb: {
      protocol: 'http',
      host: dbhost,
      endpoint: CFG_URDB_GQL
    }
  };
  res.end(JSON.stringify(netInfo));
}
/// CUSTOM SERVER INTEGRATION HELPERS /////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Called from a custom NextJS server (created with the
 *  http.createServer(requestListener) call to add our own listener)
 *  The listener listens for a request for URNetBroker information.
 *  the NextJS and other frameworks.
 */
function NextJS_Middleware(req, res) {
  // Be sure to pass `true` as the second argument to `url.parse`.
  // This tells it to parse the query portion of the URL.
  const baseUrl = `${req.protocol}://${req.headers.host}/`;
  const parsedUrl = new URL(req.url, baseUrl);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { pathname, query } = parsedUrl;
  // Do our route interception here
  if (pathname === CFG_URNET_SERVICE) {
    m_NetInfoRespond(req, res);
    return true;
  }
  return false;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Called from custom Express server, this sets up the URNetBroker link
 *  that returns host, port, urnet_version, uaddr
 */
function Express_Middleware(req, res, next) {
  const baseUrl = `${req.protocol}://${req.headers.host}/`;
  const parsedUrl = new URL(req.url, baseUrl);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { pathname, query } = parsedUrl;
  if (pathname === CFG_URNET_SERVICE) {
    m_NetInfoRespond(req, res);
  } else next();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetNetInfo() {
  let { host, port, urnet_version, uaddr, branch } = m_network_options;
  return { host, port, urnet_version, uaddr, branch };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called from index-server during URNET_Start to save network options */
function SaveNetInfo(opt) {
  m_network_options = opt;
  if (DBG) console.log('save netinfo', opt);
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  SaveNetInfo,
  NextJS_Middleware,
  Express_Middleware,
  GetNetInfo,
  NetInfoRoute
};
