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
const TERM = require('./util/prompts').makeTerminalOut(' URNET');
const { CFG_SVR_UADDR } = require('./ur-common');
const {
  InitializeNetInfo,
  SocketAdd,
  SocketDelete,
  GetSocketCount,
  ServerHandlerPromises,
  RemoteHandlerPromises
} = require('./server-datacore');
const { NetHandle, LocalSignal } = require('./server-message-api');
const { PKT_RegisterHandler } = require('./svc-reg-handlers');
const {
  PKT_SessionLogin,
  PKT_SessionLogout,
  PKT_Session
} = require('./svc-session-v1');
const {
  PKT_ProtocolDirectory,
  PKT_DeviceDirectory
} = require('./svc-net-directory');
const { PKT_ServiceList, PKT_Reflect } = require('./svc-debug');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = { init: true, calls: false, client: true };
const ERR_SS_EXISTS = 'socket server already created';

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// sockets
let mu_wss; // websocket server

/// MESSAGE BROKER STARTUP API ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Initializes the web socket server using the options passed-in
 *  @param {Object} [options] - configuration settings
 *  @param {number} [options.port] - default in ur-config
 *  @param {string} [options.uaddr] - default in ur-config
 *  @returns {Object} complete configuration object
 */
function StartNetwork(options = {}) {
  if (!options.runtimePath) {
    return Error('runtimePath required to start URSYS SERVER');
  }
  // host port uaddr urnet_version
  InitializeNetInfo(options);
  if (mu_wss !== undefined) throw Error(ERR_SS_EXISTS);

  LOGGER.StartLogging(options);
  NetPacket.GlobalSetup({ uaddr: options.uaddr });

  // REGISTER SERVER-BASED MESSAGE HANDLERS
  LOGGER.Write('registering network services');
  NetHandle('NET:SRV_LOG_EVENT', LOGGER.PKT_LogEvent);
  NetHandle('NET:SRV_REG_HANDLERS', PKT_RegisterHandler);
  NetHandle('NET:SRV_SESSION_LOGIN', PKT_SessionLogin);
  NetHandle('NET:SRV_SESSION_LOGOUT', PKT_SessionLogout);
  NetHandle('NET:SRV_SESSION', PKT_Session);
  NetHandle('NET:SRV_REFLECT', PKT_Reflect);
  NetHandle('NET:SRV_SERVICE_LIST', PKT_ServiceList);
  // NEW DIRECTORY STUFF
  NetHandle('NET:SRV_PROTOCOLS', PKT_ProtocolDirectory);
  NetHandle('NET:SRV_DEVICES', PKT_DeviceDirectory);
  // START SOCKET SERVER
  m_StartSocketServer(options);
  //
  return options;
}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** start socket server message broker */
function m_StartSocketServer(options) {
  // create listener.
  try {
    mu_wss = new WSS(options);
    mu_wss.on('listening', () => {
      if (DBG.init) TERM(`socket server listening on port ${options.port}`);
      mu_wss.on('connection', (socket, req) => {
        // if (DBG) TERM('socket connected');
        // house keeping
        SocketAdd(socket, req); // assign UADDR to socket
        ConnectAck(socket); // tell client HELLO with new UADDR
        // subscribe socket to handlers
        socket.on('message', json => ProcessMessage(socket, json));
        socket.on('close', () => {
          const uaddr = SocketDelete(socket); // tell subscribers socket is gone
          LocalSignal('SRV_SOCKET_DELETED', { uaddr });
        }); // end on 'connection'
      });
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
function ConnectAck(socket) {
  let PEERS = { count: GetSocketCount() };
  let data = {
    HELLO: `Welcome to URSYS, ${socket.UADDR}`,
    UADDR: socket.UADDR,
    CFG_SVR_UADDR,
    PEERS,
    ULOCAL: socket.ULOCAL
  };
  socket.send(JSON.stringify(data));
}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Main entry point for handling 'message' events from a client socket. It
 * converts the incoming JSON to a NetPacket packet and passes processing
 * further on depending on the type.
 * @param {Object} socket messaging socket
 * @param {string} json text-encoded NetPacket
 */
function ProcessMessage(socket, json) {
  let pkt = new NetPacket(json);
  // figure out what to do
  switch (pkt.getType()) {
    case 'msig':
    case 'msend':
    case 'mcall':
      m_RouteMessage(socket, pkt);
      break;
    case 'state':
      // m_HandleState(socket, pkt);
      break;
    default:
      throw new Error(`${TERM} unknown packet type '${pkt.getType()}'`);
  } // end switch
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
async function m_RouteMessage(socket, pkt) {
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
  let promises = ServerHandlerPromises(pkt);

  // (3) If the server doesn't implement any promises, check if there are
  // any remotes that have registered one.
  if (promises.length === 0) promises = RemoteHandlerPromises(pkt);

  // (3a) If there were NO HANDLERS defined for the incoming message, then
  // this is an error. If the message is a CALL, then report an error back to
  // the originator; other message types don't expect a return value.
  if (promises.length === 0) {
    const out = `${pkt.getSourceAddress()} can't find '${pkt.getMessage()}'`;
    const info = 'check (1) remote is offline or (2) using send instead of raise';
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
  pkt.setData(data);
  pkt.transactionReturn(socket);
  const dbgData = JSON.stringify(data);
  if (DBG_NOSRV)
    TERM(`'${pkt.getMessage()}' returning transaction data ${dbgData}`);
}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** MAIN HANDLER (currently stub) for network-synched state messages, which
 * are not yet implemented in URSYS
 * @param {Object} socket messaging socket
 * @param {NetPacket} pkt a NetPacket object received from socket
 */

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** helper debug output used by m_RouteMessage() */
function log_PktDirection(pkt, direction, promises) {
  if (promises.length < 1) return;
  const ents = promises.length > 1 ? 'handlers' : 'handler';
  TERM(
    `${pkt.getInfo()} ${direction} '${pkt.getMessage()}' (${
      promises.length
    } ${ents})`
  );
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** helper debug output used by m_RouteMessage() */
function log_PktTransaction(pkt, status, promises) {
  const src = pkt.getSourceAddress();
  if (promises && promises.length) {
    TERM(`${src} >> '${pkt.getMessage()}' ${status} ${promises.length} Promises`);
  } else {
    TERM(`${src} << '${pkt.getMessage()}' ${status}`);
  }
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { StartNetwork };
