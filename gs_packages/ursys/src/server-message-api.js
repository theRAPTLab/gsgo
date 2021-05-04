/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  server-side URNET client - API for subscribing/publishing messages with
  remotes

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const NetPacket = require('./class-netpacket');
const { SVR_HANDLERS, RemoteHandlerPromises, DBG } = require('./server-datacore');
const TERM = require('./util/prompts').makeTerminalOut(' URNET');

/// CONSTANTS * DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// SERVER-SIDE MESSAGING API /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Registers SERVER-side message handlers that are reachable from remote
 * clients. Server-side handlers use their own map.
 * @param {string} mesgName message to register a handler for
 * @param {function} handlerFunc function receiving 'data' object
 */
function UR_HandleMessage(mesgName, handlerFunc) {
  if (typeof handlerFunc !== 'function') {
    TERM(`${mesgName} subscription failure`);
    throw Error('arg2 must be a function');
  }
  let handlers = SVR_HANDLERS.get(mesgName);
  if (!handlers) {
    handlers = new Set();
    SVR_HANDLERS.set(mesgName, handlers);
  }
  handlers.add(handlerFunc);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Revokes a handler function from a registered message. The handler function
 * object must be the same one used to register it.
 * @param {string} mesgName message to unregister a handler for
 * @param {function} handlerFunc function originally registered
 */
function UR_UnhandleMessage(mesgName, handlerFunc) {
  if (mesgName === undefined) {
    SVR_HANDLERS.clear();
  } else if (handlerFunc === undefined) {
    SVR_HANDLERS.delete(mesgName);
  } else {
    const handlers = SVR_HANDLERS.get(mesgName);
    if (handlers) {
      handlers.delete(handlerFunc);
    }
  }
  return this;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Server-side method for invoking a remote message. It executes asynchronously
 * but uses async/await so it can be used in a synchronous style to retrieve
 * values.
 * @param {string} mesgName message to unregister a handler for
 * @param {function} handlerFunc function originally registered
 * @return {Array<Object>} array of returned data items
 */
async function UR_CallMessage(mesgName, data) {
  let pkt = new NetPacket(mesgName, data);
  let promises = RemoteHandlerPromises(pkt);
  if (DBG.call)
    TERM(
      `${pkt.getInfo()} NETCALL ${pkt.getMessage()} to ${promises.length} remotes`
    );
  /// MAGICAL ASYNC/AWAIT BLOCK ///////
  const results = await Promise.all(promises);
  /// END MAGICAL ASYNC/AWAIT BLOCK ///
  // const result = Object.assign({}, ...resArray);
  return results; // array of data objects
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Server-side method for sending a remote message. It fires the messages but
 * doesn't do anything with the returned promises. Use for notifying remote
 * message handlers.
 * @param {string} mesgName message to unregister a handler for
 * @param {function} handlerFunc function originally registered
 */
function UR_SendMessage(mesgName, data, type = 'msend') {
  let pkt = new NetPacket(mesgName, data, type);
  let promises = RemoteHandlerPromises(pkt);
  // we don't care about waiting for the promise to complete
  if (DBG.call)
    TERM(
      `${pkt.getInfo()} ${type.toUpperCase()} ${pkt.getMessage()} to ${
        promises.length
      } remotes`
    );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Alias for NetSend(), kept for conceptual symmetry to the client-side URSYS
 * interface. It is not needed because the server never mirrors NetSend to
 * itself for signaling purposes.
 * @param {string} mesgName message to unregister a handler for
 * @param {function} handlerFunc function originally registered
 */
function UR_RaiseMessage(mesgName, data) {
  UR_SendMessage(mesgName, data, 'msig');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Server-side local server publishing. It executes synchronously, unlike the
 *  remote version. Doesn't return values.
 */
function UR_LocalSignal(mesgName, data) {
  const handlers = SVR_HANDLERS.get(mesgName);
  if (!handlers) return;
  const results = [];
  handlers.forEach(hFunc => {
    results.push(hFunc(data));
  });
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  UR_HandleMessage,
  UR_UnhandleMessage,
  UR_CallMessage,
  UR_SendMessage,
  UR_RaiseMessage,
  UR_LocalSignal
};
