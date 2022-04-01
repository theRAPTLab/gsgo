/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  CLIENT-NETINFO centralizes shared data structures about URNET connection
  This is a pure data module that can be referenced by any URSYS client.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// DEBUG  ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = require('./util/prompts').makeStyleFormatter('UR.SES');
const { CFG_URNET_SERVICE } = require('./common/ur-constants');
const DATACORE = require('./client-datacore');

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
interface NetProps {
  broker: MessageBroker;
  client?: ConnectionInfo;
  build?: BuildInfo;
  urdb?: NetDB;
}
interface MessageBroker {
  host: string;
  port: number;
  uaddr: string;
  urnet_version: number;
}
interface ConnectionInfo {
  ip: string;
}
interface BuildInfo {
  branch: string;
}
interface NetDB {
  protocol: string; // http or https
  host: string;
  endpoint: string;
}

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let NET_BROKER: MessageBroker;
let CLIENT_INFO: ConnectionInfo;
let URDB_ENDPOINT: NetDB;
let BUILD_INFO: BuildInfo;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: check options passed to SystemNetBoot */
function m_CheckNetOptions(netOpt) {
  const { broker, client, urdb, build, ...other } = netOpt;
  const unknown = Object.keys(other);
  if (unknown.length) {
    console.log(...PR(`warn - L1_OPTION unknown param: ${unknown.join(', ')}`));
    throw Error('URSYS: bad option object');
  }
  // return true if there were no unknown option properties
  return unknown.length === 0;
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** props is coming from */
function SaveNetInfo(netInfo: NetProps) {
  if (DBG) console.log(...PR('saving netInfo for broker'), netInfo);
  const { broker, client, urdb, build } = netInfo;
  NET_BROKER = DATACORE.SaveBrokerInfo(broker); // make accessible
  CLIENT_INFO = DATACORE.SaveClientInfo(client);
  URDB_ENDPOINT = DATACORE.SaveDBInfo(urdb);
  BUILD_INFO = DATACORE.SaveBuildInfo(build);
  console.log(...PR(build));
  if (DBG)
    console.log(...PR('session broker', NET_BROKER, 'client info', CLIENT_INFO));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** connect to the appserver's netinfo webservice */
async function FetchNetInfo() {
  const response = await fetch(CFG_URNET_SERVICE);
  const netInfo = await response.json();
  if (m_CheckNetOptions(netInfo)) SaveNetInfo(netInfo);
  return netInfo;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetNetInfo() {
  return NET_BROKER;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetBuildInfo() {
  return BUILD_INFO;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetClientInfo() {
  return CLIENT_INFO;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetDBInfo() {
  return URDB_ENDPOINT;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetDBEndpoint() {
  return URDB_ENDPOINT;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  FetchNetInfo,
  SaveNetInfo,
  GetNetInfo,
  GetClientInfo,
  GetDBInfo,
  GetBuildInfo
};
