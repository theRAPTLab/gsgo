/* eslint-disable no-restricted-syntax */
const LOGGER = require('./server-logger');
const { CFG_SVR_UADDR } = require('./ur-common');
const {
  RegisterMessageList,
  SVR_HANDLERS,
  NET_HANDLERS,
  SocketLookup
} = require('./server-datacore');
const NetPacket = require('./class-netpacket');
const SESSION = require('./util/session-keys');
const TERM = require('./util/prompts').makeTerminalOut(' URNET');

const DBG = false;

/// SERVER MESSAGE HANDLERS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Handles URSYS REGISTRATION PACKETS from connecting clients. It is the first
 * packet sent on successful socket connection.
 * @param {NetPacket} pkt - NetPacket packet instance
 * @return {Object} object with registered property containing array of message
 */
function RegisterRemoteHandlers(pkt) {
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
    if (DBG.client) TERM(`${uaddr} regr '${msg}'`);
    entry.add(uaddr);
    regd.push(msg);
  });
  return { registered: regd };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Handle SESSION LOGIN packets. A key is generated based on the provided
 * user token and socket address, and stored in the client socket. This should
 * ensure that keys can not be reused by other socket connections or multiple
 * logins using the same token.
 *
 * @param {NetPacket} pkt - NetPacket packet instance
 * @param {Object} pkt.data - data payload
 * @param {String} pkt.data.token - hashed session info
 * @return {Object} returned data payload
 */
function SessionLogin(pkt) {
  if (pkt.getMessage() !== 'NET:SRV_SESSION_LOGIN')
    throw Error('not a session login packet');
  const uaddr = pkt.getSourceAddress();
  const sock = SocketLookup(uaddr);
  if (!sock) throw Error(`uaddr '${uaddr}' not associated with a socket`);
  if (sock.USESS) {
    const error = `socket '${uaddr}' already has a session '${JSON.stringify(
      sock.USESS
    )}'`;
    return { error, code: NetPacket.CODE_SES_RE_REGISTER };
  }
  const { token } = pkt.getData();
  if (!token || typeof token !== 'string')
    return { error: 'must provide token string' };
  const decoded = SESSION.DecodeToken(token);
  if (!decoded.isValid) {
    const error = `token '${token}' is not valid`;
    return { error, code: NetPacket.CODE_SES_INVALID_TOKEN };
  }
  const key = SESSION.MakeAccessKey(token, uaddr);
  sock.USESS = decoded;
  sock.UKEY = key;
  if (DBG.client) TERM(`${uaddr} user log-in '${decoded.token}'`);
  LOGGER.Write(sock.UADDR, 'log-in', decoded.token);
  return { status: 'logged in', success: true, token, uaddr, key };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Handle SESSION LOGOUT packets
 *
 * @param {NetPacket} pkt - NetPacket packet instance
 * @param {Object} pkt.data - data payload
 * @param {String} pkt.data.token - hashed session info
 * @return {Object} returned data payload
 */
function SessionLogout(pkt) {
  if (pkt.getMessage() !== 'NET:SRV_SESSION_LOGOUT')
    throw Error('not a session logout packet');
  const uaddr = pkt.getSourceAddress();
  const sock = SocketLookup(uaddr);
  const { key } = pkt.getData();
  if (sock.UKEY !== key)
    return { error: `uaddr '${uaddr}' key '${key}'!=='${sock.UKEY}'` };
  if (DBG.client) TERM(`${uaddr} user logout '${sock.USESS.token}'`);
  if (sock.USESS) LOGGER.Write(sock.UADDR, 'logout', sock.USESS.token);
  sock.UKEY = undefined;
  sock.USESS = undefined;
  return { status: 'logged out', success: true };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return a session object based on the passed packet's stored credentials
 */
function Session(pkt) {
  const uaddr = pkt.getSourceAddress();
  const sock = SocketLookup(uaddr);
  if (!sock) {
    const error = `${uaddr} impossible socket lookup failure`;
    TERM(error);
    return { error, code: NetPacket.CODE_SOC_NOSOCK };
  }
  const { key } = pkt.Data();
  if (sock.ULOCAL) {
    if (DBG.client) TERM(`${uaddr} is localhost so bypass key check`);
    return { localhost: true };
  }
  if (!key) {
    const error = `${uaddr} access key is not set`;
    if (DBG.client) TERM(error);
    return { error, code: NetPacket.CODE_SES_REQUIRE_KEY };
  }
  const evil_backdoor = SESSION.AdminPlaintextPassphrase();
  if (key === evil_backdoor) {
    // do some hacky bypassing...yeep
    if (!sock.USESS) {
      const warning = `non-localhost admin '${evil_backdoor}' logged-in`;
      LOGGER.Write(uaddr, warning);
      TERM(`${uaddr} WARN ${warning}`);
      const adminToken = SESSION.MakeToken('Admin', {
        groupId: 0,
        classroomId: 0
      });
      sock.USESS = SESSION.DecodeToken(adminToken);
      sock.UKEY = key;
    }
  }
  if (!sock.USESS) {
    const error = `sock.${uaddr} is not logged-in`;
    if (DBG.client) TERM(`${uaddr} is not logged-in`);
    return { error, code: NetPacket.CODE_SES_REQUIRE_LOGIN };
  }
  if (key !== sock.UKEY) {
    if (DBG.client) {
      TERM(
        `Session: sock.${uaddr} keys do not match packet '${sock.UKEY}' '${key}'`
      );
    }
    const error = `sock.${uaddr} access keys do not match '${sock.UKEY}' '${key}'`;
    return { error, code: NetPacket.CODE_SES_INVALID_KEY };
  }
  // passes all tests, so its good!
  return sock.USESS;
}

function Reflect(pkt) {
  const data = pkt.Data();
  data.serverSays = 'REFLECTING';
  data.stack = data.stack || [];
  data.stack.push(CFG_SVR_UADDR); // usually hardcoded to SVR_01
  TERM.warn('SRV_REFLECT setting data', data);
  return data;
}
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

module.exports = {
  RegisterRemoteHandlers,
  SessionLogin,
  SessionLogout,
  Session,
  Reflect,
  ServiceList
};
