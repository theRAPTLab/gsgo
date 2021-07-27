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
const mqtt = require('mqtt');
const { PrefixUtil, DBG } = require('@gemstep/ursys/server');
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

/// mqtt injection socket (listen)
let mtrack_ss = null;

/// playback/record ptrack data support
let reader; // disabled
let writer; // disabled

// constants for packet update rate
let m_current_time = 0;

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
  if (DBG.track) {
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
    else if (DBG.track)
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
    if (DBG.track) console.log(...PR(`${IN_DPORT} TrackDataInjector Connected`));
    ftrack_socket = wsocket;

    // set close handler
    ftrack_socket.once('close', () => {
      if (DBG.track) console.log(...PR(`${IN_DPORT} TrackDataInjector Closed`));
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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

let m_seq = 0;

function ConvertMQTTtoTrackerData(message) {
  // pozyx seems to send only one tag per message, hence the [0]
  // message is a node Buffer object -- https://nodejs.org/api/buffer.html
  let json = JSON.parse(message.toString())[0];

  // console.log(json);

  // Wearable Tag Accelerometer Data
  // console.log(json.data.tagData.accelerometer);

  // Developer Tag data
  // const customSensors = json.data.tagData.customSensors;
  // if (customSensors) console.log(customSensors);

  // `alive` is no longer in message as of 2021-05-26 (new Enterprise system)
  // if (!json.alive) return;
  if (!json.success) {
    // Pozyx seems to send this when it can't detect the tag.
    // We might want to use this to remove tags?
    // It is a fairly common event though, so we'd have to detect
    // multiple events before clearing.
    // console.log("MQTT#### success:false!", json);
    return '';
  }
  if (!json.data) {
    // This shouldn't happen.  Should be caught by alive/success.
    console.log('MQTT#### json.data missing!', json);
    return '';
  }
  if (!json.data.coordinates) {
    // This shouldn't hapen.  Should be caught by alive/success.
    console.log('MQTT#### json.data.coordinates missing!', json);
    return '';
  }

  // get pozyx positions
  const id = json.tagId;
  const px = json.data.coordinates.x;
  const py = json.data.coordinates.y;
  let framedata = {
    id,
    x: px,
    y: py,
    z: 0,
    height: 1.4,
    isPozyx: true // mark the entity as Pozyx in case we need it later
  };

  // get accelerometer data if present
  // currently only available for wearable tags
  // might be possible for developer tag with custom payload
  if (
    json.data.tagData.accelerometer &&
    json.data.tagData.accelerometer.length > 0
  ) {
    // only grab the first acceleration frame -- we don't need more
    const aframe = json.data.tagData.accelerometer[0];
    if (aframe && aframe.length > 0) {
      const ax = aframe[0];
      const ay = aframe[1];
      const az = aframe[2];
      framedata.acc = {
        x: ax,
        y: ay,
        z: az
      };
      // console.log(id, framedata.acc);
    }
  }

  // update current time
  // FIXME: Should we use tag time?  Or should we inject current time here?
  m_current_time = new Date(); // json.timestamp;
  // calculate compatible timer format
  const sec = Math.floor(m_current_time / 1000);
  const nsec = (m_current_time - sec * 1000) * 1e6;
  //
  // pozyx-tagged time
  // This is the timestamp data in the mqtt message
  // m_current_time = json.timestamp; // e.g. 1622064766.2123475

  // frame
  let m_frame = {
    header: {},
    fake_tracks: [framedata]
  };
  m_frame.header.stamp = { sec, nsec };
  // FIXME: Masquerading as faketrack data for now.
  m_frame.header.frame_id = 'faketrack';
  m_frame.fake_id = 'pozyx'; // FIXME
  m_frame.header.seq = m_seq++;

  return JSON.stringify(m_frame);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_BindPozyxListener() {
  // Use this to test basic connection
  // mtrack_ss = mqtt.connect("mqtt://test.mosquitto.org", {
  // 	port: 1883,
  // });

  //UNCOMMENT THIS TO ALLOW LOCALHOST for the mqtt broker to run locallly (replay of pozyx streams)
  mtrack_ss = mqtt.connect('mqtt://localhost', { port: 1883 }); // Enterprise server "via uplink network" works

  //UNCOMMENT THIS FOR VU LAB
  //mtrack_ss = mqtt.connect('mqtt://10.2.191.28', { port: 1883 }); // Enterprise server "via uplink network" works

  // FIXME: Allow different hosts if Pozyx tracker is running on different machine.
  //        This is currently Ben's Campbell Enterprise server's "uplink network" IP
  //mtrack_ss = mqtt.connect('mqtt://10.1.10.185', { port: 1883 }); // Enterprise server "via uplink network" works
  // port 1883 is tcp (not udp)

  mtrack_ss.on('connect', () => {
    console.log(...PR('1883 MQTT Connect'));
    mtrack_ss.subscribe('presence', err => {
      if (!err) {
        console.log(...PR('MQTT present'));
      } else {
        console.log(...PR('MQTT Not Present!', err));
      }
    });
  });
  mtrack_ss.on('message', (topic, message) => {
    let jsonstr = ConvertMQTTtoTrackerData(message);
    if (jsonstr) m_ForwardTrackerData(jsonstr);
  });
  mtrack_ss.on('error', err => {
    console.log(...PR("Can't connect", err));
    mtrack_ss.end();
  });
  mtrack_ss.on('close', () => {
    console.log(...PR('MQTT Connection Closed'));
    mtrack_ss.end();
  });
  mtrack_ss.on('disconnect', () => {
    console.log(...PR('MQTT Disconnected'));
    mtrack_ss.end();
  });
  mtrack_ss.on('offline', () => {
    console.log(...PR('MQTT Offline'));
    mtrack_ss.end();
  });
  mtrack_ss.on('reconnect', () => {
    console.log(...PR('MQTT reconnect'));
  });

  mtrack_ss.subscribe('tags');
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
    if (DBG.track) console.log(...PR('PTrackListener UDP bound'));
  } else if (DBG.track)
    console.log(...PR('PTrackListener UDP is already established'));

  /** 2. CREATE BROWSER TCP SOCKET SERVER ******************************/

  if (!ptrack_ss) {
    m_BindPTrackForwarder();
    if (DBG.track) console.log(...PR('PTrackForwarder TCP bound'));
  } else if (DBG.track)
    console.log(...PR('PTrackForwarder TCP is already established'));

  /** 3. CREATE FAKETRACK TCP SOCKET SERVER ****************************/

  if (!ftrack_ss) {
    m_BindFakeTrackListener();
    if (DBG.track) console.log(...PR('FakeTrackListener TCP bound'));
  } else if (DBG.track)
    console.log(...PR('FakeTrackListener TCP already established'));

  /** 4. CREATE POZYX TCP SOCKET SERVER ****************************/

  if (!mtrack_ss) {
    m_BindPozyxListener();
    if (DBG.track) console.log(...PR('PozyxListener TCP bound'));
  } else if (DBG.track)
    console.log(...PR('PozyxListener TCP already established'));
} // StartTrackerSystem

/// API CLOSE TRACKER /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Close the tracker connection by attempting to close all connected
 *  web sockets. Called by our hacked-in mimosa server restart code.
 */
function StopTrackerSystem() {
  if (DBG.track)
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
  if (mtrack_ss) mtrack_ss.end();
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
