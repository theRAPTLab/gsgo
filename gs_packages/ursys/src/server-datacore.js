/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  server datacore - a pure data module for server-side ursys operations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const IP = require('ip');
const $$ = require('./ur-common');
const TERM = require('./util/prompts').makeTerminalOut(' DATAC');
const LOGGER = require('./server-logger');

/// URNET DATA STRUCTURES /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SOCKETS = new Map();
const MESSAGE_DICT = new Map(); // message map by uaddr
const SVR_HANDLERS = new Map(); // message map storing sets of functions
const NET_HANDLERS = new Map(); // message map storing other handlers

let mu_uaddr_counter = 0; // for generating  unique socket ids
const DBG_SOCK_BADCLOSE = 'closing socket is not in SOCKETS';
const DBG = false;

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

/// MESSAGE DICTIONARY FOR ALL UADDR /////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterMessageList(uaddr, messages) {
  MESSAGE_DICT.set(uaddr, messages);
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetMessageList(uaddr) {
  return MESSAGE_DICT.get(uaddr);
}

/// SOCKET SERVER SUPPORT INFRASTRUCTURE //////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Assigns a unique URSYS address (UADDR) to new sockets, storing it as the
//  * UADDR property of the socket and adding to SOCKETS map. The connection is
 * logged to the logfile.
 * @param {Object} socket connecting socket
 * @param {Object} req raw request
 */
function SocketAdd(socket, req) {
  // save socket by socket_id
  let uaddr = GetNewUADDR();
  // store ursys address
  socket.UADDR = uaddr;
  // set ULOCAL flag if socket is local because this is privilleged
  const remoteIp = req && req.connection ? req.connection.remoteAddress : '';
  socket.ULOCAL = remoteIp === '127.0.0.1' || remoteIp === '::1';
  // save socket
  SOCKETS.set(uaddr, socket);
  TERM(`socket ADD ${socket.UADDR} to network`);
  LOGGER.Write(socket.UADDR, 'joined network');
  log_ListSockets(`add ${uaddr}`);
  return uaddr;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Utility to generate a new UADDR id for connecting clients
 * @param {string} [prefix] - default to UADDR
 */
function GetNewUADDR(prefix = 'UADDR') {
  ++mu_uaddr_counter;
  let cstr = mu_uaddr_counter.toString(10).padStart(2, '0');
  return `${prefix}_${cstr}`;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Utility to handle disconnected sockets. It does the internal housekeeping
 * and logging, and removes any registered messages that the socket may have
 * had.
 */
function SocketDelete(socket) {
  let uaddr = socket.UADDR;
  if (!SOCKETS.has(uaddr)) throw Error(DBG_SOCK_BADCLOSE);
  if (DBG) TERM(`socket DEL ${uaddr} from network`);
  const user = socket.USESS ? socket.USESS.token : '';
  LOGGER.Write(socket.UADDR, 'left network', user.toUpperCase());
  SOCKETS.delete(uaddr);
  // delete socket reference from previously registered handlers
  let rmesgs = GetMessageList(uaddr);
  if (Array.isArray(rmesgs)) {
    rmesgs.forEach(msg => {
      let handlers = NET_HANDLERS.get(msg);
      if (DBG) TERM(`${uaddr} removed handler '${msg}'`);
      if (handlers) handlers.delete(uaddr);
    });
  }
  log_ListSockets(`del ${socket.UADDR}`);
  return uaddr;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns the socket associated with a uaddr. The UADDR
 * can be accessed from a NetPacket packet's SourceAddress().
 */
function SocketLookup(uaddr) {
  return SOCKETS.get(uaddr);
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetSocketCount() {
  return SOCKETS.size;
}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** helper debug output used by SocketAdd(), SocketDelete() */
function log_ListSockets(change) {
  TERM(`socketlist changed: '${change}'`);
  // let's use iterators! for..of
  let values = [...SOCKETS.values()];
  let count = 1;
  values.forEach(socket => TERM(`  ${count++} = ${socket.UADDR}`));
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
  InitializeNetInfo,
  // SOCKETS
  SocketAdd,
  SocketDelete,
  SocketLookup,
  GetSocketCount,
  // UADDR MESSAGE LIST
  RegisterMessageList,
  GetMessageList
};
