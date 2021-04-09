/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS default configuration

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const CFG_URNET_VERSION = 3;

/// URNET DEFAULT VALUES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const CFG_URNET_SERVICE = '/urnet/netinfo'; // route to urnet connection info
const CFG_URNET_PORT = 2929;
const PRE_UADDR_ID = 'UADDR'; // client addresses all start with this string
const CFG_SVR_UADDR = 'SVR_01'; // the main server UADDR is this
const PRE_UDEVICE_ID = 'UDEV';
/// URNET CONSTANTS & MESSAGES ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PRE_SYS_MESG = 'NET:SYSTEM'; // system messages begin with this (deprecated?)
const PRE_SVR_MESG = 'NET:SRV_'; // all server services begin with this string

/// NETPACKET /////////////////////////////////////////////////////////////////
/// - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PRE_PACKET_ID = 'PKT'; // packet ids beging with this string
const PACKET_TYPES = [
  'msend', // a 'send' message returns no data
  'msig', // a 'signal' message is a send that calls all handlers everywhere
  'mcall', // a 'call' message returns data
  'state' // (unimplemented) a 'state' message is used by a state manager
];
const TRANSACTION_MODE = [
  'req', // packet in initial 'request' mode
  'res' // packet in returned 'response' mode
];
const VALID_CHANNELS = ['LOCAL', 'NET', 'SVR', 'STATE']; // is all channels in list

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility to generate the official unique hash for packets in URSYS
 */
function PacketHash(pkt) {
  return `${pkt.getSourceAddress()}:${pkt.id}`;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // URNET
  CFG_URNET_SERVICE,
  CFG_URNET_VERSION,
  CFG_URNET_PORT,
  CFG_SVR_UADDR,
  PRE_SYS_MESG,
  PRE_UADDR_ID,
  PRE_UDEVICE_ID,
  PacketHash, // function
  // NETPACK
  PRE_PACKET_ID,
  PRE_SVR_MESG,
  PACKET_TYPES,
  TRANSACTION_MODE,
  VALID_CHANNELS
};
