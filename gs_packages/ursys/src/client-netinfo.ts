/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  CLIENT-NETINFO centralizes shared data structures about URNET connection
  This is a pure data module that can be referenced by any URSYS client.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// DEBUG  ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = require('./util/prompts').makeStyleFormatter('UR.SES');
const { CFG_URNET_SERVICE } = require('./ur-common');

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
interface NetProps {
  broker: MessageBroker;
  client?: { ip: string };
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

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let NET_BROKER: MessageBroker;
let CLIENT_INFO: ConnectionInfo;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: check options passed to SystemNetBoot */
function m_CheckNetOptions(netOpt) {
  const { broker, client, ...other } = netOpt;
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
  const { broker, client } = netInfo;
  NET_BROKER = broker;
  CLIENT_INFO = client;
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

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { FetchNetInfo, SaveNetInfo, GetNetInfo, GetClientInfo };
