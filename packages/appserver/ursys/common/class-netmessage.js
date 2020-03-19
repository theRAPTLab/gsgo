/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NetMessage objects are sent between the browser and server as part of the
  URSYS messaging system. NetMessages do not need addresses.

  This NetMessage declaration is SHARED in both node and browser javascript
  codebases.

  FEATURES

  * handles asynchronous transactions
  * works in both node and browser contexts
  * has an "offline mode" to suppress network messages without erroring

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// DEPENDENCIES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS = require('../../config/prompts');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = { send: false, transact: false, setup: false };

const PR = PROMPTS.Pad('PKT');
const ERR = ':ERR:';
const ERR_NOT_NETMESG = `${ERR + PR}obj does not seem to be a NetMessage`;
const ERR_BAD_PROP = `${ERR + PR}property argument must be a string`;
const ERR_ERR_BAD_CSTR = `${ERR + PR}constructor args are string, object`;
const ERR_BAD_SOCKET = `${ERR + PR}sender object must implement send()`;
const ERR_DUPE_TRANS = `${ERR + PR}this packet transaction is already registered!`;
const ERR_NO_GLOB_UADDR = `${ERR + PR}packet sending attempted before UADDR is set!`;
const ERR_UNKNOWN_TYPE = `${ERR + PR}packet type is unknown:`;
const ERR_NOT_PACKET = `${ERR + PR}passed object is not a NetMessage`;
const ERR_UNKNOWN_RMODE = `${ERR + PR}packet routine mode is unknown:`;

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const M_INIT = 'init';
const M_ONLINE = 'online';
const M_STANDALONE = 'offline';
const M_CLOSED = 'closed';
const M_ERROR = 'error';
const VALID_CHANNELS = ['LOCAL', 'NET', 'STATE']; // * is all channels in list

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_id_counter = 0;
let m_id_prefix = 'PKT';
let m_transactions = {};
let m_netsocket = null;
let m_group_id = null;
let m_mode = M_INIT;

/// ENUMS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PACKET_TYPES = [
  'msend', // a 'send' message returns no data
  'msig', // a 'signal' message is a send that calls all handlers everywhere
  'mcall', // a 'call' message returns data
  'state' // (unimplemented) a 'state' message is used by a state manager
];
const TRANSACTION_MODE = [
  'req', // packet in initial 'request' mode
  'res' // packet in returned 'response' mode
];

/// URSYS NETMESSAGE CLASS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Class NetMessage
 * Container for messages that can be sent across the network to the URSYS
 * server.
 * @typedef {Object} NetMessage
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
class NetMessage {
  /** constructor
   * @param {string|object} msg message name, or an existing plain object to coerce into a NetMessage
   * @param {Object} data data packet to send
   * @param {string} type the message (defined in PACKET_TYPES)
   */
  constructor(msg, data, type) {
    // OPTION 1
    // create NetMessage from (generic object)
    if (typeof msg === 'object' && data === undefined) {
      // make sure it has a msg and data obj
      if (typeof msg.msg !== 'string' || typeof msg.data !== 'object') {
        throw ERR_NOT_NETMESG;
      }
      // merge properties into this new class instance and return it
      Object.assign(this, msg);
      this.seqlog = this.seqlog.slice(); // copy array
      m_SeqIncrement(this);
      return this;
    }
    // OPTION 2
    // create NetMessage from JSON-encoded string
    if (typeof msg === 'string' && data === undefined) {
      let obj = JSON.parse(msg);
      Object.assign(this, obj);
      m_SeqIncrement(this);
      return this;
    }
    // OPTION 3
    // create new NetMessage from scratch (mesg,data)
    // unique id for every NetMessage
    if (typeof type === 'string') m_CheckType(type);
    if (typeof msg !== 'string' || typeof data !== 'object') {
      throw ERR_ERR_BAD_CSTR;
    }
    // allow calls with null data by setting to empty object
    this.data = data || {};
    this.msg = msg;
    // id and debugging memo support
    this.id = this.MakeNewID();
    this.rmode = TRANSACTION_MODE[0]; // is default 'request' (trans request)
    this.type = type || PACKET_TYPES[0]; // is default 'msend' (no return)
    this.memo = '';
    // transaction support
    this.seqnum = 0; // positive when part of transaction
    this.seqlog = []; // transaction log
    // addressing support
    this.s_uaddr = NetMessage.SocketUADDR() || null; // first originating uaddr set by SocketSend()
    this.s_group = null; // session groupid is set by external module once validated
    this.s_uid = null; // first originating ULINK srcUID
    // filtering support
  } // constructor

  /// ACCESSSOR METHODS ///////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.Type() returns the TRANSACTION_TYPE of this packet
   */
  Type() {
    return this.type;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.Type() returns true if type matches
   * @param {string} type the type to compare with the packet's type
   * @returns {boolean}
   */
  IsType(type) {
    return this.type === type;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.SetType() sets the type of the packet. Must be a known type
   * in PACKET_TYPES
   */
  SetType(type) {
    this.type = m_CheckType(type);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** returns the message string of form CHANNEL:MESSAGE, where CHANNEL:
   * is optional
   */
  Message() {
    return this.msg;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** returns MESSAGE without the CHANNEL: prefix. The channel (e.g.
   * NET, LOCAL, STATE) is also set true
   */
  DecodedMessage() {
    return NetMessage.ExtractChannel(this.msg);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.Is() returns truthy value (this.data) if the passed msgstr
   *  matches the message associated with this NetMessage
   */
  Is(msgstr) {
    return msgstr === this.msg ? this.data : undefined;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.IsServerMessage() is a convenience function return true if
   * server message */
  IsServerMessage() {
    return this.msg.startsWith('NET:SRV_');
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.SetMessage() sets the message field
   */
  SetMessage(msgstr) {
    this.msg = msgstr;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.Data() returns the entire data payload or the property within
   * the data payload (can return undefined if property doesn't exist)
   */
  Data(prop) {
    if (!prop) return this.data;
    if (typeof prop === 'string') return this.data[prop];
    throw ERR_BAD_PROP;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Convenience method to set data object entirely
   */
  SetData(propOrVal, val) {
    if (typeof propOrVal === 'object') {
      this.data = propOrVal;
      return;
    }
    if (typeof propOrVal === 'string') {
      this.data[propOrVal] = val;
      return;
    }
    throw ERR_BAD_PROP;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.Memo() returns the 'memo' field of the packet */
  Memo() {
    return this.memo;
  }

  SetMemo(memo) {
    this.memo = memo;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.JSON() returns a stringified JSON version of the packet. */
  JSON() {
    return JSON.stringify(this);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.SourceGroupId() return the session group id associated with
   * this packet.
   */
  SourceGroupID() {
    return this.s_group;
  }

  /// TRANSACTION SUPPORT /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.SeqNum() returns a non-positive integer that is the number of
   * times this packet was reused during a transaction (e.g. 'mcall' types).
   */
  SeqNum() {
    return this.seqnum;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.SourceAddress() returns the originating browser of the packet,
   * which is the socketname maintained by the URSYS server. It is valid only
   * after the URSYS server has received it, so it is invalid when a NetMessage
   * packet is first created.
   */
  SourceAddress() {
    /*/ NOTE

        s_uaddr is the most recent sending browser.

        If a NetMessage packet is reused in a transaction (e.g. a call that returns
        data) then the originating browser is the first element in the transaction
        log .seqlog
    /*/
    // is this packet originating from server to a remote?
    if (this.s_uaddr === NetMessage.DefaultServerUADDR() && !this.msg.startsWith('NET:SVR_')) {
      return this.s_uaddr;
    }
    // this is a regular message forward to remote handlers
    return this.IsTransaction() ? this.seqlog[0] : this.s_uaddr;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Return true if this pkt is from the server targeting remote handlers
   */
  IsServerOrigin() {
    return this.SourceAddress() === NetMessage.DefaultServerUADDR();
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.CopySourceAddress() copies the source address of sets the
   * current address to the originating URSYS browser address. Used by server
   * forwarding and returning packets between remotes.
   * @param {NetMessage} pkt - the packet to copy source from
   */
  CopySourceAddress(pkt) {
    if (pkt.constructor.name !== 'NetMessage') throw Error(ERR_NOT_PACKET);
    this.s_uaddr = pkt.SourceAddress();
  }

  /// - - - - - - - - server- - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.Info() returns debug information about the packet
   * @param {string} key - type of debug info (always 'src' currently)
   * @returns {string} source browser + group (if set)
   */
  Info(key) {
    switch (key) {
      case 'src': /* falls-through */
      default:
        return this.SourceGroupID()
          ? `${this.SourceAddress()} [${this.SourceGroupID()}]`
          : `${this.SourceAddress()}`;
    }
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.MakeNewID() is a utility method that generates a unique id for
   * each NetMessage packet. When combined with s_uaddr and s_srcuid, this gives
   * a packet a unique ID across the entire URSYS network.
   * @returns {string} unique id
   */
  MakeNewID() {
    let idStr = (++m_id_counter).toString();
    this.id = m_id_prefix + idStr.padStart(5, '0');
    return this.id;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.SocketSend() is a convenience method to let packets 'send
   * themselves' to the network via the URSYS server.
   * @param {Object=m_socket} socket - web socket object. m_socket
   * is defined only on browsers; see NetMessage.GlobalSetup()
   */
  SocketSend(socket = m_netsocket) {
    if (m_mode === M_ONLINE || m_mode === M_INIT) {
      this.s_group = NetMessage.GlobalGroupID();
      let dst = socket.UADDR || 'unregistered socket';
      if (!socket) throw Error('SocketSend(sock) requires a valid socket');
      if (DBG.send) {
        let status = `sending '${this.Message()}' to ${dst}`;
        console.log(PR, status);
      }
      // for server-side ws library, send supports a function callback
      // for WebSocket, this is ignored
      socket.send(this.JSON(), err => {
        if (err) console.error(`\nsocket ${socket.UADDR} reports error ${err}\n`);
      });
    } else if (m_mode !== M_STANDALONE) {
      console.log(PR, "SocketSend: Can't send because NetMessage mode is", m_mode);
    } else {
      console.warn(PR, 'STANDALONE MODE: SocketSend() suppressed!');
    }
    // FYI: global m_netsocket is not defined on server, since packets arrive on multiple sockets
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.PromiseTransaction() maps a packet to a return handler using a
   * unique key. This key allows an incoming packet to be mapped back to the
   * caller even if it is technically a different object received over the
   * network.
   * @param {Object=m_socket} socket - web socket object. m_socket is defined
   * only on browsers; see NetMessage.GlobalSetup()
   */
  PromiseTransaction(socket = m_netsocket) {
    if (m_mode === M_STANDALONE) {
      console.warn(PR, 'STANDALONE MODE: PromiseTransaction() suppressed!');
      return Promise.resolve();
    }
    // global m_netsocket is not defined on server, since packets arrive on multiple sockets
    if (!socket) throw Error('PromiseTransaction(sock) requires a valid socket');
    // save our current UADDR
    this.seqlog.push(NetMessage.UADDR);
    let dbg = DBG.transact && !this.IsServerMessage();
    let p = new Promise((resolve, reject) => {
      let hash = m_GetHashKey(this);
      if (m_transactions[hash]) {
        reject(Error(`${ERR_DUPE_TRANS}:${hash}`));
      } else {
        // save the resolve function in transactions table;
        // promise will resolve on remote invocation with data
        m_transactions[hash] = data => {
          if (dbg) {
            console.log(PR, 'resolving promise with', JSON.stringify(data));
          }
          resolve(data);
        };
        this.SocketSend(socket);
      }
    });
    return p;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.RoutingMode() returns the direction of the packet to a
   * destination handler (req) or back to the origin (res).  */
  RoutingMode() {
    return this.rmode;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.IsRequest() returns true if this packet is one being sent
   * to a remote handler
   */
  IsRequest() {
    return this.rmode === 'req';
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.IsResponse() returns true if this is a packet
   * being returned from a remote handler
   * @returns {boolean} true if this is a transaction response
   */
  IsResponse() {
    return this.rmode === 'res';
    // more bulletproof check, but unnecessary
    // return this.rmove ==='res' && this.SourceAddress() === NetMessage.UADDR;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.IsTransaction() tests whether the packet is a response to a
   * call that was sent out previously.
   */
  IsTransaction() {
    return this.rmode !== 'req' && this.seqnum > 0 && this.seqlog[0] === NetMessage.UADDR;
  }

  ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.ReturnTransaction() is used to send a packet back to its
   * origin. It saves the current browser address (stored in NetMessage.UADDR),
   * sets the direction of the packet, and puts it on the socket.
   * @param {Object=m_socket} socket - web socket object. m_socket is defined
   * only on browsers; see NetMessage.GlobalSetup()
   */
  ReturnTransaction(socket = m_netsocket) {
    // global m_netsocket is not defined on server, since packets arrive on multiple sockets
    if (!socket) throw Error('ReturnTransaction(sock) requires a valid socket');
    // note: seqnum is already incremented by the constructor if this was
    // a received packet
    // add this to the sequence log
    this.seqlog.push(NetMessage.UADDR);
    this.rmode = m_CheckRMode('res');
    this.SocketSend(socket);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** NetMessage.CompleteTransaction() is called when a packet is received back
   * from the remote handler. At this point, the original caller needs to be
   * informed via the saved function handler created in
   * NetMessage.PromiseTransaction().
   */
  CompleteTransaction() {
    let dbg = DBG.transact && !this.IsServerMessage();
    let hash = m_GetHashKey(this);
    let resolverFunc = m_transactions[hash];
    if (dbg) console.log(PR, 'CompleteTransaction', hash);
    if (typeof resolverFunc !== 'function') {
      throw Error(`transaction [${hash}] resolverFunction is type ${typeof resolverFunc}`);
    } else {
      resolverFunc(this.data);
      Reflect.deleteProperty(m_transactions[hash]);
    }
  }
} // class NetMessage

/// STATIC CLASS METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetMessage.GlobalSetup() is a static method that initializes shared
 * parameters for use by all instances of the NetMessage class. It is used only
 * on browsers, which have a single socket connection.
 *
 * If no netsocket property is defined, then NetMessage instances will surpress
 * sending of network messages while allowing local messages to work normally.
 * See NetMessage.GlobalOfflineMode() for more information.
 * @function
 * @param {Object} [config] - configuration object
 * @param {Object} [config.netsocket] - valid websocket to URSYS server
 * @param {Object} [config.uaddr] - URSYS browser address
 */
NetMessage.GlobalSetup = (config = {}) => {
  let { uaddr, netsocket, peers, is_local } = config;
  if (uaddr) NetMessage.UADDR = uaddr;
  if (peers) NetMessage.PEERS = peers;
  if (netsocket) {
    // NOTE: m_netsocket is set only on clients since on server, there are
    // multiple sockets
    if (typeof netsocket.send !== 'function') throw ERR_BAD_SOCKET;
    if (DBG.setup) console.log(PR, 'GlobalSetup: netsocket set, mode online');
    m_netsocket = netsocket;
    m_mode = M_ONLINE;
  }
  if (is_local) NetMessage.ULOCAL = is_local;
};
NetMessage.UADDR = 'UNASSIGNED';
NetMessage.ULOCAL = false; // set if connection is a local connection
NetMessage.PEERS = undefined;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetMessage.GlobalCleanup() is a static method called only by the client,
 * which drops the current socket and puts the app in 'closed' state. In
 * practice this call doesn't accomplish much, but is here for symmetry to
 * GlobalSetup().
 * @function
 */
NetMessage.GlobalCleanup = () => {
  if (m_netsocket) {
    if (DBG.setup) console.log(PR, 'GlobalCleanup: deallocating netsocket, mode closed');
    m_netsocket = null;
    m_mode = M_CLOSED;
    NetMessage.ULOCAL = false;
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Static method NetMessage.GlobalOfflineMode() explicitly sets the mode to STANDALONE, which
 * actively suppresses remote network communication without throwing errors.
 * It's used for static code snapshots of the webapp that don't need the
 * network.
 * @function
 */
NetMessage.GlobalOfflineMode = () => {
  m_mode = M_STANDALONE;
  if (m_netsocket) {
    console.warn(PR, 'STANDALONE MODE: NetMessage disabling network');
    m_netsocket = null;
    let event = new CustomEvent('URSYSDisconnect', {});
    console.log('dispatching event to', document, event);
    document.dispatchEvent(event);
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Converts 'CHANNEL:MESSAGE' string to an object with channel, message
 * properties. If there is more than one : in the message string, it's left
 * as part of the message. All properties returned in are UPPERCASE.
 * @param {string} message - message with optional channel prefix
 * @returns {Object} - contains channel (UC) that are set
 * @example
 * const parsed = NetMessage.DecodeChannel('NET:MY_MESSAGE');
 * if (parsed.NET) console.log('this is true');
 * if (parsed.LOCAL) console.log('this is false');
 * console.log('message is',parsed.MESSAGE);
 */
NetMessage.ExtractChannel = function(msg) {
  let [channel, MESSAGE] = msg.split(':', 2);
  // no : found, must be local
  if (!MESSAGE) {
    MESSAGE = channel;
    channel = '';
  }
  const parsed = { MESSAGE };
  if (!channel) {
    parsed.LOCAL = true;
    return parsed;
  }
  if (channel === '*') {
    VALID_CHANNELS.forEach(chan => {
      parsed[chan] = true;
    });
    return parsed;
  }
  if (VALID_CHANNELS.includes(channel)) {
    parsed[channel] = true;
    return parsed;
  }
  // legacy messages use invalid channel names
  // for now forward them as-is
  console.warn(`'${msg}' replace : with _`);
  parsed.LOCAL = true;
  return parsed;
  // this is what should actually happen
  // throw Error(`invalid channel '${channel}'`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetMessage.SocketUADDR() is a static method returning the class-wide setting
 * of the browser UADDR. This is only used on browser code.
 * @function
 * @returns {string} URSYS address of the current browser, a URSYS address
 */
NetMessage.SocketUADDR = () => {
  return NetMessage.UADDR;
};
NetMessage.Peers = () => {
  return NetMessage.PEERS;
};
NetMessage.IsLocalhost = () => {
  return NetMessage.ULOCAL;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetMessage.DefaultServerUADDR() is a static method returning a hardcoded
 * URSYS address referring to the URSYS server. It is used by the server-side
 * code to set the server address, and the browser can rely on it as well.
 * @function
 * @returns {string} URSYS address of the server
 */
NetMessage.DefaultServerUADDR = () => {
  return 'SVR_01';
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetMessage.GlobalGroupID() is a static method returning the session key
 * (aka group-id) set for this browser instance
 * @function
 * @returns {string} session key
 */
NetMessage.GlobalGroupID = () => {
  return m_group_id;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetMessage.GlobalSetGroupID() is a static method that stores the passed
 * token as the GroupID
 * @function
 * @param {string} token - special session key data
 */
NetMessage.GlobalSetGroupID = token => {
  m_group_id = token;
};

/// PRIVATE CLASS HELPERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ DEPRECATE? Utility function to increment the packet's sequence number
 *  @param {NetMessage} pkt - packet to modify
/*/
function m_SeqIncrement(pkt) {
  pkt.seqnum++;
  return pkt;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Utility to create a unique hash key from packet information. Used by
 *  PromiseTransaction().
 *  @param {NetMessage} pkt - packet to use
 *  @return {string} hash key string
/*/
function m_GetHashKey(pkt) {
  let hash = `${pkt.SourceAddress()}:${pkt.id}`;
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
  if (!TRANSACTION_MODE.includes(mode)) throw Error(`${ERR_UNKNOWN_RMODE} '${mode}'`);
  return mode;
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NetMessage.CODE_OK = 0;
NetMessage.CODE_NO_MESSAGE = 1; // requested message doesn't exist
NetMessage.CODE_SOC_NOSOCK = -100;
NetMessage.CODE_SES_REQUIRE_KEY = -200; // access key not set
NetMessage.CODE_SES_REQUIRE_LOGIN = -201; // socket was not logged-in
NetMessage.CODE_SES_INVALID_KEY = -202; // provided key didn't match socket key
NetMessage.CODE_SES_RE_REGISTER = -203; // session attempted to login again
NetMessage.CODE_SES_INVALID_TOKEN = -204; // session attempted to login again
NetMessage.CODE_REG_DENIED = -300; // registration of handler denied
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// using CommonJS format on purpose for node compatibility
module.exports = NetMessage;
