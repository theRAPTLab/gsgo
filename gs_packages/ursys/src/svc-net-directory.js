/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Server Message Handler - URNET directory services

  A protocol consists of the type of service that uses a particular websocket
  data format. For 'message' protocol (our existing messaging system), it
  uses the NetMessage packet format. NetMessage packets can also be used
  for protocols that are message based. Services that require more efficient
  data encoding will use whatever it needs.

  The unique identifier used across all protocols and devices is the UADDR
  even for services that don't rely on messages.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = require('./util/prompts').makeTerminalOut(' URNET');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// const DBG = false;

/// DUMMY DATA DEFINITION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// DEVICE DEFINITION
const uaddr = 'address'; // assigned URNET address (sent by server)
const uuid = 'uniqueid'; // device identifier unique id (sent by client)
const uname = 'device name'; // device identifier non-unique name (sent by client)
const uauth = 'jwtoken'; // auth request based on student info (sent by client)

/// PROTOCOL HOST DEFINITION
const uhost = {
  host: 'host ip',
  port: 'port number',
  uaddr: 'server-specific uaddr',
  ustats: {
    load: 'how loaded it is',
    clients: ['array of client endpoints by uaddr']
  }
};
/// CLIENT DEVICE DEFINITIONS
const udevice = {
  uaddr,
  uuid,
  uname,
  student: {
    sid: 'information about the student',
    sname: 'student name',
    groups: { groupA: true, groupB: false },
    roles: { roleA: true, roleB: false }
  }
};

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns a map of available protocols and the servers that are accepting
 *  service requests via URNET message. This is maintained by all URSYS client
 *  devices behind the scenes. The pkt must include a uident that determines
 *  what protocols it is allowed to access with a follow-up websocket connection
 *  using the same uident
 */
function PKT_ProtocolDirectory(pkt) {
  console.log('returning dummy protocol directory', pkt.getInfo());

  const hosts = {
    // protocols that are accessible by this uident on the URNET
    // they are all considered part of ONE BIG WEB APP
    // note: each protocol implements its own datastream format
    // note: multiple protocols can be handled by a particular uaddr
    // note: protocolHosts are returned sorted by suggestion quality
    protocolHosts: {
      'message': [uhost], // list of URNET message brokers
      'track': [uhost], // list of PTRACK-style data sources
      // proposed protocols
      'file': [uhost], // list of file save and request
      'db': [uhost], // list of database service
      'log': [uhost], // list of logging utility
      'netstate': [uhost], // shared synchronized state
      'simview': [uhost], // display object host
      'simdata': [uhost], // simulation data
      'siminput': [uhost], // input host
      'simcontrol': [uhost], // simulation controller
      'simrecord': [uhost], // session record / playback
      'video': [uhost], // video streaming out
      'chat': [uhost], // chat host
      'asset': [uhost], // asset host
      'udpfwd': [uhost] // UDP-to-TCP bridge service
    }
  };
  return hosts;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns a map of all client devices which are reachable within the current
 *  URNET segment.
 *  The pkt must include the uident, which will be used
 *  to filter the returned map by access privilege
 */
function PKT_DeviceDirectory(pkt) {
  console.log('returning dummy uaddr directory', pkt.getInfo());

  // return data
  const devices = {
    // confirmation of uident for debugging purposes
    uaddrs: {
      uaddrA: udevice,
      uaddrB: udevice
    },
    protocolDevices: {
      'message': [uaddr, uaddr, uaddr],
      'track': [uaddr],
      'file': [uaddr, uaddr, uaddr],
      'db': [uaddr],
      'log': [uaddr, uaddr, uaddr],
      'netstate': [uaddr, uaddr, uaddr],
      'simview': [uaddr, uaddr, uaddr],
      'simdata': [uaddr, uaddr, uaddr],
      'siminput': [uaddr, uaddr, uaddr],
      'simcontrol': [uaddr, uaddr, uaddr],
      'simrecord': [uaddr, uaddr, uaddr],
      'video': [uaddr, uaddr, uaddr],
      'chat': [uaddr, uaddr, uaddr],
      'asset': [uaddr, uaddr, uaddr],
      'udpfwd': [uaddr, uaddr, uaddr]
    }

    // udevices by name, uaddr, and protocols
  };
  return devices;
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  PKT_ProtocolDirectory,
  PKT_DeviceDirectory
};
