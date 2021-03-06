/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Server Message Handler - Session
  This is the old session manager which will be replaced with a different
  form of manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOGGER = require('./server-logger');
const { SocketLookup } = require('./server-datacore');
const NetPacket = require('./class-netpacket');
const TERM = require('./util/prompts').makeTerminalOut(' URNET');
const SESSION = require('./util/session-keys');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
function PKT_SessionLogin(pkt) {
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
function PKT_SessionLogout(pkt) {
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
function PKT_Session(pkt) {
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

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  PKT_SessionLogin,
  PKT_SessionLogout,
  PKT_Session
};
