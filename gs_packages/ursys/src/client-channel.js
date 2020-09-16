/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable lines-between-class-members */
/* eslint-disable func-names */
/* eslint-disable no-param-reassign */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    URSYS CHANNEL CLASS (URCHAN)

    A URCHAN (channel) represents a connection to the URSYS message-passing
    system for the app and optionally other entities on the URSYS Net.

    Instances are created with URSYS.Connect() with a unique name for logging
    purposes.

    Additionally, each URCHAN has a unique local id (UID) that is assigned
    a device address (UADDR). These are used together to make multiple URCHAN
    instances in an UR App uniquely addressable, though users of URSYS
    don't need to know that.

    Channels can:

    * subscribe to a named message, locally and from the network
    * publish to a named message, locally and to the network
    * call a named message and receive a response asychronously
    * update state change message, locally and to the network
    * synch a state change message, locally and from the network
    * hook into a lifecycle message, locally and from the network

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// NOTE: This module uses the COMMONJS module format for compatibility
// between node and browser-side Javascript.
const Messager = require('./class-messager');
const DataMap = require('./class-datamap');
const URNet = require('./client-network');
const PROMPTS = require('./util/prompts');

const PR = PROMPTS.makeStyleFormatter('UR.CHN');

/** implements endpoints for talking to the URSYS network
 * @module URChan
 */
/// DEBUGGING /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = { create: false, send: false, return: false, register: false };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BAD_NAME = 'name parameter must be a string';
const BAD_UID = 'unexpected non-unique UID';

/// NODE MANAGEMENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNODE_MAP = new Map(); // URSYS connector node map (local)
const MAX_UNODES = 100;
let UNODE_COUNTER = 0; // URSYS connector node id counter
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetUniqueId() {
  const id = `${++UNODE_COUNTER}`.padStart(3, '0');
  if (UNODE_COUNTER > MAX_UNODES)
    console.warn('Unexpectedly high number of URCHAN nodes created!');
  return `UDL${id}`;
}

/// GLOBAL MESSAGES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let MESSAGER = new Messager(); // all urlinks share a common messager

/// URSYS NODE CLASS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Instances of this class can register/unregister message handlers and also
 * send messages. Constructor receives an owner, which is inspected for
 * properties to determine how to classify the created messager for debugging
 * purposes
 * @memberof URChan
 */
class URChan {
  /** constructor
   * @param {object} owner the class instance or code module object
   * @param {string} owner.name code module name set manually
   * @param {string} [owner.constructor.name] for classes
   * @param {string} optName optional name to use instead owner.name or owner.constructor.name
   */
  constructor(name) {
    if (name !== undefined && typeof name !== 'string') {
      throw Error(BAD_NAME);
    }
    // bind function
    this.UID = this.UID.bind(this);
    this.Name = this.Name.bind(this);
    this.UADDR = this.UADDR.bind(this);
    this.Subscribe = this.Subscribe.bind(this);
    this.Unsubscribe = this.Unsubscribe.bind(this);
    this.Call = this.Call.bind(this);
    this.Publish = this.Publish.bind(this);
    this.Signal = this.Signal.bind(this);
    this.LocalCall = this.LocalCall.bind(this);
    this.LocalPublish = this.LocalPublish.bind(this);
    this.LocalSignal = this.LocalSignal.bind(this);
    this.NetCall = this.NetCall.bind(this);
    this.NetPublish = this.NetPublish.bind(this);
    this.NetSignal = this.NetSignal.bind(this);

    // generate and save unique id
    this.uid = m_GetUniqueId();
    this.name = name;
    // save module in the global module list
    if (UNODE_MAP.has(this.uid)) throw Error(BAD_UID + this.uid);
    if (DBG.create) console.log(PR, `${this.uid} <-> '${this.name}'`);
    UNODE_MAP.set(this.uid, this);
  }

  /// UNIQUE URSYS ID for local application
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// this is used to differentiate sources of events so they don't echo
  UID() {
    return this.uid;
  }

  Name() {
    return this.name;
  }

  UADDR() {
    return URNet.SocketUADDR();
  }

  /// MESSAGES ////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** mesgName is a string, and is an official event that's defined by the
   * subclasser of UnisysNode
   */
  Subscribe(mesgName, listener) {
    // uid is "source uid" of subscribing object, to avoid reflection
    // if the subscribing object is also the originating state changer
    if (DBG.register)
      console.log(
        `${this.uid} _${PR} `,
        `${this.name} handler added[${mesgName}]`
      );
    MESSAGER.Subscribe(mesgName, listener, { handlerUID: this.UID() });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** variation of Subscribe that receives from remotes as well
   */
  NetSubscribe(mesgName, listener) {
    // uid is "source uid" of subscribing object, to avoid reflection
    // if the subscribing object is also the originating state changer
    if (DBG.register)
      console.log(
        `${this.uid} _${PR} `,
        `${this.name} nethandler added[${mesgName}]`
      );
    MESSAGER.Subscribe(mesgName, listener, {
      fromNet: true,
      handlerUID: this.UID()
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** remove a listener from message
   */
  Unsubscribe(mesgName, listener) {
    if (DBG.register)
      console.log(
        `${this.uid} _${PR} `,
        `${this.name} handler removed[${mesgName}]`
      );
    MESSAGER.Unsubscribe(mesgName, listener);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** URCHAN wraps Messager.CallAsync(), which returns an agregate data
   * bundle after executing a bunch of promises async/await-style!
   */
  Call(mesgName, inData = {}, options = {}) {
    options = Object.assign(options, { type: 'mcall' });
    options.srcUID = this.UID();
    // returns promise that resolves to data object
    let result = MESSAGER.CallAsync(mesgName, inData, options);
    return result;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Sends the data to all message implementors UNLESS it is originating from
   *   the same URCHAN instance (avoid echoing back to self)
   */
  Publish(mesgName, inData = {}, options = {}) {
    if (typeof inData === 'function')
      throw Error('did you intend to use Subscribe() instead of Publish()?');
    options = Object.assign(options, { type: 'msend' });
    options.srcUID = this.UID();
    MESSAGER.Publish(mesgName, inData, options);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Sends the data to all message implementors, irregardless of origin.
   */
  Signal(mesgName, inData = {}, options = {}) {
    options = Object.assign(options, { type: 'msig' });
    MESSAGER.Signal(mesgName, inData, options);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** version of Call that forces local-only calls
   */
  LocalCall(mesgName, inData, options = {}) {
    options = Object.assign(options, { type: 'mcall' });
    options.toLocal = true;
    options.toNet = false;
    // returns promise that resolve to data object
    return this.Call(mesgName, inData, options);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** version of Send that force local-only calls
   */
  LocalPublish(mesgName, inData, options = {}) {
    options = Object.assign(options, { type: 'msend' });
    options.toLocal = true;
    options.toNet = false;
    this.Publish(mesgName, inData, options);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** version of Send that force local-only calls
   */
  LocalSignal(mesgName, inData, options = {}) {
    options = Object.assign(options, { type: 'msig' });
    options.toLocal = true;
    options.toNet = false;
    this.Signal(mesgName, inData, options);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** version of Call that forces network-only calls
   */
  NetCall(mesgName, inData, options = {}) {
    options = Object.assign(options, { type: 'mcall' });
    options.toLocal = false;
    options.toNet = true;
    // returns promise that resolve to data object
    return this.Call(mesgName, inData, options);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** version of Send that force network-only calls
   */
  NetPublish(mesgName, inData, options = {}) {
    options = Object.assign(options, { type: 'msend' });
    options.toLocal = false;
    options.toNet = true;
    this.Publish(mesgName, inData, options);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** version of Signal that forces network-only signal
   */
  NetSignal(mesgName, inData, options = {}) {
    options.toLocal = false;
    options.toNet = true;
    this.Signal(mesgName, inData, options);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  NullCallback() {
    if (DBG.send) console.log(`${this.uid} _${PR} `, 'null_callback', this.UID());
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Inform URSYS server that we have the following subscribers for the passed
   * list of messages.
   * @param {Array<string>} [messages] optional list of messages to register.
   * If messages is empty, then it's assumed that we are registering all message
   * subscribers.
   */
  RegisterSubscribers(messages = []) {
    if (URNet.IsStandaloneMode()) {
      console.warn(PR, 'STANDALONE MODE: RegisterMessagesPromise() suppressed!');
      return Promise.resolve();
    }
    // if there are no messages passed, then
    if (messages.length) {
      messages = MESSAGER.ValidateMessageNames(messages);
    } else {
      messages = MESSAGER.NetMessageNames();
    }
    // returns promise that resolve to data object
    const result = this.NetCall('NET:SRV_REG_HANDLERS', { messages });
    return result;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Perform data operation to server. Do not call directly, but use
   * UR.DBQuery(cmd,data). The cmd is looks up the corresponding URSYS
   * message (e.g. add -> NET:SRV_DBADD)
   * @example
   * DataMap.DBQuery('add', { teachers: { name: 'NewTeacher' }});
   */
  _DBQuery(cmd, data) {
    const opmsg = DataMap.GetCommandMessage(cmd);
    if (!opmsg) return Promise.reject(`invalid operation '${cmd}'`);
    if (data.cmd) return Promise.reject("do not include 'cmd' prop in data pack");
    if (!data.key)
      return Promise.reject("data must have access key 'key' defined");
    data.cmd = cmd;
    let res = DataMap.ValidateCollections(data);
    if (!res) return Promise.reject(`no-op: no valid collections found ${res}`);
    // got this far, so let's do the call!
    // returns promise that resolve to data object
    return this.NetCall(opmsg, data);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Cooperative database element lock on server
   */
  _DBLock(data) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { dbkey, dbids, key } = data;
    if (!DataMap.IsValidKey(dbkey))
      return Promise.reject(`invalid dbkey ${dbkey}`);
    if (!DataMap.IsValidIdsArray(dbids))
      return Promise.reject('dbids must be array of ints');
    if (!data.key)
      return Promise.reject("data must have access key 'key' defined");
    if (!data.uaddr) return Promise.reject('data must have uaddr defined');
    return this.NetCall('NET:SRV_DBLOCK', data);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Cooperative database element release on server
   */
  _DBRelease(data) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { dbkey, dbids, key } = data;
    if (!DataMap.IsValidKey(dbkey))
      return Promise.reject(`invalid dbkey ${dbkey}`);
    if (!DataMap.IsValidIdsArray(dbids))
      return Promise.reject('dbids must be array of ints');
    if (!data.key)
      return Promise.reject("data must have access key 'key' defined");
    if (!data.uaddr) return Promise.reject('data must have uaddr defined');
    return this.NetCall('NET:SRV_DBRELEASE', data);
  }
} // class URChan

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = URChan;
