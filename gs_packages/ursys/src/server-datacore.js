/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  server datacore - a pure data module for server-side ursys operations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const IP = require('ip');
const TERM = require('./util/prompts').makeTerminalOut(' DCORE');
const LOGGER = require('./server-logger');
const NetPacket = require('./class-netpacket');
const {
  PRE_SYS_MESG,
  CFG_URNET_PORT,
  CFG_SVR_UADDR,
  CFG_URNET_VERSION,
  PacketHash
} = require('./ur-common');
const DBG = require('./ur-dbg-settings');

/// URNET DATA STRUCTURES /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SOCKETS = new Map();
const MESSAGE_DICT = new Map(); // message map by uaddr
const SVR_HANDLERS = new Map(); // message map storing sets of functions
const NET_HANDLERS = new Map(); // message map storing other handlers
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let mu_uaddr_counter = 0; // for generating  unique socket ids
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
  if (DBG.reg) {
    if (MESSAGE_DICT.has(uaddr)) TERM(`${uaddr} message list UPDATING`);
    else TERM(`${uaddr} message list INITIALIZING`);
  }
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
  if (DBG.sock) TERM(`socket ADD ${socket.UADDR} to network`);
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
  if (DBG.sock) TERM(`socket DEL ${uaddr} from network`);
  const user = socket.USESS ? socket.USESS.token : '';
  LOGGER.Write(socket.UADDR, 'left network', user.toUpperCase());
  SOCKETS.delete(uaddr);
  // delete socket reference from previously registered handlers
  let rmesgs = GetMessageList(uaddr);
  if (Array.isArray(rmesgs)) {
    rmesgs.forEach(msg => {
      let handlers = NET_HANDLERS.get(msg);
      if (DBG.sock) TERM(`${uaddr} removed handler '${msg}'`);
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
  if (!DBG.sock) return;
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
function RemoteHandlerPromises(pkt, ident) {
  let origin = pkt.getSourceAddress();
  let mesgName = pkt.getMessage();
  if (mesgName === 'NET:GEM_TRACKERAPP')
    TERM('*** datacore: looking for NET:GEM_TRACKERAPP', pkt.getSourceAddress());
  let type = pkt.getType();
  let promises = [];

  // reserved service messages are only allowed to be implemented by the server
  if (!pkt.isServerOrigin() && mesgName.startsWith(PRE_SYS_MESG)) {
    TERM(`err  BAD REQUEST of SERVER SERVICE on REMOTE ${mesgName}`);
    return promises;
  }
  if (mesgName === 'NET:GEM_TRACKERAPP')
    TERM(
      '*** datacore: checking NET_HANDLERS',
      NET_HANDLERS.size,
      pkt.getSourceAddress()
    );
  // if the message doesn't have a handler, return empty list of promises
  if (!NET_HANDLERS.has(mesgName)) {
    // TERM(`err  '${mesgName}' is not registered`);
    if (mesgName === 'NET:GEM_TRACKERAPP')
      TERM(
        '*** datacore error: NET:GEM_TRACKERAPP not in NET_HANDLERS, size',
        NET_HANDLERS.size,
        pkt.getSourceAddress()
      );
    return promises;
  }

  let remotes = NET_HANDLERS.get(mesgName);

  if (mesgName === 'NET:GEM_TRACKERAPP') {
    if (remotes.size === 0)
      TERM(
        '*** datacore: found NET:GEM_TRACKERAPP handlers, but they are empty',
        pkt.getSourceAddress()
      );
    else
      TERM(
        '*** datacore: found NET:GEM_TRACKERAPP',
        NET_HANDLERS.size,
        pkt.getSourceAddress(),
        'remotes=',
        remotes.size
      );
  }

  const dontReflect = type !== 'msig';
  remotes.forEach(remote => {
    if (ident === undefined) ident = '';
    const remoteIsSender = origin === remote;
    if (remoteIsSender && dontReflect) {
      const hash = PacketHash(pkt);
      const msg = pkt.msg;
      const seq = pkt.seqlog.join('>');
      if (mesgName === 'NET:GEM_TRACKERAPP') {
        TERM(`${ident} skip packet ${hash} ${msg} to ${remote}`);
        TERM(`${ident} skip packet ${hash} ${seq}`);
        TERM(`${ident} ${JSON.stringify(pkt.data)}`);
      }
    } else {
      let r_sock = SocketLookup(remote);
      if (r_sock === undefined) throw Error(`${ERR_INVALID_DEST} ${remote}`);
      let newpkt = new NetPacket(pkt); // clone packet data to new packet
      newpkt.makeNewId(); // make new packet unique
      // newpkt.copySourceAddress(pkt); // clone original source address (leave it as SRV01)
      promises.push(newpkt.transactionStart(r_sock));
      const fwdHash = PacketHash(newpkt);
      const fwdMsg = newpkt.msg;
      const fwdSeq = newpkt.seqlog.join('>');
      if (mesgName === 'NET:GEM_TRACKERAPP') {
        TERM(`${ident} fwd  packet ${fwdHash} '${fwdMsg}' to ${remote}`);
        TERM(`${ident}      data ${JSON.stringify(pkt.data)}`);
        TERM(`${ident}      seqlog ${fwdSeq}`);
      }
    }
  });
  if (mesgName === 'NET:GEM_TRACKERAPP') {
    TERM(`*** datacore: returning ${promises.length} promises`);
  }
  return promises;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // DEBUG FLAGS
  DBG,
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
