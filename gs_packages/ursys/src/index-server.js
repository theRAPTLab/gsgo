/* tslint:disable */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS SERVER MAIN ENTRY

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NETWORK = require('./server-urnet');
const PROMPTS = require('./util/prompts');
const NETINFO = require('./server-netinfo');
const DB = require('./server-db');
const ASSETS = require('./server-assets');
const DBG = require('./common/debug-props');
const {
  IsBrowser,
  IsNode,
  IsElectron,
  IsElectronMain,
  IsElectronRenderer
} = require('./common/ur-detect');
const FILE = require('./util/files');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_netinfo;

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
  m_netinfo = NETWORK.StartNetwork(options);
  NETINFO.SaveNetInfo(m_netinfo);
  return m_netinfo;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // SHARED DEBUG FLAGS
  DBG,
  // META
  ...META,
  // UTILITIES API
  FILE,
  // INFORMATION
  NetInfoRoute: NETINFO.NetInfoRoute,
  URNET_NetInfo: NETINFO.GetNetInfo,
  IsNode,
  IsBrowser,
  IsElectron,
  IsElectronRenderer,
  IsElectronMain,
  // MAIN API
  Initialize,
  Shutdown,
  URNET_Start,
  // MIDDLEWARE
  UseLokiGQL_Middleware: DB.UseLokiGQL_Middleware,
  NetInfo_Middleware: NETINFO.Express_Middleware,
  URNET_Use: NETINFO.UseURNET,
  NextJS_NetinfoHook: NETINFO.NextJS_Middleware,
  AssetManifest_Middleware: ASSETS.AssetManifest_Middleware,
  MediaProxy_Middleware: ASSETS.MediaProxy_Middleware,
  // PROMPT UTILITIES
  PrefixUtil: PROMPTS.makeStyleFormatter,
  TermOut: PROMPTS.makeTerminalOut,
  SetPromptColor: PROMPTS.setPromptColor
};
