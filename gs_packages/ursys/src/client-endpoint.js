/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable lines-between-class-members */
/* eslint-disable func-names */
/* eslint-disable no-param-reassign */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    URSYS MESSAGER ENDPOINT

    The class represents a specific connection to the URSYS message network.
    It is essentially a wrapper for the Message object (of which there is
    one instance in client-side URSYS) that includes a URSYS ID (UID) that
    uniquely identifies each endpoint. This allows an app to create multiple
    endpoints to handle different "groups" of messages. It affects the
    semantics of raiseSignal() and sendMessage(); the latter checks to make
    sure that the message isn't received by the same endpoint that sent it.

    handling a message is for client definition, but internally this is
    called registration

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// NOTE: This module uses the COMMONJS module format for compatibility
// between node and browser-side Javascript.
const Messager = require('./class-messager');
const URNet = require('./client-urnet');
const PROMPTS = require('./util/prompts');
const MessageStream = require('./class-message-stream');
const { UNODE_MAP } = require('./client-datacore');

/** implements endpoints for talking to the URSYS network
 *  @module MessagerEndpoint
 */
/// DEBUGGING /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = { create: false, send: false, return: false, register: false };
const PR = PROMPTS.makeStyleFormatter('UR.CHN');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BAD_NAME = 'name parameter must be a string';
const BAD_UID = 'unexpected non-unique UID';

/// NODE MANAGEMENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// const UNODE_MAP = new Map(); // URSYS connector node map (local)
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
let MESSAGER = new Messager(); // note: endpoints share the same message dict
let MSTREAM = new MessageStream(); //

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
    this.handleMessage = this.handleMessage.bind(this);
    this.unhandleMessage = this.unhandleMessage.bind(this);
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
  handleMessage(mesgName, listener) {
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
  unhandleMessage(mesgName, listener) {
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
  /** Sends the data to all message implementors, irregardless of origin.
   */
  raiseMessage(mesgName, inData = {}, options = {}) {
    options = Object.assign(options, { type: 'msig' });
    MESSAGER.raiseMessage(mesgName, inData, options);
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
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** new 2021: WIP adding a new 'ursys-wide message declaration' system on top
   *  of Messager. This is used to register all messages in one place
   *  to check
   */
  declareMessage(mesgName, dataProps) {
    return MSTREAM.declare(mesgName, dataProps);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** new 2021: WIP check if a message was declared */
  hasMessage(mesgName) {
    return MSTREAM.has(mesgName);
  }
} // class MessagerEndpoint

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MessagerEndpoint;
