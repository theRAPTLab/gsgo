/* tslint:disable */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS SERVER MAIN ENTRY

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NETWORK = require('./server-urnet');
const PROMPTS = require('./util/prompts');
const NETINFO = require('./server-netinfo');

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

/// SERVER-SIDE ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const STORE = {};
const EXPRESS = {};
const LOGGER = {};
// const NETWORK = {};
const MEDIA = {};

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
  NETINFO.SaveNetworkOptions(m_network_options);
  return m_network_options;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // META
  ...META,
  NetInfoRoute: NETINFO.Route,
  // MAIN API
  Initialize,
  Shutdown,
  URNET_Start,
  URNET_NetInfo: NETINFO.GetNetInfo,
  NextJS_NetInfoResponder: NETINFO.NextJS_Responder,
  Express_NetInfoResponder: NETINFO.Express_Responder,
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
