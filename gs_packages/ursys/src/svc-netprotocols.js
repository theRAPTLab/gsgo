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

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROTOCOL_MAP = new Map();

/// PROTOCOL HOST DEFINITION
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const uhost = {
  host: 'host ip',
  port: 'port number',
  uaddr: 'server-specific uaddr',
  ustats: {
    load: 'how loaded it is',
    clients: ['array of client endpoints by uaddr']
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

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  PKT_ProtocolDirectory
};
