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
 * @module MessagerEndpoint
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
 * @memberof MessagerEndpoint
 */
class MessagerEndpoint {
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
    this.getUID = this.getUID.bind(this);
    this.getName = this.getName.bind(this);
    this.getUADDR = this.getUADDR.bind(this);
    this.registerMessage = this.registerMessage.bind(this);
    this.unregisterMessage = this.unregisterMessage.bind(this);
    //
    this.callMessage = this.callMessage.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    //
    this.ursysRegisterMessages = this.ursysRegisterMessages.bind(this);

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
  getUID() {
    return this.uid;
  }

  getName() {
    return this.name;
  }

  getUADDR() {
    return URNet.SocketUADDR();
  }

  /// MESSAGES ////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** mesgName is a string, and is an official event that's defined by the
   * subclasser of UnisysNode
   */
  registerMessage(mesgName, listener) {
    // uid is "source uid" of subscribing object, to avoid reflection
    // if the subscribing object is also the originating state changer
    if (DBG.register)
      console.log(
        `${this.uid} _${PR} `,
        `${this.name} handler added[${mesgName}]`
      );
    MESSAGER.registerMessage(mesgName, listener, { handlerUID: this.getUID() });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** remove a listener from message
   */
  unregisterMessage(mesgName, listener) {
    if (DBG.register)
      console.log(
        `${this.uid} _${PR} `,
        `${this.name} handler removed[${mesgName}]`
      );
    MESSAGER.unregisterMessage(mesgName, listener);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** URCHAN wraps Messager.callMessage(), which returns an agregate data
   * bundle after executing a bunch of promises async/await-style!
   */
  callMessage(mesgName, inData = {}, options = {}) {
    options = Object.assign(options, { type: 'mcall' });
    options.srcUID = this.getUID();
    // returns promise that resolves to data object
    let result = MESSAGER.callMessage(mesgName, inData, options);
    return result;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Sends the data to all message implementors UNLESS it is originating from
   *   the same URCHAN instance (avoid echoing back to self)
   */
  sendMessage(mesgName, inData = {}, options = {}) {
    if (typeof inData === 'function')
      throw Error(
        'did you intend to use registerMessage() instead of sendMessage()?'
      );
    options = Object.assign(options, { type: 'msend' });
    options.srcUID = this.getUID();
    MESSAGER.sendMessage(mesgName, inData, options);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Inform URSYS server that we have the following subscribers for the passed
   * list of messages.
   * @param {Array<string>} [messages] optional list of messages to register.
   * If messages is empty, then it's assumed that we are registering all message
   * subscribers.
   */
  async ursysRegisterMessages(messages = []) {
    if (URNet.IsStandaloneMode()) {
      console.warn(PR, 'STANDALONE MODE: ursysRegisterMessages() suppressed!');
      return Promise.resolve();
    }
    // if there are no messages passed, then
    if (messages.length) {
      messages = MESSAGER.validateMessageNames(messages);
    } else {
      messages = MESSAGER.getNetMessageNames();
    }
    // returns promise that resolve to data object
    return new Promise((resolve, reject) => {
      this.callMessage('NET:SRV_REG_HANDLERS', { messages }).then(data => {
        if (data.error) reject(data.error);
        resolve(data);
      });
    });
  }
} // class MessagerEndpoint

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MessagerEndpoint;
