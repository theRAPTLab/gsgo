/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  CLIENT-NETINFO centralizes shared data structures about URNET connection
  This is a pure data module that can be referenced by any URSYS client.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/**
 *  @module ClientSession
 */

/// DEBUG  ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = require('./util/prompts').makeStyleFormatter('UR.SES');

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
interface NetProps {
  broker: MessageBroker;
  client?: { ip: string }
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

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** props is coming from */
function SaveNetInfo(netInfo: NetProps) {
  if (DBG) console.log(...PR('saving netInfo for broker'), netInfo);
  const { broker, client } = netInfo;
  NET_BROKER = broker;
  CLIENT_INFO = client;
  if (DBG) console.log(...PR('session broker', NET_BROKER,'client info',CLIENT_INFO));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetNetInfo() {
  return NET_BROKER;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetClientInfo() {
  return CLIENT_INFO
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { SaveNetInfo, GetNetInfo, GetClientInfo };
