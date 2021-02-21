/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  server datacore - a pure data module for server-side ursys operations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const IP = require('ip');
const $$ = require('./ur-common');

/// URNET DATA STRUCTURES /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SOCKETS = new Map();
const MESSAGE_DICT = new Map(); // message map by uaddr
const SVR_HANDLERS = new Map(); // message map storing sets of functions
const NET_HANDLERS = new Map(); // message map storing other handlers

/// URNET OPTIONS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let NETWORK_OPT;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** InitializeNetInfo is called from server-urnet as part of
 *  StartNetwork(), which receives the initial serverName, runtimePath
 *  and potentially overrides for host and port
 */
function InitializeNetInfo(o = {}) {
  o.host = IP.address();
  o.port = o.port || $$.CFG_URNET_PORT;
  o.uaddr = o.uaddr || $$.CFG_SVR_UADDR;
  o.urnet_version = $$.CFG_URNET_VERSION;
  NETWORK_OPT = o;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // URNET
  SOCKETS,
  MESSAGE_DICT,
  SVR_HANDLERS,
  NET_HANDLERS,
  // URNET OPTIONS
  InitializeNetInfo
};
