/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-param-reassign */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    URSYS URNET implements network controls and synchronization.
    It initializes a network connection on the CONNECT lifecycle.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/
const NetPacket = require('./class-netpacket');
const EndPoint = require('./class-endpoint');
const NETINFO = require('./client-netinfo');
const PROMPTS = require('./util/prompts');
const DATACORE = require('./client-datacore');
const {
  CFG_SVR_UADDR,
  CFG_URNET_SERVICE,
  PacketHash,
  CLI_UADDR
} = require('./ur-common');

const PR = PROMPTS.makeStyleFormatter('SYSTEM', 'TagSystem');
const NPR = PROMPTS.makeStyleFormatter('URSYS ', 'TagUR');

/// DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = { connect: false, hello: false, handle: false, reg: false };
///
const ENDPOINT_NAME = 'MessagerEndpoint';
const ERR_NO_SOCKET = 'Network socket has not been established yet';
const ERR_BAD_URCHAN = `An instance of '${ENDPOINT_NAME}' is required`;

/// URNET ID VALUES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const M0_INIT = 0;
const M1_CONNECTING = 1;
const M2_CONNECTED = 2;
const M3_REGISTERED = 3;
const M4_READY = 4;
const M_STANDALONE = 5;

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_socket; // contain socket information on registration message
let m_local_node; // assigned during URNET.Connect()
let m_net_node; // assigned during URNET.Connect()
let m_options;
let m_status = M0_INIT; // current status

/// URNET LISTENERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_AddListener(event, handlerFunction) {
  if (m_socket instanceof WebSocket) {
    m_socket.addEventListener(event, handlerFunction);
  } else {
    throw Error(ERR_NO_SOCKET);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_RemoveListener(event, handlerFunction) {
  if (m_socket instanceof WebSocket) {
    m_socket.removeEventListener(event, handlerFunction);
  } else {
    throw Error(ERR_NO_SOCKET);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_SetStatus(nextStatus) {
  m_status = nextStatus;
}

/// API HELPERS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** After 'open' event, we expect the first message on the socket to contain
 *  network session-related messages
 */
function m_HandleRegistrationMessage(msgEvent) {
  let regData = JSON.parse(msgEvent.data);
  let { HELLO, UADDR, SERVER_UADDR, PEERS, ULOCAL } = regData;
  // (1) after receiving the initial message, switch over to regular
  // message handler
  m_RemoveListener('message', m_HandleRegistrationMessage);
  m_SetStatus(M3_REGISTERED);
  // (2) initialize global settings for netmessage
  console.log(...NPR(`URNET connected: '${HELLO}'`));
  m_socket.UADDR = CFG_SVR_UADDR;
  NetPacket.GlobalSetup({
    uaddr: UADDR,
    netsocket: m_socket,
    server_uaddr: SERVER_UADDR,
    peers: PEERS,
    is_local: ULOCAL
  });
  // (3) also save to new client-datacor, which should replace (5) above
  DATACORE.SaveClientInfo({
    uaddr: UADDR,
    srv_uaddr: SERVER_UADDR,
    isLocalServer: ULOCAL
  });
  // (4) connect regular message handler
  m_AddListener('message', m_HandleMessage);
  m_SetStatus(M4_READY);
  // (5) network is initialized
  if (typeof m_options.success === 'function') m_options.success();
  // (6) also update window.URSESSION with UADDR
  if (!window.URSESSION) window.URSESSION = {};
  if (DBG.reg) console.log('updating URSESSION with registration data');
  window.URSESSION.CLIENT_UADDR = UADDR;
  window.URSESSION.USRV_UADDR = SERVER_UADDR;
  // (7) initialize endpoint
  const LocalNode = new EndPoint('ur-client-local'); // used for local handle, call, send
  const NetNode = new EndPoint('ur-client-net'); // used only for forwarding remote messages
  DATACORE.SetSharedEndPoints({ LocalNode, NetNode });
  m_local_node = LocalNode; // used for local message routine
  m_net_node = NetNode; // used for network message forwarding
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Dispatch incoming event object from the network.
 *  @param {SocketEvent} msgEvent -incoming event object from websocket
 */
function m_HandleMessage(msgEvent) {
  let pkt = new NetPacket(msgEvent.data);
  let msg = pkt.getMessage();
  let hash = PacketHash(pkt);
  // (1) If this packet is a response packet, then it must be one of
  // our OWN previously-sent messages that we expected a return value.
  // Call CompleteTransaction() to invoke the function handler
  if (pkt.isResponse()) {
    if (DBG.handle) console.log(...PR(`${hash} completing transaction ${msg}`));
    pkt.transactionComplete();
    return;
  }
  // (2) Otherwise, the incoming network message has been routed to
  // us to handle.
  let data = pkt.getData();
  let type = pkt.getType();
  let dbgout = DBG.handle && !msg.startsWith('NET:SRV_'); // don't log server messages
  // (3) handle each packet type as necessary
  switch (type) {
    case 'state':
      // unimplemented netstate
      if (dbgout) console.log(...PR(`${hash} received state change ${msg}`));
      break;
    case 'msend':
      // network message received
      if (dbgout) cout_ReceivedStatus(pkt);
      m_net_node.sendMessage(msg, data, { fromNet: true });
      pkt.transactionReturn();
      break;
    case 'msig':
      // network signal to raise
      if (dbgout) cout_ReceivedStatus(pkt);
      m_net_node.raiseMessage(msg, data, { fromNet: true });
      pkt.transactionReturn();
      break;
    case 'mcall':
      // network call received
      if (dbgout) cout_ReceivedStatus(pkt);
      m_net_node.callMessage(msg, data, { fromNet: true }).then(result => {
        console.log(...PR(`transaction ${msg} ${hash} returned`, result));
        console.log(...PR('original sent data', data));
        if (dbgout) cout_ForwardedStatus(pkt, result);
        // now return the packet
        pkt.setData(result);
        pkt.transactionReturn();
      });
      break;
    default:
      throw Error('unknown packet type', type);
  }
  // DEBUG OUT UTILITY
  function cout_ReceivedStatus(p) {
    console.warn(
      ...PR(
        `received '${p.getType()}' ${hash} '${p.getMessage()}' from ${pkt.getSourceAddress()}`
      ),
      pkt.getData()
    );
  }
  // DEBUG OUT UTILITY
  function cout_ForwardedStatus(p, result) {
    console.log(
      ...PR(
        `forwarded ${hash} '${p.getMessage()}', returning ${JSON.stringify(
          result
        )}`
      )
    );
  }
}

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URNET = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Establish connection to URSYS server. This is called by client.js during
 *  NetworkInitialize(), which itself fires after the application has rendered
 *  completely.
 *  @param datalink - DEPRECATED an urchannel endpoint
 *  @param opt - { success, failure } functions
 */
URNET.URNET_Connect = opt => {
  return new Promise(resolve => {
    if (URNET.WasInitialized()) {
      let err =
        'called twice...other views may be calling URSYS outside of lifecycle';
      console.error(...PR(err));
      return;
    }
    m_SetStatus(M1_CONNECTING);
    // note: datalink used to be assigned to m_local_node, but now it's handled
    // in HandleRegistrationMessage because that's the earlier the UADDR is
    // stable.
    m_options = opt || {};

    // create websocket
    // uses values that are set by UR-EXEC SystemNetBoot()
    const { host: USRV_Host, port: USRV_MsgPort } = NETINFO.GetNetInfo();
    let wsURI = `ws://${USRV_Host}:${USRV_MsgPort}`;
    m_socket = new WebSocket(wsURI);
    if (DBG.connect) console.log(...PR(`OPEN SOCKET TO ${wsURI}`));

    // create listeners
    m_AddListener('open', event => {
      if (DBG.connect) console.log(...PR(`...OPEN ${event.target.url}`));
      m_SetStatus(M2_CONNECTED);
      // message handling continues in 'message' handler
      // the first message is assumed to be registration data
      if (DBG.connect) console.log(...PR('CONNECTED'));
      resolve();
    });
    m_AddListener('close', event => {
      if (DBG.connect) console.log(...PR(`..CLOSE ${event.target.url}`));
      NetPacket.GlobalOfflineMode();
      m_SetStatus(M_STANDALONE);
    });
    // handle incoming messages
    m_AddListener('message', m_HandleRegistrationMessage);
  });
}; // Connect()
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Force close of connection, for example if URSYS.AppReady() fails
 */
URNET.URNET_Close = (code, reason) => {
  code = code || 1000;
  reason = reason || 'URSYS forced close';
  m_socket.close(code, reason);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return TRUE if client is in "standalone" mode. This was a NetCreate
 *  that was used to disable network communication for HTML-only snapshots.
 */
URNET.IsStandaloneMode = () => {
  return m_status === M_STANDALONE;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
URNET.WasInitialized = () => {
  return m_status > 0;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return TRUE if client is running with the localhost as server.
 *  This can be used as quick way to enable admin-only features.
 */
URNET.IsLocalhost = () => NetPacket.IsLocalhost();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
URNET.NetInfoRoute = () => CFG_URNET_SERVICE;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = URNET;
