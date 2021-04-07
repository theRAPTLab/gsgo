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
 *  saved from client-urnet { uaddr, srv_uaddr, isLocalServer }
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
  const uaddr = { CLIENT_UINFO };
  if (uaddr === undefined) throw Error('MyUADDR() called before UADDR set');
  return CLIENT_UINFO.uaddr;
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
function SaveDeviceSub(deviceBridge) {
  DEVICE_SUBS.set(DB_COUNT, deviceBridge);
  return DB_COUNT++;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DeleteDeviceSub(deviceBridgeNumber) {
  DEVICE_SUBS.delete(deviceBridgeNumber);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // NETWORK PARAMETERS
  SaveBrokerInfo,
  SaveClientInfo,
  MyUADDR,
  // URNET
  SetSharedEndPoints,
  GetSharedEndPoints,
  // DEVICES
  SaveDeviceSub,
  DeleteDeviceSub
};
