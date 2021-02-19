/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  standalone code ported from NetPacket
  this is sort of a state machine which works with NetPacket for URSYS
  clients that need to support an offline mode

  WIP

  There is a mirrored state in client-urnet  where a standalone mode is
  defined, so that probably needs to be centralized in one module.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const M_INIT = 'init'; // system not yet started
const M_ONLINE = 'online'; // system connectd to URNET
const M_STANDALONE = 'offline'; // system running 'standalone'
const M_CLOSED = 'closed'; // system was connected, but now is disconnected
const M_ERROR = 'error'; // some kind of error has occurred (unused)
// CLIENT-URNET DUPLICATE STATES
// const M0_INIT = 0;
// const M1_CONNECTING = 1;
// const M2_CONNECTED = 2;
// const M3_REGISTERED = 3;
// const M4_READY = 4;
// const M_STANDALONE = 5;

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_mode = M_INIT;

/// - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Online() {
  return m_mode === M_ONLINE || m_mode === M_INIT;
}
/// - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Standalone() {
  return m_mode === M_STANDALONE;
}
/// - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Error() {
  return !Online() && !Standalone();
}

/// NETPACKET DATA MOVE GLOBAL SETUP /////////////////////////////////////////
/// - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// original stored in NetPacket namespace, so it could be
/// retrieved by the class itself
/// UADDR, ULOCAL is set if is_local true, PEERS
/// original is called fom URNET.StartNetwork
/// - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this is called by the URNET startup routine */
function GlobalSetup(config) {
  let { uaddr, netsocket, peers, is_local } = config;
  // uaddr is either a server or client uaddr
  // netsocket is only set on client
  // peers is probably unused
  // this code also set the MODE for online, offline, etc
}
/** this is called by graceful URNET disconnect (which rarely happens) */
function GlobalCleanup() {
  // check if netsocket is set, meaning it's a client
  // set mode to M_CLOSED
  // uninitialize ULOCAL
}
/** this called to force an app into offline mode (aka standalone) */
function GlobalOfflineMode() {
  // mode M_STANDALONE
  // if netsocket set, then we want to kill the networking
  // event =  CustomEvent('URSYSDisconnect') an
  // document.dispatchEvent(event)
  // currentl SystemInit listns for this in GEMSRV
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // status
  Online,
  Standalone,
  Error,
  // setup
  GlobalSetup,
  GlobalCleanup,
  GlobalOfflineMode
};
