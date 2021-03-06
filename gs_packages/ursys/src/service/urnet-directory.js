/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Server Message Handler - Directory Services

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { CFG_SVR_UADDR } = require('../ur-common');
const { SVR_HANDLERS, NET_HANDLERS } = require('../server-datacore');
const TERM = require('../util/prompts').makeTerminalOut(' URNET');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// const DBG = false;

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ServiceList(pkt) {
  TERM.warn('SRV_SERVICE_LIST got', pkt);
  const server = [...SVR_HANDLERS.keys()];
  const handlers = [...NET_HANDLERS.entries()];
  const clients = {};
  handlers.forEach(entry => {
    const [msg, set] = entry;
    const remotes = [...set.keys()];
    clients[msg] = remotes;
  });
  return { server, clients };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Reflect(pkt) {
  const data = pkt.Data();
  data.serverSays = 'REFLECTING';
  data.stack = data.stack || [];
  data.stack.push(CFG_SVR_UADDR); // usually hardcoded to SVR_01
  TERM.warn('SRV_REFLECT setting data', data);
  return data;
}

/// NETWORK STATE HELPERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return list of registered server handlers
 */
function m_ServiceList() {
  const serviceList = [...SVR_HANDLERS.keys()];
  return serviceList;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return list of clients and registered handlers
 */
function m_ClientList() {
  const handlerList = [...NET_HANDLERS.entries()];
  const clientsByMessage = {};
  handlerList.forEach(entry => {
    const [msg, set] = entry;
    const remotes = [...set.keys()];
    clientsByMessage[msg] = remotes;
  });
  return clientsByMessage;
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ServiceList,
  Reflect
};
