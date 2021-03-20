/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Server Message Handler

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { RegisterMessageList, NET_HANDLERS, DBG } = require('./server-datacore');
const NetPacket = require('./class-netpacket');
const TERM = require('./util/prompts').makeTerminalOut(' URNET');

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Handles URSYS REGISTRATION PACKETS from connecting clients. It is the first
 *  packet sent on successful socket connection. This can also be called
 *  at any time to COMPLETELY REPLACE the current entries.
 *  @param {NetPacket} pkt - NetPacket packet instance
 *  @return {Object} object with registered property containing array of message
 */
function PKT_RegisterHandler(pkt) {
  if (pkt.getMessage() !== 'NET:SRV_REG_HANDLERS')
    throw Error('not a registration packet');
  let uaddr = pkt.getSourceAddress();
  let { messages = [] } = pkt.getData();
  // make sure there's no sneaky attempt to subvert the system messages
  const filtered = messages.filter(msg => !msg.startsWith('NET:SRV'));
  if (filtered.length !== messages.length) {
    const error = `${uaddr} blocked from registering SRV message`;
    TERM(error);
    return { error, code: NetPacket.CODE_REG_DENIED };
  }
  let regd = [];
  // save message list, for later when having to delete
  RegisterMessageList(uaddr, messages);
  // add uaddr for each message in the list
  // NET_HANDLERS[mesg] contains a Set
  messages.forEach(msg => {
    let entry = NET_HANDLERS.get(msg);
    if (!entry) {
      entry = new Set();
      NET_HANDLERS.set(msg, entry);
    }
    if (DBG.reg) TERM(`${uaddr} regr '${msg}'`);
    entry.add(uaddr);
    regd.push(msg);
  });
  return { registered: regd };
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  PKT_RegisterHandler
};
