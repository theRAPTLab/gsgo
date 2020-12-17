/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-param-reassign */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    URSYS NETWORK implements network controls and synchronization.
    It initializes a network connection on the CONNECT lifecycle.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/
const NetPacket = require('./class-netpacket');
const URSession = require('./client-session');
const PR = require('./util/prompts').makeStyleFormatter('SYSTEM', 'TagBlue');

/// DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = { connect: false, hello: true, handle: false, reg: false };
///
const ENDPOINT_NAME = 'MessagerEndpoint';
const ERR_NO_SOCKET = 'Network socket has not been established yet';
const ERR_BAD_URCHAN = `An instance of '${ENDPOINT_NAME}' is required`;

/// NETWORK ID VALUES /////////////////////////////////////////////////////////
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
let m_urlink; // assigned during NETWORK.Connect()
let m_options;
let m_status = M0_INIT;

/// NETWORK LISTENERS /////////////////////////////////////////////////////////
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
  m_status = M3_REGISTERED;
  // (2) initialize global settings for netmessage
  if (DBG.connect || DBG.hello) console.log(...PR(`URNET SAYS '${HELLO}'`));
  m_socket.UADDR = NetPacket.DefaultServerUADDR();
  NetPacket.GlobalSetup({
    uaddr: UADDR,
    netsocket: m_socket,
    server_uaddr: SERVER_UADDR,
    peers: PEERS,
    is_local: ULOCAL
  });
  // (3) connect regular message handler
  m_AddListener('message', m_HandleMessage);
  m_status = M4_READY;
  // (4) network is initialized
  if (typeof m_options.success === 'function') m_options.success();
  // (5) also update window.URSESSION with UADDR
  if (!window.URSESSION) window.URSESSION = {};
  if (DBG.reg) console.log('updating URSESSION with registration data');
  window.URSESSION.CLIENT_UADDR = UADDR;
  window.URSESSION.USRV_UADDR = SERVER_UADDR;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Dispatch incoming event object from the network.
 *  @param {SocketEvent} msgEvent -incoming event object from websocket
 */
function m_HandleMessage(msgEvent) {
  let pkt = new NetPacket(msgEvent.data);
  let msg = pkt.getMessage();
  // (1) If this packet is a response packet, then it must be one of
  // our OWN previously-sent messages that we expected a return value.
  // Call CompleteTransaction() to invoke the function handler
  if (pkt.isResponse()) {
    if (DBG.handle) console.log(...PR(`completing transaction ${msg}`));
    pkt.transactionComplete();
    return;
  }
  // (2) Otherwise, the incoming network message has been routed to
  // us to handle.
  let data = pkt.getData();
  let type = pkt.getType();
  let dbgout = DBG.handle && !msg.startsWith('NET:SRV_');
  // (3) handle each packet type as necessary
  switch (type) {
    case 'state':
      // unimplemented netstate
      if (dbgout) console.log(...PR(`received state change ${msg}`));
      break;
    case 'msend':
      // network message received
      if (dbgout) cout_ReceivedStatus(pkt);
      m_urlink.sendMessage(msg, data, { fromNet: true });
      pkt.transactionReturn();
      break;
    case 'msig':
      // network signal to raise
      if (dbgout) cout_ReceivedStatus(pkt);
      m_urlink.raiseMessage(msg, data, { fromNet: true });
      pkt.transactionReturn();
      break;
    case 'mcall':
      // network call received
      if (dbgout) cout_ReceivedStatus(pkt);
      m_urlink.callMessage(msg, data, { fromNet: true }).then(result => {
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
  function cout_ReceivedStatus(pkt) {
    console.warn(
      ...PR(
        `ME_${NetPacket.SocketUADDR()} received '${pkt.getType()}' '${pkt.getMessage()}' from ${pkt.getSourceAddress()}`
      ),
      pkt.getData()
    );
  }
  // DEBUG OUT UTILITY
  function cout_ForwardedStatus(pkt, result) {
    console.log(
      ...PR(
        `ME_${NetPacket.SocketUADDR()} forwarded '${pkt.getMessage()}', returning ${JSON.stringify(
          result
        )}`
      )
    );
  }
}

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NETWORK = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Establish connection to URSYS server. This is called by client.js during
 *  NetworkInitialize(), which itself fires after the application has rendered
 *  completely.
 *  @param datalink - an urchannel endpoint
 *  @param opt - { success, failure } functions
 */
NETWORK.Connect = (datalink, opt) => {
  return new Promise(resolve => {
    if (m_status > 0) {
      let err =
        'called twice...other views may be calling URSYS outside of lifecycle';
      console.error(...PR(err));
      return;
    }
    m_status = M1_CONNECTING;

    // check and save parms
    if (datalink.constructor.name !== 'MessagerEndpoint') {
      throw Error(ERR_BAD_URCHAN);
    }
    if (!m_urlink) m_urlink = datalink;
    m_options = opt || {};

    // create websocket
    // uses values that are set by UR-EXEC SystemBoot()
    const { host: USRV_Host, port: USRV_MsgPort } = URSession.GetNetBroker();
    let wsURI = `ws://${USRV_Host}:${USRV_MsgPort}`;
    m_socket = new WebSocket(wsURI);
    if (DBG.connect) console.log(...PR(`OPEN SOCKET TO ${wsURI}`));

    // create listeners
    m_AddListener('open', event => {
      if (DBG.connect) console.log(...PR(`...OPEN ${event.target.url}`));
      m_status = M2_CONNECTED;
      // message handling continues in 'message' handler
      // the first message is assumed to be registration data
      if (DBG.connect) console.log(...PR('CONNECTED'));
      resolve();
    });
    m_AddListener('close', event => {
      if (DBG.connect) console.log(...PR(`..CLOSE ${event.target.url}`));
      NetPacket.GlobalOfflineMode();
      m_status = M_STANDALONE;
    });
    // handle incoming messages
    m_AddListener('message', m_HandleRegistrationMessage);
  });
}; // Connect()
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Force close of connection, for example if URSYS.AppReady() fails
 */
NETWORK.Close = (code, reason) => {
  code = code || 1000;
  reason = reason || 'URSYS forced close';
  m_socket.close(code, reason);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return the current uaddr of this client, which is stored in NetPacket
 *  when the client initializes.
 */
NETWORK.SocketUADDR = () => {
  return NetPacket.SocketUADDR();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return TRUE if client is in "standalone" mode. This was a NetCreate
 *  that was used to disable network communication for HTML-only snapshots.
 */
NETWORK.IsStandaloneMode = () => {
  return m_status === M_STANDALONE;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return TRUE if client is running with the localhost as server.
 *  This can be used as quick way to enable admin-only features.
 */
NETWORK.IsLocalhost = () => NetPacket.IsLocalhost();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NETWORK.ServerIP = () => {
  const { host } = URSession.GetNetBroker();
  return host;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NETWORK.URNetPort = () => {
  const { port } = URSession.GetNetBroker();
  return port;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NETWORK.WebServerPort = () => window.location.port || 80;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NETWORK.ConnectionString = () => {
  const { host } = URSession.GetNetBroker();
  const port = window.location.port;
  let str = `appserver at ${host}`;
  if (port) str += `:${port}`;
  return str;
};

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NETWORK;
