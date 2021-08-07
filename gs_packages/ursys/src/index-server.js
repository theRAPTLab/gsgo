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
const FILES = require('./server-files');
const DBG = require('./ur-dbg-settings');
const COMMON = require('./ur-common');
const UTIL_FS = require('./util/fs-helper');
const UTIL_STRING = require('./util/string-helper');

//
const {
  IsBrowser,
  IsNode,
  IsElectron,
  IsElectronMain,
  IsElectronRenderer
} = COMMON;

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
  NetInfoRoute: NETINFO.NetInfoRoute,
  // Utilities
  UTIL: {
    string: UTIL_STRING,
    fs: UTIL_FS
  },
  // SYSTEM ENVIRONMENT
  IsNode,
  IsBrowser,
  IsElectron,
  IsElectronRenderer,
  IsElectronMain,
  // MAIN API
  Initialize,
  Shutdown,
  URNET_Start,
  URNET_NetInfo: NETINFO.GetNetInfo,
  UseLokiGQL_Middleware: DB.UseLokiGQL_Middleware,
  NetInfo_Middleware: NETINFO.Express_Middleware,
  URNET_Use: NETINFO.UseURNET,
  NextJS_NetinfoHook: NETINFO.NextJS_Middleware,
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
