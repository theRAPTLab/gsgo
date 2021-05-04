/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Server Message Handler - URNET Debug Utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { CFG_SVR_UADDR } = require('./ur-common');
const { SVR_HANDLERS, NET_HANDLERS } = require('./server-datacore');
const TERM = require('./util/prompts').makeTerminalOut(' URNET');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// const DBG = false;

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PKT_ServiceList(pkt) {
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
function PKT_Reflect(pkt) {
  const data = pkt.getData();
  data.serverSays = 'REFLECTING';
  data.stack = data.stack || [];
  data.stack.push(CFG_SVR_UADDR); // usually hardcoded to SVR_01
  TERM.warn('SRV_REFLECT setting data', data);
  return data;
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  PKT_ServiceList,
  PKT_Reflect
};
