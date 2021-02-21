/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WebSocketServer and Network Management for URSYS

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const WSS = require('ws').Server;
const NetPacket = require('./class-netpacket');
const LOGGER = require('./server-logger');
const SESSION = require('./util/session-keys');
const TERM = require('./util/prompts').makeTerminalOut(' URNET');
const { CFG_SVR_UADDR, PRE_SYS_MESG } = require('./ur-common');
const {
  SOCKETS,
  MESSAGE_DICT,
  SVR_HANDLERS,
  NET_HANDLERS,
  InitializeNetInfo
} = require('./server-datacore');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = { init: true, calls: false, client: true };

const ERR_SS_EXISTS = 'socket server already created';
const DBG_SOCK_BADCLOSE = 'closing socket is not in SOCKETS';
const ERR_INVALID_DEST = "couldn't find socket with provided address";

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// sockets
let mu_wss; // websocket server
let mu_sid_counter = 0; // for generating  unique socket ids
// module object
let URNET = {};

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Initializes the web socket server using the options passed-in
 *  @param {Object} [options] - configuration settings
 *  @param {number} [options.port] - default in ur-config
 *  @param {string} [options.uaddr] - default in ur-config
 *  @returns {Object} complete configuration object
 */
URNET.StartNetwork = (options = {}) => {
  if (!options.runtimePath) {
    return Error('runtimePath required to start URSYS SERVER');
  }
  // host port uaddr urnet_version
  InitializeNetInfo(options);
  if (mu_wss !== undefined) throw Error(ERR_SS_EXISTS);

  LOGGER.StartLogging(options);
  NetPacket.GlobalSetup({ uaddr: options.uaddr });
  //
  m_InitializeServiceHandlers();
  m_StartSocketServer(options);
  //
  return options;
}; // end StartNetwork()

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Revokes a handler function from a registered message. The handler function
 * object must be the same one used to register it.
 * @param {string} mesgName message to unregister a handler for
 * @param {function} handlerFunc function originally registered
 */
URNET.NetUnsubscribe = (mesgName, handlerFunc) => {
  if (mesgName === undefined) {
    SVR_HANDLERS.clear();
  } else if (handlerFunc === undefined) {
    SVR_HANDLERS.delete(mesgName);
  } else {
    const handlers = SVR_HANDLERS.get(mesgName);
    if (handlers) {
      handlers.delete(handlerFunc);
    }
  }
  return this;
}; // end NetUnsubscribe()

/// SERVER-SIDE URNET MESSAGING API ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Registers SERVER-side message handlers that are reachable from remote
 * clients. Server-side handlers use their own map.
 * @param {string} mesgName message to register a handler for
 * @param {function} handlerFunc function receiving 'data' object
 */
URNET.RegisterService = (mesgName, handlerFunc) => {
  if (typeof handlerFunc !== 'function') {
    TERM(`${mesgName} subscription failure`);
    throw Error('arg2 must be a function');
  }
  let handlers = SVR_HANDLERS.get(mesgName);
  if (!handlers) {
    handlers = new Set();
    SVR_HANDLERS.set(mesgName, handlers);
  }
  handlers.add(handlerFunc);
}; // end RegisterService()/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Server-side local server publishing. It executes synchronously, unlike the
 *  remote version. Doesn't return values.
 */
URNET.NotifyService = (mesgName, data) => {
  const handlers = SVR_HANDLERS.get(mesgName);
  if (!handlers) return;
  const results = [];
  handlers.forEach(hFunc => {
    results.push(hFunc(data));
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Server-side method for invoking a remote message. It executes asynchronously
 * but uses async/await so it can be used in a synchronous style to retrieve
 * values.
 * @param {string} mesgName message to unregister a handler for
 * @param {function} handlerFunc function originally registered
 * @return {Array<Object>} array of returned data items
 */
URNET.NetCall = async (mesgName, data) => {
  let pkt = new NetPacket(mesgName, data);
  let promises = m_PromiseRemoteHandlers(pkt);
  if (DBG.call)
    TERM(
      `${pkt.getInfo()} NETCALL ${pkt.getMessage()} to ${promises.length} remotes`
    );
  /// MAGICAL ASYNC/AWAIT BLOCK ///////
  const results = await Promise.all(promises);
  /// END MAGICAL ASYNC/AWAIT BLOCK ///
  // const result = Object.assign({}, ...resArray);
  return results; // array of data objects
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Server-side method for sending a remote message. It fires the messages but
 * doesn't do anything with the returned promises. Use for notifying remote
 * message handlers.
 * @param {string} mesgName message to unregister a handler for
 * @param {function} handlerFunc function originally registered
 */
URNET.NetPublish = (mesgName, data) => {
  let pkt = new NetPacket(mesgName, data);
  let promises = m_PromiseRemoteHandlers(pkt);
  // we don't care about waiting for the promise to complete
  if (DBG.call)
    TERM(
      `${pkt.getInfo()} NETSEND ${pkt.getMessage()} to ${promises.length} remotes`
    );
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Alias for NetPublish(), kept for conceptual symmetry to the client-side URSYS
 * interface. It is not needed because the server never mirrors NetPublish to
 * itself for signaling purposes.
 * @param {string} mesgName message to unregister a handler for
 * @param {function} handlerFunc function originally registered
 */
URNET.NetSignal = (mesgName, data) => {
  URNET.NetPublish(mesgName, data);
};

/// NETWORK STATE HELPERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return list of registered server handlers
 */
URNET.ServiceList = () => {
  const serviceList = [...SVR_HANDLERS.keys()];
  return serviceList;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return list of clients and registered handlers
 */
URNET.ClientList = () => {
  const handlerList = [...NET_HANDLERS.entries()];
  const clientsByMessage = {};
  handlerList.forEach(entry => {
    const [msg, set] = entry;
    const remotes = [...set.keys()];
    clientsByMessage[msg] = remotes;
  });
  return clientsByMessage;
};

/// END OF URNET PUBLIC API ////////////////////////////////////////////////////

/// MODULE HELPER FUNCTIONS ///////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_InitializeServiceHandlers() {
  LOGGER.Write('registering network services');
  // start logging message
  URNET.RegisterService('NET:SRV_LOG_EVENT', LOGGER.PKT_LogEvent);
  // register remote messages
  URNET.RegisterService('NET:SRV_REG_HANDLERS', PKT_RegisterRemoteHandlers);
  // register sessions
  URNET.RegisterService('NET:SRV_SESSION_LOGIN', PKT_SessionLogin);
  URNET.RegisterService('NET:SRV_SESSION_LOGOUT', PKT_SessionLogout);
  URNET.RegisterService('NET:SRV_SESSION', PKT_Session);
  // ursys debug server utilities
  URNET.RegisterService('NET:SRV_REFLECT', pkt => {
    const data = pkt.Data();
    data.serverSays = 'REFLECTING';
    data.stack = data.stack || [];
    data.stack.push(CFG_SVR_UADDR); // usually hardcoded to SVR_01
    TERM.warn('SRV_REFLECT setting data', data);
    return data;
  });
  URNET.RegisterService('NET:SRV_SERVICE_LIST', pkt => {
    TERM.warn('SRV_SERVICE_LIST got', pkt);
    const server = [...SVR_HANDLERS.keys()];
    const handlers = [...NET_HANDLERS.entries()];
    const clients = {};
    handlers.forEach(entry => {
      const [msg, set] = entry;
      const remotes = [...set.keys()];
      clients[msg] = remotes;
    });
    return { server, clients };
  });
}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Assigns a unique URSYS address (UADDR) to new sockets, storing it as the
//  * UADDR property of the socket and adding to SOCKETS map. The connection is
 * logged to the logfile.
 * @param {Object} socket connecting socket
 * @param {Object} req raw request
 */
function m_SocketAdd(socket, req) {
  // save socket by socket_id
  let sid = m_GetNewUADDR();
  // store ursys address
  socket.UADDR = sid;
  // set ULOCAL flag if socket is local because this is privilleged
  const remoteIp = req && req.connection ? req.connection.remoteAddress : '';
  socket.ULOCAL = remoteIp === '127.0.0.1' || remoteIp === '::1';
  // save socket
  SOCKETS.set(sid, socket);
  if (DBG.init) TERM(`socket ADD ${socket.UADDR} to network`);
  LOGGER.Write(socket.UADDR, 'joined network');
  if (DBG.init) log_ListSockets(`add ${sid}`);
} // end m_SocketAdd()

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Utility to generate a new UADDR id for connecting clients
 * @param {string} [prefix] - default to UADDR
 */
function m_GetNewUADDR(prefix = 'UADDR') {
  ++mu_sid_counter;
  let cstr = mu_sid_counter.toString(10).padStart(2, '0');
  return `${prefix}_${cstr}`;
}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_StartSocketServer(options) {
  // create listener.
  try {
    mu_wss = new WSS(options);
    mu_wss.on('listening', () => {
      if (DBG.init) TERM(`socket server listening on port ${options.port}`);
      mu_wss.on('connection', (socket, req) => {
        // if (DBG) TERM('socket connected');
        // house keeping
        m_SocketAdd(socket, req); // assign UADDR to socket
        m_SocketClientAck(socket); // tell client HELLO with new UADDR
        // subscribe socket to handlers
        socket.on('message', json => m_SocketOnMessage(socket, json));
        socket.on('close', () => m_SocketDelete(socket));
      }); // end on 'connection'
    });
  } catch (e) {
    TERM(`FATAL ERROR: ${e.toString}`);
    TERM('Another URSYS server already running on this machine, so exiting');
    process.exit(1);
  }
}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns a JSON packet to the just-connected client with its assigned URSYS
 * address (UADDR) and the server's UADDR.
 * @param {Object} socket connecting socket
 */
function m_SocketClientAck(socket) {
  let PEERS = { count: SOCKETS.size };
  let data = {
    HELLO: `Welcome to URSYS, ${socket.UADDR}`,
    UADDR: socket.UADDR,
    CFG_SVR_UADDR,
    PEERS,
    ULOCAL: socket.ULOCAL
  };
  socket.send(JSON.stringify(data));
} // end m_SocketClientAck()

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Main entry point for handling 'message' events from a client socket. It
 * converts the incoming JSON to a NetPacket packet and passes processing
 * further on depending on the type.
 * @param {Object} socket messaging socket
 * @param {string} json text-encoded NetPacket
 */
function m_SocketOnMessage(socket, json) {
  let pkt = new NetPacket(json);
  // figure out what to do
  switch (pkt.getType()) {
    case 'msig':
    case 'msend':
    case 'mcall':
      m_HandleMessage(socket, pkt);
      break;
    case 'state':
      // m_HandleState(socket, pkt);
      break;
    default:
      throw new Error(`${TERM} unknown packet type '${pkt.getType()}'`);
  } // end switch
} // end m_SocketOnMessage()

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Utility to handle disconnected sockets. It does the internal housekeeping
 * and logging, and removes any registered messages that the socket may have
 * had.
 */
function m_SocketDelete(socket) {
  let uaddr = socket.UADDR;
  if (!SOCKETS.has(uaddr)) throw Error(DBG_SOCK_BADCLOSE);
  if (DBG) TERM(`socket DEL ${uaddr} from network`);
  const user = socket.USESS ? socket.USESS.token : '';
  LOGGER.Write(socket.UADDR, 'left network', user.toUpperCase());
  SOCKETS.delete(uaddr);
  // delete socket reference from previously registered handlers
  let rmesgs = MESSAGE_DICT.get(uaddr);
  if (Array.isArray(rmesgs)) {
    rmesgs.forEach(msg => {
      let handlers = NET_HANDLERS.get(msg);
      if (DBG) TERM(`${uaddr} removed handler '${msg}'`);
      if (handlers) handlers.delete(uaddr);
    });
  }
  if (DBG.init) log_ListSockets(`del ${socket.UADDR}`);
  // tell subscribers socket is gone
  URNET.NotifyService('SRV_SOCKET_DELETED', { uaddr });
} // end m_SocketDelete()

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns the socket associated with a uaddr. The UADDR
 * can be accessed from a NetPacket packet's SourceAddress().
 */
function m_SocketLookup(uaddr) {
  return SOCKETS.get(uaddr);
}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** MAIN HANDLER that performs the actual work of dispatching messages on behalf
 * of a client to other remote clients, gathers up all the data, and returns
 * it. There are THREE CASES:
 * 1. The incoming message is returning from a remote caller to remote sender
 * 2. The incoming message is intended for the server
 * 3. the incoming message is from a remote reaching another remote
 * @param {Object} socket messaging socket
 * @param {NetPacket} pkt - NetPacket packet instance
 */
async function m_HandleMessage(socket, pkt) {
  // (1) Is the incoming message a response to a message that the server sent?
  // It might have been a duplicate packet ('forwarded') or one the server itself sent.
  // In either case, the packet will invoke whatever function handler is associated with
  // it and complete the transaction function. Note that dispatched messages comprise
  // of the original packet and the forwarded duplicate packet(s) that the server
  // recombines and returns to the original packet sender
  if (pkt.isResponse()) {
    if (DBG.calls)
      TERM(
        `-- ${pkt.getMessage()} completing transaction ${pkt.seqlog.join(':')}`
      );
    pkt.transactionComplete();
    return;
  }
  // (2) If we got this far, it's a new message.
  // Does the server implement any of the messages? Let's add that to our
  // list of promises. It will return empty array if there are none.
  let promises = m_PromiseServerHandlers(pkt);

  // (3) If the server doesn't implement any promises, check if there are
  // any remotes that have registered one.
  if (promises.length === 0) promises = m_PromiseRemoteHandlers(pkt);

  // (3a) If there were NO HANDLERS defined for the incoming message, then
  // this is an error. If the message is a CALL, then report an error back to
  // the originator; other message types don't expect a return value.
  if (promises.length === 0) {
    const out = `${pkt.getSourceAddress()} can't find '${pkt.getMessage()}'`;
    const info = 'Using Publish/Call? They can not target themselves.';
    if (DBG.calls) TERM.warn(out, info);
    // return transaction to resolve callee
    pkt.setData({
      code: NetPacket.CODE_NO_MESSAGE,
      error: out,
      info
    });
    if (pkt.isType('mcall')) pkt.transactionReturn(socket);
    return;
  }

  // (3b) We have at least one promise for remote handlers.
  // It will either be server calls or remote calls. The server
  // always takes precedence over remote calls so clients can't
  // subscribe to critical system messages intended only for
  // the server!

  // Print some debugging messages
  const DBG_NOSRV = !pkt.isServerMessage();
  if (DBG.calls) log_PktDirection(pkt, 'call', promises);
  if (DBG.calls && DBG_NOSRV) log_PktTransaction(pkt, 'queuing', promises);

  /* (3c) MAGICAL ASYNC/AWAIT BLOCK ****************************/
  /* pktArray will contain data objects from each resolved */
  /* promise */
  let pktArray = await Promise.all(promises).catch(err => {
    TERM('ERROR IN PROMISE', err);
  });
  /* END MAGICAL ASYNC/AWAIT BLOCK *****************************/

  // (3d) Print some more debugging messages after async
  if (DBG.calls) {
    if (DBG_NOSRV) log_PktTransaction(pkt, 'resolved');
    log_PktDirection(pkt, 'rtrn', promises);
  }

  // (3e) If the call type doesn't expect return data, we are done!
  if (!pkt.isType('mcall')) return;

  // (3f) If the call type is 'mcall', and we need to return the original
  // message packet to the original caller. First merge the data into
  // one data object...
  let data = pktArray.reduce((d, p) => {
    let pdata = p instanceof NetPacket ? p.getData() : p;
    let retval = Object.assign(d, pdata);
    if (DBG_NOSRV) TERM(`'${pkt.getMessage()}' reduce`, JSON.stringify(retval));
    return retval;
  }, {});

  // (3g) ...then return the combined data using NetPacket.ReturnTransaction()
  // on the caller's socket, which we have retained through the magic of closures!
  const dbgData = JSON.stringify(data);
  pkt.setData(data);
  if (DBG_NOSRV)
    TERM(`'${pkt.getMessage()}' returning transaction data ${dbgData}`);
  pkt.transactionReturn(socket);
} // end m_HandleMessage()

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** MAIN HANDLER (currently stub) for network-synched state messages, which
 * are not yet implemented in URSYS
 * @param {Object} socket messaging socket
 * @param {NetPacket} pkt a NetPacket object received from socket
 */
/// function m_HandleState(socket, pkt) {}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** KEY HELPER that returns an array of Promises that call the functions
 * associated with a SERVER-based message handler. Handler functions must return
 * a data object. Unlike the remote version of this function, this executes
 * synchronously because there is no network communication required.
 * @param {NetPacket} pkt a NetPacket object to use as message key
 * @returns {Array<Promise>} promises objects to use with await
 */
function m_PromiseServerHandlers(pkt) {
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
} // end m_PromiseServerHandlers()

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
function m_PromiseRemoteHandlers(pkt) {
  // debugging values
  let s_uaddr = pkt.getSourceAddress();
  // logic values
  let mesgName = pkt.getMessage();
  let type = pkt.getType();
  const publishOnly = type === 'msend' || type === 'mcall';

  // generate the list of promises
  let promises = [];
  // disallow NET:SYSTEM published messages from remote clients
  if (!pkt.isServerOrigin() && mesgName.startsWith(PRE_SYS_MESG)) return promises;
  // check for handlers
  let handlers = NET_HANDLERS.get(mesgName);
  if (!handlers) return promises;

  // if there are handlers to handle, create a NetPacket
  // clone of this packet and forward it and save the promise
  handlers.forEach(d_uaddr => {
    const isOrigin = s_uaddr === d_uaddr;
    // we want to do this only when
    if (publishOnly && isOrigin) {
      if (DBG.calls) TERM(`skipping msend|mcall from ${s_uaddr} to ${d_uaddr}`);
    } else {
      let d_sock = SOCKETS.get(d_uaddr);
      if (d_sock === undefined) throw Error(`${ERR_INVALID_DEST} ${d_uaddr}`);
      let newpkt = new NetPacket(pkt); // clone packet data to new packet
      newpkt.makeNewId(); // make new packet unique
      newpkt.copySourceAddress(pkt); // clone original source address
      promises.push(newpkt.transactionStart(d_sock));
    }
  }); // handlers.forEach
  return promises;
}

/// SERVER MESSAGE HANDLERS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Handles URSYS REGISTRATION PACKETS from connecting clients. It is the first
 * packet sent on successful socket connection.
 * @param {NetPacket} pkt - NetPacket packet instance
 * @return {Object} object with registered property containing array of message
 */
function PKT_RegisterRemoteHandlers(pkt) {
  if (pkt.getMessage() !== 'NET:SRV_REG_HANDLERS')
    throw Error('not a registration packet');
  let uaddr = pkt.getSourceAddress();
  let { messages = [] } = pkt.getData();
  // make sure there's no sneaky attempt to subvert the system messages
  const filtered = messages.filter(msg => !msg.startsWith('NET:SRV'));
  if (filtered.length !== messages.length) {
    const error = `${uaddr} blocked from registering SRV message`;
    TERM(error);
    return { error, code: NetPacket.CODE_REG_DENIED };
  }
  let regd = [];
  // save message list, for later when having to delete
  MESSAGE_DICT.set(uaddr, messages);
  // add uaddr for each message in the list
  // NET_HANDLERS[mesg] contains a Set
  messages.forEach(msg => {
    let entry = NET_HANDLERS.get(msg);
    if (!entry) {
      entry = new Set();
      NET_HANDLERS.set(msg, entry);
    }
    if (DBG.client) TERM(`${uaddr} regr '${msg}'`);
    entry.add(uaddr);
    regd.push(msg);
  });
  return { registered: regd };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Handle SESSION LOGIN packets. A key is generated based on the provided
 * user token and socket address, and stored in the client socket. This should
 * ensure that keys can not be reused by other socket connections or multiple
 * logins using the same token.
 *
 * @param {NetPacket} pkt - NetPacket packet instance
 * @param {Object} pkt.data - data payload
 * @param {String} pkt.data.token - hashed session info
 * @return {Object} returned data payload
 */
function PKT_SessionLogin(pkt) {
  if (pkt.getMessage() !== 'NET:SRV_SESSION_LOGIN')
    throw Error('not a session login packet');
  const uaddr = pkt.getSourceAddress();
  const sock = m_SocketLookup(uaddr);
  if (!sock) throw Error(`uaddr '${uaddr}' not associated with a socket`);
  if (sock.USESS) {
    const error = `socket '${uaddr}' already has a session '${JSON.stringify(
      sock.USESS
    )}'`;
    return { error, code: NetPacket.CODE_SES_RE_REGISTER };
  }
  const { token } = pkt.getData();
  if (!token || typeof token !== 'string')
    return { error: 'must provide token string' };
  const decoded = SESSION.DecodeToken(token);
  if (!decoded.isValid) {
    const error = `token '${token}' is not valid`;
    return { error, code: NetPacket.CODE_SES_INVALID_TOKEN };
  }
  const key = SESSION.MakeAccessKey(token, uaddr);
  sock.USESS = decoded;
  sock.UKEY = key;
  if (DBG.client) TERM(`${uaddr} user log-in '${decoded.token}'`);
  LOGGER.Write(sock.UADDR, 'log-in', decoded.token);
  return { status: 'logged in', success: true, token, uaddr, key };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Handle SESSION LOGOUT packets
 *
 * @param {NetPacket} pkt - NetPacket packet instance
 * @param {Object} pkt.data - data payload
 * @param {String} pkt.data.token - hashed session info
 * @return {Object} returned data payload
 */
function PKT_SessionLogout(pkt) {
  if (pkt.getMessage() !== 'NET:SRV_SESSION_LOGOUT')
    throw Error('not a session logout packet');
  const uaddr = pkt.getSourceAddress();
  const sock = m_SocketLookup(uaddr);
  const { key } = pkt.getData();
  if (sock.UKEY !== key)
    return { error: `uaddr '${uaddr}' key '${key}'!=='${sock.UKEY}'` };
  if (DBG.client) TERM(`${uaddr} user logout '${sock.USESS.token}'`);
  if (sock.USESS) LOGGER.Write(sock.UADDR, 'logout', sock.USESS.token);
  sock.UKEY = undefined;
  sock.USESS = undefined;
  return { status: 'logged out', success: true };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return a session object based on the passed packet's stored credentials
 */
function PKT_Session(pkt) {
  const uaddr = pkt.getSourceAddress();
  const sock = m_SocketLookup(uaddr);
  if (!sock) {
    const error = `${uaddr} impossible socket lookup failure`;
    TERM(error);
    return { error, code: NetPacket.CODE_SOC_NOSOCK };
  }
  const { key } = pkt.Data();
  if (sock.ULOCAL) {
    if (DBG.client) TERM(`${uaddr} is localhost so bypass key check`);
    return { localhost: true };
  }
  if (!key) {
    const error = `${uaddr} access key is not set`;
    if (DBG.client) TERM(error);
    return { error, code: NetPacket.CODE_SES_REQUIRE_KEY };
  }
  const evil_backdoor = SESSION.AdminPlaintextPassphrase();
  if (key === evil_backdoor) {
    // do some hacky bypassing...yeep
    if (!sock.USESS) {
      const warning = `non-localhost admin '${evil_backdoor}' logged-in`;
      LOGGER.Write(uaddr, warning);
      TERM(`${uaddr} WARN ${warning}`);
      const adminToken = SESSION.MakeToken('Admin', {
        groupId: 0,
        classroomId: 0
      });
      sock.USESS = SESSION.DecodeToken(adminToken);
      sock.UKEY = key;
    }
  }
  if (!sock.USESS) {
    const error = `sock.${uaddr} is not logged-in`;
    if (DBG.client) TERM(`${uaddr} is not logged-in`);
    return { error, code: NetPacket.CODE_SES_REQUIRE_LOGIN };
  }
  if (key !== sock.UKEY) {
    if (DBG.client) {
      TERM(
        `Session: sock.${uaddr} keys do not match packet '${sock.UKEY}' '${key}'`
      );
    }
    const error = `sock.${uaddr} access keys do not match '${sock.UKEY}' '${key}'`;
    return { error, code: NetPacket.CODE_SES_INVALID_KEY };
  }
  // passes all tests, so its good!
  return sock.USESS;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** helper debug output used by m_SocketAdd(), m_SocketDelete() */
function log_ListSockets(change) {
  TERM(`socketlist changed: '${change}'`);
  // let's use iterators! for..of
  let values = SOCKETS.values();
  let count = 1;
  for (let socket of values) {
    TERM(`  ${count} = ${socket.UADDR}`);
    count++;
  }
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** helper debug output used by m_HandleMessage() */
function log_PktDirection(pkt, direction, promises) {
  if (promises.length < 1) return;
  const ents = promises.length > 1 ? 'handlers' : 'handler';
  TERM(
    `${pkt.Info()} ${direction} '${pkt.Message()}' (${promises.length} ${ents})`
  );
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** helper debug output used by m_HandleMessage() */
function log_PktTransaction(pkt, status, promises) {
  const src = pkt.getSourceAddress();
  if (promises && promises.length) {
    TERM(`${src} >> '${pkt.Message()}' ${status} ${promises.length} Promises`);
  } else {
    TERM(`${src} << '${pkt.Message()}' ${status}`);
  }
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = URNET;
