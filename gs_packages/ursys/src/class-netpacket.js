/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable lines-between-class-members */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NetPacket objects are sent between the browser and server as part of the
  URSYS messaging system. NetMessages do not need addresses.

  This NetPacket declaration is SHARED in both node and browser javascript
  codebases.

  FEATURES

  * handles asynchronous transactions
  * works in both node and browser contexts
  * has an "offline mode" to suppress network messages without erroring

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// DEPENDENCIES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS = require('./util/prompts');
const {
  PRE_PACKET_ID,
  PRE_SVR_MESG,
  PACKET_TYPES,
  TRANSACTION_MODE,
  VALID_CHANNELS,
  CFG_SVR_UADDR
} = require('./ur-common');
const { GetNetworkOptions } = require('./ur-common');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = { send: false, transact: false, setup: false };

const PR = PROMPTS.makeStyleFormatter('PKT');
const ERR = ':ERR:';
const PERR = ERR + PR;
const ERR_NOT_NETMESG = `${PERR}obj does not seem to be a NetPacket`;
const ERR_BAD_PROP = `${PERR}property argument must be a string`;
const ERR_ERR_BAD_CSTR = `${PERR}constructor args are string, object`;
const ERR_BAD_SOCKET = `${PERR}sender object must implement send()`;
const ERR_DUPE_TRANS = `${PERR}this packet transaction is already registered!`;
const ERR_NO_GLOB_UADDR = `${PERR}packet sending attempted before UADDR is set!`;
const ERR_UNKNOWN_TYPE = `${PERR}packet type is unknown:`;
const ERR_NOT_PACKET = `${PERR}passed object is not a NetPacket`;
const ERR_UNKNOWN_RMODE = `${PERR}packet routine mode is unknown:`;

/// ONLINE/OFFLINE OPERATIONS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const M_INIT = 'init';
const M_ONLINE = 'online';
const M_STANDALONE = 'offline';
const M_CLOSED = 'closed';
const M_ERROR = 'error';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_id_counter = 0;
let m_id_prefix = PRE_PACKET_ID;
let m_netsocket = null;
let m_group_id = null;
let m_mode = M_INIT;
let m_transactions = new Map(); // keep track of returning packets

/// URSYS NETMESSAGE CLASS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Class NetPacket
 * Container for messages that can be sent across the network to the URSYS
 * server.
 * @typedef {Object} NetPacket
 * @property {string} msg - message
 * @property {Object} data - message data
 * @property {string} id - internal id
 * @property {string} type - packet operation type (1way,2way,sync)
 * @property {string} rmode - transaction direction
 * @property {string} memo - human-readable debug note space
 * @property {string} seqnum - sequence number for transaction
 * @property {Array} seqlog - array of seqnums, starting with originating address
 * @property {string} s_uid - originating browser internal endpoint
 * @property {string} s_uaddr - originating browser address
 * @property {string} s_group - group session key
 */
class NetPacket {
  /** constructor
   * @param {string|object} msg message name, or an existing plain object to coerce into a NetPacket
   * @param {Object} data data packet to send
   * @param {string} type the message (defined in PACKET_TYPES)
   */
  constructor(msg, data, type) {
    // OPTION 1
    // create NetPacket from (generic object)
    if (typeof msg === 'object' && data === undefined) {
      // make sure it has a msg and data obj
      if (typeof msg.msg !== 'string' || typeof msg.data !== 'object') {
        throw Error(ERR_NOT_NETMESG);
      }
      // merge properties into this new class instance and return it
      Object.assign(this, msg);
      this.seqlog = this.seqlog.slice(); // copy array
      m_SeqIncrement(this);
      return this;
    }
    // OPTION 2
    // create NetPacket from JSON-encoded string
    if (typeof msg === 'string' && data === undefined) {
      let obj = JSON.parse(msg);
      Object.assign(this, obj);
      m_SeqIncrement(this);
      return this;
    }
    // OPTION 3
    // create new NetPacket from scratch (mesg,data)
    // unique id for every NetPacket
    if (typeof type === 'string') m_CheckType(type);
    if (typeof msg !== 'string' || typeof data !== 'object') {
      throw Error(ERR_ERR_BAD_CSTR);
    }
    // allow calls with null data by setting to empty object
    this.data = data || {};
    this.msg = msg;
    // id and debugging memo support
    this.id = this.makeNewId();
    this.rmode = TRANSACTION_MODE[0]; // is default 'request' (trans request)
    this.type = type || PACKET_TYPES[0]; // is default 'msend' (no return)
    this.memo = '';
    // transaction support
    this.seqnum = 0; // positive when part of transaction
    this.seqlog = []; // transaction log
    // addressing support
    this.s_uaddr = NetPacket.SocketUADDR() || null; // first originating uaddr set by SocketSend()
    this.s_group = null; // session groupid is set by external module once validated
    this.s_uid = null; // first originating URCHAN srcUID
    // filtering support
  } // constructor

  /// ACCESSSOR METHODS ///////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.Type() returns the TRANSACTION_TYPE of this packet
   */
  getType() {
    return this.type;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.Type() returns true if type matches
   * @param {string} type the type to compare with the packet's type
   * @returns {boolean}
   */
  isType(type) {
    return this.type === type;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.SetType() sets the type of the packet. Must be a known type
   * in PACKET_TYPES
   */
  setType(type) {
    this.type = m_CheckType(type);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** returns the message string of form CHANNEL:MESSAGE, where CHANNEL:
   * is optional
   */
  getMessage() {
    return this.msg;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** returns MESSAGE without the CHANNEL: prefix. The channel (e.g.
   * NET, LOCAL, STATE) is also set true
   */
  getMessageParts() {
    return NetPacket.ExtractChannel(this.msg);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.Is() returns truthy value (this.data) if the passed msgstr
   *  matches the message associated with this NetPacket
   */
  sameMessageAs(msgstr) {
    return msgstr === this.msg ? this.data : undefined;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.IsServerMessage() is a convenience function return true if
   * server message */
  isServerMessage() {
    return this.msg.startsWith(PRE_SVR_MESG); // ur-common default NET:SRV_
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.SetMessage() sets the message field
   */
  setMessage(msgstr) {
    this.msg = msgstr;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.Data() returns the entire data payload or the property within
   * the data payload (can return undefined if property doesn't exist)
   */
  getData(prop) {
    if (!prop) return this.data;
    if (typeof prop === 'string') return this.data[prop];
    throw Error(ERR_BAD_PROP);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Convenience method to set data object entirely
   */
  setData(propOrVal, val) {
    if (typeof propOrVal === 'object') {
      this.data = propOrVal;
      return;
    }
    if (typeof propOrVal === 'string') {
      this.data[propOrVal] = val;
      return;
    }
    throw Error(ERR_BAD_PROP);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.Memo() returns the 'memo' field of the packet */
  getMemo() {
    return this.memo;
  }

  setMemo(memo) {
    this.memo = memo;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.JSON() returns a stringified JSON version of the packet. */
  json() {
    return JSON.stringify(this);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.SourceGroupId() return the session group id associated with
   * this packet.
   */
  getSourceGroupId() {
    return this.s_group;
  }

  /// TRANSACTION SUPPORT /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.SeqNum() returns a non-positive integer that is the number of
   * times this packet was reused during a transaction (e.g. 'mcall' types).
   */
  getSeqNum() {
    return this.seqnum;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.SourceAddress() returns the originating browser of the packet,
   * which is the socketname maintained by the URSYS server. It is valid only
   * after the URSYS server has received it, so it is invalid when a NetPacket
   * packet is first created.
   */
  getSourceAddress() {
    /*/ NOTE

        s_uaddr is the most recent sending browser.

        If a NetPacket packet is reused in a transaction (e.g. a call that returns
        data) then the originating browser is the first element in the transaction
        log .seqlog
    /*/
    // is this packet originating from server to a remote?
    if (this.s_uaddr === CFG_SVR_UADDR && !this.msg.startsWith(PRE_SVR_MESG)) {
      return this.s_uaddr;
    }
    // this is a regular message forward to remote handlers, returning
    // type 'res', seqlog > 1, seqlog[0] is not server
    return this.isTransaction() ? this.seqlog[0] : this.s_uaddr;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Return true if this pkt is from the server targeting remote handlers
   */
  isServerOrigin() {
    return this.getSourceAddress() === CFG_SVR_UADDR;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.CopySourceAddress() copies the source address of sets the
   * current address to the originating URSYS browser address. Used by server
   * forwarding and returning packets between remotes.
   * @param {NetPacket} pkt - the packet to copy source from
   */
  copySourceAddress(pkt) {
    if (pkt.constructor.name !== 'NetPacket') throw Error(ERR_NOT_PACKET);
    this.s_uaddr = pkt.getSourceAddress();
  }

  /// - - - - - - - - server- - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.Info() returns debug information about the packet
   * @param {string} key - type of debug info (always 'src' currently)
   * @returns {string} source browser + group (if set)
   */
  getInfo(key) {
    switch (key) {
      case 'src': /* falls-through */
      default:
        return this.getSourceGroupId()
          ? `${this.getSourceAddress()} [${this.getSourceGroupId()}]`
          : `${this.getSourceAddress()}`;
    }
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.MakeNewID() is a utility method that generates a unique id for
   * each NetPacket packet. When combined with s_uaddr and s_srcuid, this gives
   * a packet a unique ID across the entire URSYS network.
   * @returns {string} unique id
   */
  makeNewId() {
    let idStr = (++m_id_counter).toString();
    this.id = m_id_prefix + idStr.padStart(5, '0');
    return this.id;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.SocketSend() is a convenience method to let packets 'send
   * themselves' to the network via the URSYS server.
   * @param {Object=m_socket} socket - web socket object. m_socket
   * is defined only on browsers; see NetPacket.GlobalSetup()
   */
  socketSend(socket = m_netsocket) {
    if (m_mode === M_ONLINE || m_mode === M_INIT) {
      this.s_group = NetPacket.GlobalGroupID();
      let dst = socket.UADDR || 'unregistered socket';
      if (!socket) throw Error('SocketSend(sock) requires a valid socket');
      if (DBG.send) {
        let status = `sending '${this.getMessage()}' to ${dst}`;
        console.log(...PR(status));
      }
      // for server-side ws library, send supports a function callback
      // for WebSocket, this is ignored
      socket.send(this.json(), err => {
        if (err) console.error(`\nsocket ${socket.UADDR} reports error ${err}\n`);
      });
    } else if (m_mode !== M_STANDALONE) {
      console.log(PR, "SocketSend: Can't send because NetPacket mode is", m_mode);
    } else {
      console.warn(PR, 'STANDALONE MODE: SocketSend() suppressed!');
    }
    // FYI: global m_netsocket is not defined on server, since packets arrive on multiple sockets
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.PromiseTransaction() maps a packet to a return handler using a
   * unique key. This key allows an incoming packet to be mapped back to the
   * caller even if it is technically a different object received over the
   * network.
   * @param {Object=m_socket} socket - web socket object. m_socket is defined
   * only on browsers; see NetPacket.GlobalSetup()
   */
  transactionStart(socket = m_netsocket) {
    if (m_mode === M_STANDALONE) {
      console.warn(PR, 'STANDALONE MODE: PromiseTransaction() suppressed!');
      return Promise.resolve();
    }
    // global m_netsocket is not defined on server, since packets arrive on multiple sockets
    if (!socket) throw Error('PromiseTransaction(sock) requires a valid socket');
    // save our current UADDR
    this.seqlog.push(NetPacket.UADDR);
    let dbg = DBG.transact && !this.isServerMessage();
    let p = new Promise((resolve, reject) => {
      let hash = m_GetHashKey(this);
      if (m_transactions.has(hash)) {
        reject(Error(`${ERR_DUPE_TRANS}:${hash}`));
      } else {
        // save the resolve function in transactions table;
        // promise will resolve on remote invocation with data
        m_transactions.set(hash, data => {
          if (dbg) {
            const json = JSON.stringify(data);
            console.log(...PR('resolving promise with', json));
          }
          resolve(data);
        });
        this.socketSend(socket);
      }
    });
    return p;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.RoutingMode() returns the direction of the packet to a
   * destination handler (req) or back to the origin (res).  */
  getRoutingMode() {
    return this.rmode;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.IsRequest() returns true if this packet is one being sent
   * to a remote handler
   */
  isRequest() {
    return this.rmode === 'req';
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.IsResponse() returns true if this is a packet
   * being returned from a remote handler
   * @returns {boolean} true if this is a transaction response
   */
  isResponse() {
    return this.rmode === 'res';
    // more bulletproof check, but unnecessary
    // return this.rmove ==='res' && this.SourceAddress() === NetPacket.UADDR;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.IsTransaction() tests whether the packet is a response to a
   * call that was sent out previously.
   */
  isTransaction() {
    return (
      this.rmode !== 'req' &&
      this.seqnum > 0 &&
      this.seqlog[0] !== NetPacket.UADDR
    );
    /*
    return this.rmode !== 'req' &&
    this.seqnum > 0 &&
    this.seqlog[0] === NetMessage.UADDR;
    */
  }

  ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.ReturnTransaction() is used to send a packet back to its
   * origin. It saves the current browser address (stored in NetPacket.UADDR),
   * sets the direction of the packet, and puts it on the socket.
   * @param {Object=m_socket} socket - web socket object. m_socket is defined
   * only on browsers; see NetPacket.GlobalSetup()
   */
  transactionReturn(socket = m_netsocket) {
    // global m_netsocket is not defined on server, since packets arrive on multiple sockets
    if (!socket) throw Error('ReturnTransaction(sock) requires a valid socket');
    // note: seqnum is already incremented by the constructor if this was
    // a received packet
    // add this to the sequence log
    this.seqlog.push(NetPacket.UADDR);
    this.rmode = m_CheckRMode('res');
    this.socketSend(socket);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetPacket.CompleteTransaction() is called when a packet is received back
   * from the remote handler. At this point, the original caller needs to be
   * informed via the saved function handler created in
   * NetPacket.PromiseTransaction().
   */
  transactionComplete() {
    let dbg = DBG.transact && !this.isServerMessage();
    let hash = m_GetHashKey(this);
    let resolverFunc = m_transactions.get(hash);
    if (dbg) console.log(...PR('CompleteTransaction', hash));
    if (typeof resolverFunc !== 'function') {
      console.log(
        ...PR(
          `ERROR: transaction [${hash}] resolverFunction is type ${typeof resolverFunc}`,
          m_transactions.size
        )
      );
    } else {
      resolverFunc(this.data);
      m_transactions.delete(hash);
    }
  }
} // class NetPacket

/// STATIC CLASS METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetPacket.GlobalSetup() is a static method that initializes shared
 * parameters for use by all instances of the NetPacket class. It is used only
 * on browsers, which have a single socket connection.
 *
 * If no netsocket property is defined, then NetPacket instances will surpress
 * sending of network messages while allowing local messages to work normally.
 * See NetPacket.GlobalOfflineMode() for more information.
 * @function
 * @param {Object} [config] - configuration object
 * @param {Object} [config.netsocket] - valid websocket to URSYS server
 * @param {Object} [config.uaddr] - URSYS browser address
 */
NetPacket.GlobalSetup = (config = {}) => {
  let { uaddr, netsocket, peers, is_local } = config;
  if (uaddr) NetPacket.UADDR = uaddr;
  if (peers) NetPacket.PEERS = peers;
  if (netsocket) {
    // NOTE: m_netsocket is set only on clients since on server, there are
    // multiple sockets
    if (typeof netsocket.send !== 'function') throw Error(ERR_BAD_SOCKET);
    if (DBG.setup) console.log(...PR('GlobalSetup: netsocket set, mode online'));
    m_netsocket = netsocket;
    m_mode = M_ONLINE;
  }
  if (is_local) NetPacket.ULOCAL = is_local;
};
NetPacket.UADDR = 'UNASSIGNED';
NetPacket.ULOCAL = false; // set if connection is a local connection
NetPacket.PEERS = undefined;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetPacket.GlobalCleanup() is a static method called only by the client,
 * which drops the current socket and puts the app in 'closed' state. In
 * practice this call doesn't accomplish much, but is here for symmetry to
 * GlobalSetup().
 * @function
 */
NetPacket.GlobalCleanup = () => {
  if (m_netsocket) {
    if (DBG.setup)
      console.log(PR, 'GlobalCleanup: deallocating netsocket, mode closed');
    m_netsocket = null;
    m_mode = M_CLOSED;
    NetPacket.ULOCAL = false;
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Static method NetPacket.GlobalOfflineMode() explicitly sets the mode to STANDALONE, which
 * actively suppresses remote network communication without throwing errors.
 * It's used for static code snapshots of the webapp that don't need the
 * network.
 * @function
 */
NetPacket.GlobalOfflineMode = () => {
  m_mode = M_STANDALONE;
  if (m_netsocket) {
    console.log(...PR('STANDALONE MODE: NetPacket disabling network'));
    m_netsocket = null;
    let event = new CustomEvent('URSYSDisconnect', {});
    console.log(...PR('STANDALONE MODE: sending URSYSDisconnect'));
    document.dispatchEvent(event);
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetPacket.SocketUADDR() is a static method returning the class-wide setting
 * of the browser UADDR. This is only used on browser code.
 * @function
 * @returns {string} URSYS address of the current browser, a URSYS address
 */
NetPacket.SocketUADDR = () => {
  return NetPacket.UADDR;
};
NetPacket.Peers = () => {
  return NetPacket.PEERS;
};
NetPacket.IsLocalhost = () => {
  return NetPacket.ULOCAL;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetPacket.GlobalGroupID() is a static method returning the session key
 * (aka group-id) set for this browser instance
 * @function
 * @returns {string} session key
 */
NetPacket.GlobalGroupID = () => {
  return m_group_id;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetPacket.GlobalSetGroupID() is a static method that stores the passed
 * token as the GroupID
 * @function
 * @param {string} token - special session key data
 */
NetPacket.GlobalSetGroupID = token => {
  m_group_id = token;
};

/// PRIVATE CLASS HELPERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ DEPRECATE? Utility function to increment the packet's sequence number
 *  @param {NetPacket} pkt - packet to modify
/*/
function m_SeqIncrement(pkt) {
  pkt.seqnum++;
  return pkt;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Utility to create a unique hash key from packet information. Used by
 *  PromiseTransaction().
 *  @param {NetPacket} pkt - packet to use
 *  @return {string} hash key string
/*/
function m_GetHashKey(pkt) {
  let hash = `${pkt.getSourceAddress()}:${pkt.id}`;
  return hash;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Utility to ensure that the passed type is one of the allowed packet types.
 *  Throws an error if it is not.
 *  @param {string} type - a string to be matched against PACKET_TYPES
 *  @returns {string} the string that passed the type check
/*/
function m_CheckType(type) {
  if (type === undefined) {
    throw new Error(`must pass a type string, not ${type}`);
  }
  if (!PACKET_TYPES.includes(type)) throw Error(`${ERR_UNKNOWN_TYPE} '${type}'`);
  return type;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Utility to ensure the passed transaction mode is one of the allowed
 *  types. Throws an error if it is not.
 *  @param {string} mode - a string to be matched against TRANSACTION_MODE
 *  @returns {string} the string the passed the mode check
/*/
function m_CheckRMode(mode) {
  if (mode === undefined) {
    throw new Error(`must pass a mode string, not ${mode}`);
  }
  if (!TRANSACTION_MODE.includes(mode))
    throw Error(`${ERR_UNKNOWN_RMODE} '${mode}'`);
  return mode;
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NetPacket.CODE_OK = 0;
NetPacket.CODE_NO_MESSAGE = 1; // requested message doesn't exist
NetPacket.CODE_SOC_NOSOCK = -100;
NetPacket.CODE_SES_REQUIRE_KEY = -200; // access key not set
NetPacket.CODE_SES_REQUIRE_LOGIN = -201; // socket was not logged-in
NetPacket.CODE_SES_INVALID_KEY = -202; // provided key didn't match socket key
NetPacket.CODE_SES_RE_REGISTER = -203; // session attempted to login again
NetPacket.CODE_SES_INVALID_TOKEN = -204; // session attempted to login again
NetPacket.CODE_REG_DENIED = -300; // registration of handler denied
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// using CommonJS format on purpose for node compatibility
module.exports = NetPacket;
