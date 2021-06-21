/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  CLIENT-NETINFO centralizes shared data structures about URNET connection
  This is a pure data module that can be referenced by any URSYS client.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// DEBUG  ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = require('./util/prompts').makeStyleFormatter('UR.SES');
const { CFG_URNET_SERVICE } = require('./ur-common');
const DATACORE = require('./client-datacore');

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
interface NetProps {
  broker: MessageBroker;
  client?: { ip: string };
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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: check options passed to SystemNetBoot */
function m_CheckNetOptions(netOpt) {
  const { broker, client, urdb, ...other } = netOpt;
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
  const { broker, client, urdb } = netInfo;
  NET_BROKER = DATACORE.SaveBrokerInfo(broker); // make accessible
  CLIENT_INFO = DATACORE.SaveClientInfo(client);
  URDB_ENDPOINT = DATACORE.SaveDBInfo(urdb);
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
function GetClientInfo() {
  return CLIENT_INFO;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetDBInfo() {
  return URDB_ENDPOINT;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { FetchNetInfo, SaveNetInfo, GetNetInfo, GetClientInfo, GetDBInfo };
