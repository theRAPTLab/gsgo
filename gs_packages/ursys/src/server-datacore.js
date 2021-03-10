/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  server datacore - a pure data module for server-side ursys operations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const IP = require('ip');
const TERM = require('./util/prompts').makeTerminalOut(' DATAC');
const LOGGER = require('./server-logger');
const NetPacket = require('./class-netpacket');
const {
  PRE_SYS_MESG,
  CFG_URNET_PORT,
  CFG_SVR_UADDR,
  CFG_URNET_VERSION
} = require('./ur-common');

/// URNET DATA STRUCTURES /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SOCKETS = new Map();
const MESSAGE_DICT = new Map(); // message map by uaddr
const SVR_HANDLERS = new Map(); // message map storing sets of functions
const NET_HANDLERS = new Map(); // message map storing other handlers
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let mu_uaddr_counter = 0; // for generating  unique socket ids
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// URNET OPTIONS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let NETWORK_OPTIONS;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** InitializeNetInfo is called from server-urnet as part of
 *  StartNetwork(), which receives the initial serverName, runtimePath
 *  and potentially overrides for host and port
 */
function InitializeNetInfo(o = {}) {
  o.host = IP.address();
  o.port = o.port || CFG_URNET_PORT;
  o.uaddr = o.uaddr || CFG_SVR_UADDR;
  o.urnet_version = CFG_URNET_VERSION;
  NETWORK_OPTIONS = o;
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
const DBG_SOCK_BADCLOSE = 'closing socket is not in SOCKETS';
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

/// PROMISE HANDLERS FOR SERVER-URNET-CLIENT USES /////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ERR_INVALID_DEST = "couldn't find socket with provided address";
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** KEY HELPER that returns an array of Promises that call the functions
 * associated with a SERVER-based message handler. Handler functions must return
 * a data object. Unlike the remote version of this function, this executes
 * synchronously because there is no network communication required.
 * @param {NetPacket} pkt a NetPacket object to use as message key
 * @returns {Array<Promise>} promises objects to use with await
 */
function ServerHandlerPromises(pkt) {
  let mesgName = pkt.getMessage();
  const handlers = SVR_HANDLERS.get(mesgName);
  /// create promises for all registered handlers in the set
  let promises = [];
  if (!handlers) return promises;
  handlers.forEach(hFunc => {
    let p = new Promise((resolve, reject) => {
      let retval = hFunc(pkt);
      if (retval === undefined)
        throw Error(
          `'${mesgName}' message handler MUST return object or error string`
        );
      if (typeof retval !== 'object') reject(retval);
      else resolve(retval);
    });
    promises.push(p);
  }); // handlers forEach
  return promises;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** KEY HELPER for handling "forwarded calls" to remote URSYS devices on behalf
 * of an incoming call that isn't implemented on the server. It works by cloning
 * the original NetPacket packet and sending it to removes via
 * NetPacket.PromiseTransaction(), returning an array of promises that resolve
 * when NetPacket.CompleteTransaction() is invoked on the returned data. Use
 * await Promise.all(promises) to wait.
 * @param {NetPacket} pkt a NetPacket object to use as message key
 * @returns {Array<Promise>} promises objects to use with Promise.all()
 */
function RemoteHandlerPromises(pkt) {
  // debugging values
  let origin = pkt.getSourceAddress();
  // logic values
  let mesgName = pkt.getMessage();
  let type = pkt.getType();
  const dontReflect = type === 'msend' || type === 'mcall';

  // generate the list of promises
  let promises = [];
  // disallow reserved system message handlers from remotes
  if (!pkt.isServerOrigin() && mesgName.startsWith(PRE_SYS_MESG)) return promises;
  // check for remote handlers
  let remotes = NET_HANDLERS.get(mesgName);
  if (!remotes) return promises;

  // if there are handlers to handle, create a NetPacket
  // clone of this packet and forward it and save the promise
  let count = 0;
  remotes.forEach(remote => {
    count++;
    const isOrigin = origin === remote;
    // we want to do this only when
    if (isOrigin && dontReflect) {
      if (DBG.calls) TERM(`  ${count}: ${origin} to ${remote} X`);
    } else {
      if (DBG.calls) TERM(`  ${count}: ${origin} to ${remote} SEND/CALL BEGIN`);
      let r_sock = SocketLookup(remote);
      if (r_sock === undefined) throw Error(`${ERR_INVALID_DEST} ${remote}`);
      let newpkt = new NetPacket(pkt); // clone packet data to new packet
      newpkt.makeNewId(); // make new packet unique
      newpkt.copySourceAddress(pkt); // clone original source address
      promises.push(newpkt.transactionStart(r_sock));
    }
  }); // handlers.forEach
  return promises;
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
  NETWORK_OPTIONS,
  // SOCKETS
  SocketAdd,
  SocketDelete,
  SocketLookup,
  GetSocketCount,
  // UADDR MESSAGE LIST
  RegisterMessageList,
  GetMessageList,
  // SERVER-SIDE URNET CLIENT
  ServerHandlerPromises,
  RemoteHandlerPromises
};
