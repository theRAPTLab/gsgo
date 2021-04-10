/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  client datacore - a pure data module for server-side ursys operations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const $$ = require('./ur-common');

/// URNET MESSAGING SYSTEM ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let BROKER_UINFO = {};
let CLIENT_UINFO = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** saved from client-netinfo { host, port, uaddr, urnet_version } */
function SaveBrokerInfo(info) {
  if (info === undefined) throw Error('SaveBrokerInfo got undefined parameter');
  Object.keys(info).forEach(prop => {
    if (BROKER_UINFO[prop]) console.log('overwriting broker info', prop);
    BROKER_UINFO[prop] = info[prop];
  });
  return BROKER_UINFO;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** saved from client-netinfo { ip }
 *  saved from client-urnet registration { uaddr, srv_uaddr, isLocalServer }
 *  saved from index-client SystemStart { uapp }
 */
function SaveClientInfo(info) {
  if (info === undefined) throw Error('SaveClientInfo got undefined parameter');
  Object.keys(info).forEach(prop => {
    if (CLIENT_UINFO[prop]) console.log('overwriting client info', prop);
    CLIENT_UINFO[prop] = info[prop];
  });
  return CLIENT_UINFO;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MyUADDR() {
  const { uaddr } = CLIENT_UINFO;
  if (uaddr === undefined) throw Error('MyUADDR() called before uaddr set');
  return uaddr;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MyAppPath() {
  const { uapp } = CLIENT_UINFO;
  if (uapp === undefined) throw Error('MyAppPath() called before uapp set');
  return uapp;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MyAppServerPort() {
  return window.location.port || 80;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MyAppServerHostname() {
  return window.location.hostname;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MyNetBrokerInfo() {
  return BROKER_UINFO;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MyNetBroker() {
  return BROKER_UINFO.host;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ConnectionString() {
  const { host } = BROKER_UINFO;
  const port = window.location.port;
  let str = `${MyUADDR()} ⇆ ${host}`;
  if (port) str += `:${port}`;
  return str;
}

/// ENDPOINT DATA STRUCTURES //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let LocalNode;
let NetNode;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SetSharedEndPoints(eps) {
  LocalNode = eps.LocalNode;
  NetNode = eps.NetNode;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetSharedEndPoints() {
  return { LocalNode, NetNode };
}

/// DEVICE BRIDGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DEVICE_SUBS = new Map();
let DB_COUNT = 0;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a device bridge has three named function properties (defined in
 *  client-netdevices as TDeviceSelector)
 *  selectify: udevice => true|falase
 *  quantify:  udeviceList => deviceList
 *  notify:    (added,updated,removed) => voic
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a device subscription saves a "device bridge" when it's received from the
 *  device connector. It's called by client-netdevices SubscribeDevice() which
 *  is exported from UR client.
 *  returns a function to delete the subscription
 */
function SaveDeviceSub(deviceBridge) {
  DEVICE_SUBS.set(DB_COUNT, deviceBridge);
  return function DeleteDeviceSub() {
    console.log('deleting device sub', DB_COUNT);
    DEVICE_SUBS.delete(DB_COUNT);
  };
}
/// DEVICE DEFINITION & CREATION //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DEVICE_DECLARATIONS = new Map();
let DEVICE_COUNT = 0;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DeclareNewDevice(udevice) {
  const { PRE_UADDR_ID, PRE_UDEVICE_ID } = $$;
  const base_id = `${PRE_UDEVICE_ID}${MyUADDR().slice(PRE_UADDR_ID.length)}`;
  const udid = `${base_id}:${DEVICE_COUNT++}`;
  udevice.udid = udid;
  DEVICE_DECLARATIONS.set(udid, udevice);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // NETWORK PARAMETERS
  SaveBrokerInfo,
  SaveClientInfo,
  MyUADDR,
  MyAppPath,
  MyAppServerHostname,
  MyAppServerPort,
  MyNetBrokerInfo,
  MyNetBroker,
  ConnectionString,
  // URNET
  SetSharedEndPoints,
  GetSharedEndPoints,
  // DEVICES
  SaveDeviceSub,
  DeclareNewDevice
};
