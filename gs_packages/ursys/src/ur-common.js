/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS default configuration-related stuff

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const CFG_URNET_VERSION = 3;

/// URNET DEFAULT VALUES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// URNET ROOT ACCESS
const CFG_URNET_SERVICE = '/urnet/netinfo'; // route to urnet connection info
const CFG_URNET_PORT = 2929;
const PRE_UADDR_ID = 'UADDR_'; // client addresses all start with this string
const CFG_SVR_UADDR = 'SVR_01'; // the main server UADDR is this
const PRE_UDEVICE_ID = 'UDEV_';
/// URNET WIDE DB ACCESS
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const CFG_URDB_GQL = '/urnet/urdb'; // route to graphql instance

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

/// ENVIRONMENT DETECTION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsNode() {
  return typeof window === 'undefined';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsBrowser() {
  return typeof window !== 'undefined';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsElectronRenderer() {
  return (
    typeof window !== 'undefined' &&
    typeof window.process === 'object' &&
    window.process.type === 'renderer'
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsElectronMain() {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    !!process.versions.electron
  );
}
function IsElectron() {
  return IsElectronMain() || IsElectronRenderer();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // URNET
  CFG_URNET_SERVICE,
  CFG_URNET_VERSION,
  CFG_URNET_PORT,
  CFG_SVR_UADDR,
  CFG_URDB_GQL,
  PRE_SYS_MESG,
  PRE_UADDR_ID,
  PRE_UDEVICE_ID,
  PacketHash, // function
  // NETPACK
  PRE_PACKET_ID,
  PRE_SVR_MESG,
  PACKET_TYPES,
  TRANSACTION_MODE,
  VALID_CHANNELS,
  // ENVIRONMENT
  IsBrowser,
  IsNode,
  IsElectron,
  IsElectronRenderer,
  IsElectronMain
};
