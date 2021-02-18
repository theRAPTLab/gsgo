/* tslint:disable */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS SERVER MAIN ENTRY

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { parse } = require('url');
const requestIp = require('request-ip');
const NETWORK = require('./server-urnet');
const PROMPTS = require('./util/prompts');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_network_options;

/// META DATA /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** these properties are exported from the library so you can tell if the
 *  ur instance you're using is serverside or clientside, if that needs
 *  to be checked
 */
const META = {
  _SERVER: true,
  _SCRIPT: __filename,
  _VERSION: '0.0.1'
};
const URNET_PROP_ROUTE = '/urnet/getinfo';

/// SERVER-SIDE ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const STORE = {};
const EXPRESS = {};
const LOGGER = {};
// const NETWORK = {};
const MEDIA = {};

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given req and response, return URNET connection information
 */
function m_RespondWithURNetInfo(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  let { host, port, urnet_version, uaddr } = URNET_NetInfo();
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
}

/// LIBRARY INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initialize dependent libraries (vestige from PLAE)
 */
function Initialize(inits) {
  // hooks registration goes here
  if (typeof inits === 'function') inits = [inits];
  if (!Array.isArray(inits)) return;
  inits.forEach(f => f());
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** deallocate any system resources assigned during Initialize
 */
function Shutdown(closers) {
  // ot
  if (typeof closers === 'function') closers = [closers];
  if (!Array.isArray(closers)) return;
  closers.forEach(f => f());
}

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Start the URNET socket server
 */
function URNET_Start(options) {
  m_network_options = NETWORK.StartNetwork(options);
  return m_network_options;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Retrieve URNET broker information. The m_network_options object
 *  may contain non-broker information, so we return specific properties
 *  instead of the whole object.
 */
function URNET_NetInfo() {
  const { host, port, urnet_version, uaddr } = m_network_options;
  return { host, port, urnet_version, uaddr };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Called from a custom NextJS server (created with the
 *  http.createServer(requestListener) call to add our own listener)
 *  The listener listens for a request for URNetBroker information.
 *  the NextJS and other frameworks.
 */
function NextJS_NetInfoResponder(req, res) {
  // Be sure to pass `true` as the second argument to `url.parse`.
  // This tells it to parse the query portion of the URL.
  const parsedUrl = parse(req.url, true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { pathname, query } = parsedUrl;
  // Do our route interception here
  if (pathname === URNET_PROP_ROUTE) {
    m_RespondWithURNetInfo(req, res);
    return true;
  }
  return false;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Called from custom Express server, this sets up the URNetBroker link
 *  that returns host, port, urnet_version, uaddr
 */
function Express_NetInfoResponder(req, res, next) {
  const parsedUrl = parse(req.url, true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { pathname, query } = parsedUrl;
  if (pathname === URNET_PROP_ROUTE) {
    m_RespondWithURNetInfo(req, res);
  } else next();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // META
  ...META,
  // MAIN API
  Initialize,
  Shutdown,
  URNET_Start,
  URNET_NetInfo,
  NextJS_NetInfoResponder,
  Express_NetInfoResponder,
  // SERVICES API
  STORE,
  EXPRESS,
  LOGGER,
  NETWORK,
  MEDIA,
  // PROMPT UTILITIES
  PrefixUtil: PROMPTS.makeStyleFormatter,
  TermOut: PROMPTS.makeTerminalOut,
  SetPromptColor: PROMPTS.setPromptColor
};
