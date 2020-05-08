/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-param-reassign */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    URSYS NETWORK implements network controls and synchronization.
    It initializes a network connection on the CONNECT lifecycle.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import CENTRAL from './client-central';
import NetMessage from '../common/class-netmessage';
import PROMPTS from '../common/util-prompts';

const DBG = { connect: false, handle: false, reg: false };

/// DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.Pad('NETWORK');
const WARN = PROMPTS.Pad('!!!');
const ERR_NM_REQ = 'arg1 must be NetMessage instance';
const ERR_NO_SOCKET = 'Network socket has not been established yet';
const ERR_BAD_ULINK = "An instance of 'URLink' is required";

/// GLOBAL NETWORK INFO (INJECTED ON INDEX) ///////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NETSOCK = {};

/// NETWORK ID VALUES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const M0_INIT = 0;
const M1_CONNECTING = 1;
const M2_CONNECTED = 2;
const M3_REGISTERED = 3;
const M4_READY = 4;
const M_STANDALONE = 5;
const M_NOCONNECT = 6;
let m_status = M0_INIT;
let m_options = {};

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NETWORK = {};
let ULINK = null; // assigned during NETWORK.Connect()

/// NETWORK LISTENERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NETWORK.AddListener = (event, handlerFunction) => {
  if (NETSOCK.ws instanceof WebSocket) {
    NETSOCK.ws.addEventListener(event, handlerFunction);
  } else {
    throw Error(ERR_NO_SOCKET);
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NETWORK.RemoveListener = (event, handlerFunction) => {
  if (NETSOCK.ws instanceof WebSocket) {
    NETSOCK.ws.removeEventListener(event, handlerFunction);
  } else {
    throw Error(ERR_NO_SOCKET);
  }
};

/// CONNECT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Establish connection to URSYS server. This is called by client.js during
    NetworkInitialize(), which itself fires after the application has rendered
    completely.
/*/
NETWORK.Connect = (datalink, opt) => {
  // special case: STANDALONE mode is set by a different set of magical
  // window.NC_UNISYS properties
  // if (window.NC_UNISYS.server.ip === 'standalone') {
  //   m_status = M_STANDALONE;
  //   console.warn(PR, 'STANDALONE MODE: NETWORK.Connect() suppressed!');
  //   NetMessage.GlobalOfflineMode();
  //   if (typeof opt.success === 'function') opt.success();
  //   return;
  // }

  // if multiple network connections occur, emit warning
  // warning: don't modify this unless you have a deep knowledge of how
  // the webapp system works or you might break something
  if (m_status > 0) {
    let err =
      'called twice...other views may be calling URSYS outside of lifecycle';
    console.error(WARN, err);
    return;
  }
  m_status = M1_CONNECTING;

  // check and save parms
  if (datalink.constructor.name !== 'URLink') {
    throw Error(ERR_BAD_ULINK);
  }
  if (!ULINK) ULINK = datalink;
  m_options = opt || {};

  // create websocket
  // uses values that were embedded in index.ejs on load
  const { USRV_Host, USRV_MsgPort } = CENTRAL.GetVal('ur_session');
  let wsURI = `ws://${USRV_Host}:${USRV_MsgPort}`;
  NETSOCK.ws = new WebSocket(wsURI);
  if (DBG.connect) console.log(PR, 'OPEN SOCKET TO', wsURI);

  // create listeners
  NETWORK.AddListener('open', event => {
    if (DBG.connect) console.log(PR, '...OPEN', event.target.url);
    m_status = M2_CONNECTED;
    // message handling continues in 'message' handler
    // the first message is assumed to be registration data
  });
  NETWORK.AddListener('close', event => {
    if (DBG.connect) console.log(PR, '..CLOSE', event.target.url);
    NetMessage.GlobalOfflineMode();
    m_status = M_STANDALONE;
  });
  // handle incoming messages
  NETWORK.AddListener('message', m_HandleRegistrationMessage);
}; // Connect()

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ After 'open' event, we expect the first message on the socket to contain
    network session-related messages
/*/
function m_HandleRegistrationMessage(msgEvent) {
  let regData = JSON.parse(msgEvent.data);
  let { HELLO, UADDR, SERVER_UADDR, PEERS, ULOCAL } = regData;
  // (1) after receiving the initial message, switch over to regular
  // message handler
  NETWORK.RemoveListener('message', m_HandleRegistrationMessage);
  m_status = M3_REGISTERED;
  // (2) initialize global settings for netmessage
  if (DBG.connect) console.log(PR, `'${HELLO}'`);
  NETSOCK.ws.UADDR = NetMessage.DefaultServerUADDR();
  NetMessage.GlobalSetup({
    uaddr: UADDR,
    netsocket: NETSOCK.ws,
    server_uaddr: SERVER_UADDR,
    peers: PEERS,
    is_local: ULOCAL
  });
  // (3) connect regular message handler
  NETWORK.AddListener('message', m_HandleMessage);
  m_status = M4_READY;
  // (4) network is initialized
  if (typeof m_options.success === 'function') m_options.success();
  // (5) also update window.URSESSION with UADDR
  if (window.URSESSION) {
    if (DBG.reg) console.log('updating URSESSION with registration data');
    window.URSESSION.CLIENT_UADDR = UADDR;
    window.URSESSION.USRV_UADDR = SERVER_UADDR;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Dispatch incoming event object from the network.
 * @param {SocketEvent} msgEvent -incoming event object from websocket
 */
function m_HandleMessage(msgEvent) {
  let pkt = new NetMessage(msgEvent.data);
  let msg = pkt.Message();
  // (1) If this packet is a response packet, then it must be one of
  // our OWN previously-sent messages that we expected a return value.
  // Call CompleteTransaction() to invoke the function handler
  if (pkt.IsResponse()) {
    if (DBG.handle) console.log(PR, 'completing transaction', msg);
    pkt.CompleteTransaction();
    return;
  }
  // (2) Otherwise, the incoming network message has been routed to
  // us to handle.
  let data = pkt.Data();
  let type = pkt.Type();
  let dbgout = DBG.handle && !msg.startsWith('NET:SRV_');

  // (3) handle each packet type as necessary
  switch (type) {
    case 'state':
      // unimplemented netstate
      if (dbgout) console.log(PR, 'received state change', msg);
      break;
    case 'msig':
      // network signal to raise
      if (dbgout) cout_ReceivedStatus(pkt);
      ULINK.LocalSignal(msg, data, { fromNet: true });
      pkt.ReturnTransaction();
      break;
    case 'msend':
      // network message received
      if (dbgout) cout_ReceivedStatus(pkt);
      ULINK.LocalPublish(msg, data, { fromNet: true });
      pkt.ReturnTransaction();
      break;
    case 'mcall':
      // network call received
      if (dbgout) cout_ReceivedStatus(pkt);
      ULINK.LocalCall(msg, data, { fromNet: true }).then(result => {
        if (dbgout) cout_ForwardedStatus(pkt, result);
        // now return the packet
        pkt.SetData(result);
        pkt.ReturnTransaction();
      });
      break;
    default:
      throw Error('unknown packet type', type);
  }
  // DEBUG OUT UTILITY
  function cout_ReceivedStatus(pkt) {
    console.warn(
      PR,
      `ME_${NetMessage.SocketUADDR()} received '${pkt.Type()}' '${pkt.Message()}' from ${pkt.SourceAddress()}`,
      pkt.Data()
    );
  }
  // DEBUG OUT UTILITY
  function cout_ForwardedStatus(pkt, result) {
    console.log(
      `ME_${NetMessage.SocketUADDR()} forwarded '${pkt.Message()}', returning ${JSON.stringify(
        result
      )}`
    );
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Force close of connection, for example if URSYS.AppReady() fails
/*/
NETWORK.Close = (code, reason) => {
  code = code || 1000;
  reason = reason || 'URSYS forced close';
  NETSOCK.ws.close(code, reason);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NETWORK.SocketUADDR = () => {
  return NetMessage.SocketUADDR();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NETWORK.IsStandaloneMode = () => {
  return m_status === M_STANDALONE;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NETWORK.IsLocalhost = () => NetMessage.IsLocalhost();

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default NETWORK;
