/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  description

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { resolveSrv } = require('dns');
const http = require('http');
const WebSocket = require('ws');
const NetPacket = require('./class-netpacket');
const EndPoint = require('./class-endpoint');
const Messager = require('./class-messager');
const DATACORE = require('./datacore');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const CONNECT_OPTIONS = {
  hostname: 'localhost', // remote AppServer w/ URNET discovery service
  port: 80,
  path: '/urnet/netinfo', // microservice returning URNET connection info
  method: 'GET'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_socket; // websocket connection to URNET
let m_netinfo; // URNET connection info from webservie
let m_regdata; // assigned UADDR from URNET
let m_urlink; // endpoint for talking to URNET

/// DECLARE MESSAGE HANDLERS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** send the list of handled messages to the server */
function m_RegisterMessages() {
  void (async () => {
    m_urlink.handleMessage('NET:SERVER_CLIENT', async (msg, data) => {
      console.log('handling NET:SERVER_CLIENT with payload', data);
    });
    await m_urlink.ursysRegisterMessages();
  })();
}

/// SUPPORT METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** the gemstep appserver provides the /urnet/netinfo microservice to retrieve
 *  connection data needed to connect to it via websocket */
function m_PromiseNetInfo() {
  return new Promise((resolve, reject) => {
    const req = http.request(CONNECT_OPTIONS, res => {
      res.on('data', d => {
        const obj = JSON.parse(d);
        resolve(obj);
      });
    });
    req.on('error', error => {
      console.error(error);
      reject(error);
    });
    req.end();
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a unique string for the packet */
function m_GetPacketHash(pkt) {
  return `${pkt.getSourceAddress()}:${pkt.id}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** debug message for received packets */
const cons_received = p => {
  const tt = p.getType();
  const mm = p.getMessage();
  const hh = m_GetPacketHash(p);
  const sa = p.getSourceAddress();
  console.warn(`received '${tt}' ${hh} '${mm}' from ${sa}`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** debug message for forwarded packets */
const cons_forwarded = (p, result) => {
  const mm = p.getMessage();
  const hh = m_GetPacketHash(p);
  const rr = JSON.stringify(result);
  console.log(`forwarded ${hh} '${mm}', returning ${rr}`);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** handle regular incoming messages after m_HandleRegistration completes */
function m_HandleMessage(msgEvent) {
  let pkt = new NetPacket(msgEvent.data);
  let msg = pkt.getMessage();
  let hash = m_GetPacketHash(pkt);
  // (1) If this packet is a response packet, then it must be one of
  // our OWN previously-sent messages that we expected a return value.
  // Call CompleteTransaction() to invoke the function handler
  if (pkt.isResponse()) {
    if (DBG) console.log(`${hash} completing transaction ${msg}`);
    pkt.transactionComplete();
    return;
  }
  // (2) Otherwise, the incoming network message has been routed to
  // us to handle.
  let data = pkt.getData();
  let type = pkt.getType();
  // (3) handle each packet type as necessary
  switch (type) {
    case 'msend':
      // network message received
      cons_received(pkt);
      m_urlink.sendMessage(msg, data, { fromNet: true });
      pkt.transactionReturn();
      break;
    case 'msig':
      // network signal to raise
      cons_received(pkt);
      m_urlink.raiseMessage(msg, data, { fromNet: true });
      pkt.transactionReturn();
      break;
    case 'mcall':
      // network call received
      if (dbgout) cons_received(pkt);
      m_urlink.callMessage(msg, data, { fromNet: true }).then(result => {
        if (dbgout) cons_forwarded(pkt, result);
        // now return the packet
        pkt.setData(result);
        pkt.transactionReturn();
      });
      break;
    default:
      throw Error('unknown packet type', type);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** open socket connection */
function m_HandleRegistration(msgEvent) {
  m_regdata = JSON.parse(msgEvent);
  let { HELLO, UADDR, CFG_SVR_UADDR, PEERS, ULOCAL } = m_regdata;
  console.log(m_regdata);
  // (1) after receiving the initial message, switch over to regular
  // message handler
  m_socket.removeEventListener('message', m_HandleRegistration);
  m_socket.UADDR = CFG_SVR_UADDR;
  NetPacket.GlobalSetup({
    uaddr: UADDR,
    netsocket: m_socket,
    server_uaddr: CFG_SVR_UADDR,
    peers: PEERS,
    is_local: ULOCAL
  });
  console.log(`${UADDR} connected to ${CFG_SVR_UADDR}`);
  DATACORE.SaveRegistration(m_regdata);
  m_socket.addEventListener('message', m_HandleMessage);
  DATACORE.SaveEndpoints({
    LocalNode: new EndPoint('ur-local'),
    NetNode: new EndPoint('ur-remote')
  });
  m_urlink = new EndPoint('ur-immediate');
  m_RegisterMessages();
}

/// RUNTIME IIFE //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** connect to the gemstep appserver's message system */
void (async function () {
  m_netinfo = await m_PromiseNetInfo();
  const { broker } = m_netinfo;
  const { host, port } = broker;
  const wsurl = `ws://${host}:${port}`;
  m_socket = new WebSocket(wsurl);
  m_socket.on('open', function open() {
    console.log(`socket connected to ${wsurl}`);
  });
  m_socket.on('message', m_HandleRegistration);
})();
