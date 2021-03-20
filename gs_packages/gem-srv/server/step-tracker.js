let DBGTRK = true;

/*/////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Create a UDP LAN multicast listener on port 21234
  Forward UDP packets to TCP web socket subscribers on port 3030

  Multicast is one computer sending a UDP package to a special IP address,
  in the range 224.0.0.1 through 239.255.255.255. These "groups" are
  assigned by IANA.

  PORTED FROM ISTEP/PLAE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const dgram = require('dgram');
const WebSocketServer = require('ws').Server;
const { PrefixUtil } = require('@gemstep/ursys/server');
//
const PR = PrefixUtil('PTRACK');
const PT_GROUP = '224.0.0.1'; // ptrack UDP multicast address
const PT_UPORT = 21234; // ptrack UDP port
const OUT_DPORT = 3030; // ptrack TCP data port socket server
const IN_DPORT = 2525; // "faketrack" TCP data injector`
//
/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// ptrack udp socket
let udp_socket = null; // created by dgram

/// browser connection socket (send)
let ptrack_ss = null; // ptrack browser socket server
let ptrack_sockets = []; // web socket for forwarding ptrack to browser
let ptrack_id_counter = 1; // used to count connections to ptrack

/// faketrack injection socket (listen)
let ftrack_ss = null; // faketrack web socket server
let ftrack_socket = null; // web socket for receiving faketrack data

/// playback/record ptrack data support
let reader; // disabled
let writer; // disabled

/// SUPPORT FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called when a browser client requests a connection to ptrack
 */
function m_AddBrowserConnection(wsocket) {
  // make sure wsocket isn't already here
  let sobj;
  for (let i = 0; i < ptrack_sockets.length; i++) {
    sobj = ptrack_sockets[i];
    if (sobj.socket === wsocket) {
      console.log(...PR('duplicate socket connection aborted'));
      return;
    }
  }
  // add socket to list
  sobj = {
    socket: wsocket,
    id: ptrack_id_counter++
  };
  ptrack_sockets.push(sobj);
  if (DBGTRK) {
    console.log(...PR(`${OUT_DPORT} TrackData Client`, sobj.id, 'Connect'));
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called when a browser client disconnects
 */
function m_RemoveBrowserConnection(wsocket) {
  // create a new list of sockets that don't
  // match wsocket
  let new_sockets = [];
  for (let i = 0; i < ptrack_sockets.length; i++) {
    let sobj = ptrack_sockets[i];
    if (sobj.socket !== wsocket) new_sockets.push(sobj);
    else if (DBGTRK)
      console.log(
        ...PR(`${OUT_DPORT} TrackData Client`, sobj.id, 'Disconnected')
      );
  }
  // save new list
  ptrack_sockets = new_sockets;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** json data is sent to all subscribers to ptrack_socket. data is also written
 *  to log writer is it's active.
 */
function m_ForwardTrackerData(json) {
  if (ptrack_sockets) {
    // if reader is valid, we are playing back data and shouldn't
    // forward ANY ptrack data
    if (!reader) {
      const dead = [];
      ptrack_sockets.forEach(sobj => {
        sobj.socket.send(json, () => dead.push(sobj));
      });
      if (dead.length > 0)
        dead.forEach(sobj => {
          m_RemoveBrowserConnection(sobj.socket);
        });
    }
    // if writer is valid, we are logging data
    if (writer) writer.write(`${json}\n`);
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** create the UDP listener and forwarder
 */
function m_BindPTrackListener() {
  /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    host  - tracker computer, originating host of group traffic (optional?)
            BL: leave host commented-out so node will listen to all addresses
    group - special ip address for LAN multicast for all multicasters
            (may not need to join it explicitly)
  :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  let mc = {
    // host: '127.0.0.1',
    port: PT_UPORT,
    group: PT_GROUP
  };

  // create UDP socket, bind to port and host
  // IMPORTANT: host should be undefined if want to receive from all broadcasters
  // on the specified port
  udp_socket = dgram.createSocket('udp4');

  udp_socket.bind(mc.port, mc.host, () => {
    let address = udp_socket.address();
    // enable receiving multicast packets
    udp_socket.setMulticastLoopback(true);
    // join multicast group (necessary? 224.0.0.1 is all multicasters always)
    udp_socket.addMembership(mc.group, mc.host);
    // print status method to node console
    let str = 'LISTENING FOR PTRACK ON ';
    str += 'PORT ';
    str += address.port;
    console.log(...PR(str));
  });

  // set handler for incoming datagrams
  udp_socket.on('message', msg => {
    // unpack zero-terminated string packed into msg
    let slen = 0;
    for (let i = 0; i < msg.length; i++) {
      if (msg[i] === 0) {
        slen = i;
        break;
      }
    }
    if (slen < 1) return;
    let s = msg.toString();
    s = s.substr(0, slen);

    m_ForwardTrackerData(s);

    let d = new Date();
    console.log(d.toLocaleTimeString(), s);
  });

  // we're not expecting errors, but we should
  udp_socket.on('error', err => {
    console.log(...PR('UDP SOCKET ERROR', err));
  });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_BindPTrackForwarder() {
  // 2. CREATE BROWSER TCP SOCKET SERVER
  // create a websocket server to listen
  ptrack_ss = new WebSocketServer({ port: OUT_DPORT });

  // set connection handler
  ptrack_ss.on('connection', wsocket => {
    m_AddBrowserConnection(wsocket);
    // set close handler
    wsocket.once('close', () => {
      m_RemoveBrowserConnection(wsocket);
    });
  });

  // set error handler
  ptrack_ss.on('error', err => {
    console.log(...PR(`StartTrackerSystem socket server error: ${err}`));
  });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_BindFakeTrackListener() {
  ftrack_ss = new WebSocketServer({ port: IN_DPORT });

  // set connection handler
  ftrack_ss.on('connection', wsocket => {
    console.log(...PR(`${IN_DPORT} TrackDataInjector Connected`));
    ftrack_socket = wsocket;

    // set close handler
    ftrack_socket.once('close', () => {
      console.log(...PR(`${IN_DPORT} TrackDataInjector Closed`));
      ftrack_socket = null;
    });

    // set message handler (receive faketrack)
    ftrack_socket.on('message', json => {
      m_ForwardTrackerData(json);
    });
  });

  // set error handler
  ftrack_ss.on('error', err => {
    console.log(...PR(`TrackDataInjector socket server error:${err}`));
    ftrack_socket = null;
  });
}

/// API CONNECT TRACKER ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** create the UDP listener on 224.0.0.1:21234 and TCP forwarding socket
 *  on localhost:3030
 */
function StartTrackerSystem() {
  /** 1. CREATE UDP LISTENER TO PTRACK *********************************/

  // we sometimes attempt restart the server through gulp, and not all things
  if (!udp_socket) {
    m_BindPTrackListener();
    if (DBGTRK) console.log(...PR('PTrackListener UDP bound'));
  } else if (DBGTRK)
    console.log(...PR('PTrackListener UDP is already established'));

  /** 2. CREATE BROWSER TCP SOCKET SERVER ******************************/

  if (!ptrack_ss) {
    m_BindPTrackForwarder();
    if (DBGTRK) console.log(...PR('PTrackForwarder TCP bound'));
  } else if (DBGTRK)
    console.log(...PR('PTrackForwarder TCP is already established'));

  /** 3. CREATE FAKETRACK TCP SOCKET SERVER ****************************/

  if (!ftrack_ss) {
    m_BindFakeTrackListener();
    if (DBGTRK) console.log(...PR('FakeTrackListener TCP bound'));
  } else if (DBGTRK)
    console.log(...PR('FakeTrackListener TCP already established'));
} // StartTrackerSystem

/// API CLOSE TRACKER /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Close the tracker connection by attempting to close all connected
 *  web sockets. Called by our hacked-in mimosa server restart code.
 */
function StopTrackerSystem() {
  if (DBGTRK)
    console.log(...PR('INQCOMM detect server change, closing connections'));
  if (ptrack_sockets) {
    for (let i = 0; i < ptrack_sockets.length; i++) {
      let sobj = ptrack_sockets[i];
      sobj.socket.close();
    }
  }
  if (ptrack_ss) ptrack_ss.close();
  if (ftrack_socket) ftrack_socket.close();
  if (ftrack_ss) ftrack_ss.close();
}
/// API REMOVE BROWER CONNECTION //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Sometimes the ptrack socket 3030 does not disconnect when the socket
 *  drops. This will be called from URNET to manage
 */
function BrowserDisconnected(wsocket) {
  m_RemoveBrowserConnection(wsocket);
}

/// EXPORT MODULE API//////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  StartTrackerSystem,
  StopTrackerSystem,
  BrowserDisconnected
};
