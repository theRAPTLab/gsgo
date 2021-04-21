/* eslint-disable @typescript-eslint/no-use-before-define */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Messager - Handle a collection of named events and their handlers.
    https://en.wikipedia.org/wiki/Event-driven_architecture#JavaScript

    This is a low-level class used by other URSYS modules both by client
    browsers and nodejs.

    NOTE: This module uses the COMMONJS module format for compatibility
    between node and browser-side Javascript, though it is only used
    on the client side

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const NetPacket = require('./class-netpacket');
const DBG = require('./ur-dbg-settings');

/// MODULE VARS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let MSGR_IDCOUNT = 0;
const PR = require('./util/prompts').makeStyleFormatter('MESSAGER', 'TagRed');

/// URSYS HELPER METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a string of form CHANNEL:MESSAGE return an object containing
 *  channel, message, toNet, fromNet props */
function m_DecodeMessage(msg) {
  if (typeof msg !== 'string') throw Error(`${PR} arg1 must be string`);
  const bits = msg.split(':');
  if (bits.length > 2) throw Error(`${PR} too many colons in message name`);
  if (bits.length < 2) {
    const message = bits[0].toUpperCase();
    return { channel: 'LOCAL', message, toNet: false, toLocal: true };
  }
  // exactly two parts
  const channel = bits[0].toUpperCase();
  const message = bits[1].toUpperCase();
  const obj = {};
  // got this far, is valid message
  switch (channel) {
    case 'NET':
      obj.toNet = true;
      obj.toLocal = false;
      obj.isNet = true;
      break;
    case 'LOCAL':
    case '': // no channel = local call only
      obj.toNet = false;
      obj.toLocal = true;
      obj.isLocal = true;
      break;
    case '*': // both local and net
      obj.toNet = true;
      obj.toLocal = true;
      obj.isNet = true;
      break;
    default:
      throw Error(`${PR} unrecognized channel '${channel}'`);
  }
  obj.channel = channel;
  obj.message = message;
  return obj;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// remember MESSAGER class is used for more than just Network Calls
/// the state manager also uses it, so the resolved value may be of any type
function m_MakeResolverFunction(handlerFunc, inData) {
  return new Promise(resolve => {
    let retval = handlerFunc(inData, {
      /*control functions go here*/
    });
    resolve(retval);
  });
}

/// URSYS MESSAGER CLASS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Implements network-aware message passing scheme based on message strings
 *  passing single data objects. Message table stores multiple message handlers
 *  as a set to avoid multiple registered handlers
 */
class Messager {
  constructor() {
    this.handlerMap = new Map(); // message map storing sets of functions
    this.messager_id = ++MSGR_IDCOUNT;
  }

  /// FIRE ONCE EVENTS //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Register a message string to a handler function that will receive a mutable
   *  data object that is returned at the end of the handler function
   *  @example Subscribe('NET:MY_MESSAGE',(data)=>{ return data; });
   *  @param {string} mesgName message to register a handler for
   *  @param {function} handlerFunc function receiving 'data' object
   *  @param {Object} [options] options
   *  @param {string} [options.handlerUID] URSYS_ID identifies group, attaches handler
   *  @param {string} [options.info] description of message handler
   *  @param {Object} [options.syntax] dictionary of data object properties accepted
   */
  registerMessage(mesgName, handlerFunc, options = {}) {
    // get parameters from options
    let { handlerUID } = options;
    let { syntax } = options;
    let { fromNet } = options; // replaced by isNet===true
    // parameter error checking
    if (typeof handlerFunc !== 'function') {
      throw Error('arg2 must be a function');
    }
    // do the work
    if (typeof handlerUID === 'string') {
      // bind the URChan uid to the handlerFunc function for convenient access
      // by the message dispatcher
      handlerFunc.ulink_id = handlerUID;
    }
    // parse message to set flags
    mesgName = mesgName.toUpperCase();
    const { isNet } = m_DecodeMessage(mesgName);
    handlerFunc.isNetFunc = isNet === true; // registering NET:
    let handlers = this.handlerMap.get(mesgName);
    if (!handlers) {
      handlers = new Set();
      this.handlerMap.set(mesgName, handlers);
    }
    // syntax annotation
    if (syntax) handlerFunc.umesg = { syntax };
    // saved function to handler
    handlers.add(handlerFunc);
    return this;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Unregister a handler function from a registered message. The handler
   *  function object must be the same one used to register it.
   *  @param {string} mesgName message to unregister a handler for
   *  @param {function} handlerFunc function originally registered
   */
  unregisterMessage(mesgName, handlerFunc) {
    mesgName = mesgName.toUpperCase();
    if (!arguments.length) {
      this.handlerMap.clear();
    } else if (arguments.length === 1) {
      this.handlerMap.delete(mesgName);
    } else {
      const handlers = this.handlerMap.get(mesgName);
      if (handlers) {
        handlers.delete(handlerFunc);
      }
    }
    return this;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Send a message with data payload, one way no return data. Does NOT
   *  reflect back to the originating srcUID endpoint
   *  @param {string} mesgName message to send data to
   *  @param {Object} inData parameters for the message handler
   *  @param {Object} [options] options
   *  @param {string} [options.srcUID] URSYS_ID group that is sending the
   *  message. If this is set, then the sending URSYS_ID can receive its own
   *  message request.
   *  @param {string} [options.type] type of message (mcall)
   *  @param {boolean} [options.toLocal=true] send to local message handlers
   *  @param {boolean} [options.toNet=false] send to network message handlers
   */
  sendMessage(mesgName, inData, options = {}) {
    let { srcUID, type, fromNet } = options;
    mesgName = mesgName.toUpperCase();
    const handlers = this.handlerMap.get(mesgName);
    const { toLocal, toNet } = m_DecodeMessage(mesgName);
    /// toLocal ///
    if (handlers && (toLocal || fromNet)) {
      handlers.forEach(handlerFunc => {
        // handlerFunc signature: (data,dataReturn) => {}
        // handlerFunc has ulink_id property to note originating URCHAN object
        // skip "same origin" calls
        if (srcUID && handlerFunc.ulink_id === srcUID) {
          console.warn(
            `sendMessage: [${mesgName}] skip call since ${srcUID} = ${handlerFunc.ulink_id}`
          );
          // return;
        }
        // trigger the local handler (no return expected)
        handlerFunc(inData, {}); // second param is for control message expansion
      }); // end handlers.forEach
      return;
    }
    /// toNetwork ///
    if (toNet) {
      let pkt = new NetPacket(mesgName, inData, type);
      pkt.socketSend();
      return;
    } // end toNetwork
    if (DBG.handle)
      console.log(
        ...PR(
          'unhandled message:',
          `'${mesgName}' type:${options.type}`,
          `toLocal:${toLocal} toNet:${toNet}`,
          'handlerMap:',
          this.handlerMap
        )
      );
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Send message to everyone, local and network, and also mirrors back to self.
   *  This is a wrapper for sendMessage() that ensures that srcUID is overridden.
   *  @param {string} mesgName message to send data to
   *  @param {Object} inData parameters for the message handler
   *  @param {Object} [options] see sendMessage() for option details
   */
  raiseMessage(mesgName, data, options = {}) {
    mesgName = mesgName.toUpperCase();
    if (options.srcUID) {
      console.warn(
        `overriding srcUID ${options.srcUID} with NULL because raiseMessage() doesn't use it`
      );
      options.srcUID = null;
    }
    this.sendMessage(mesgName, data, options);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Issue a message transaction. Returns an array of promises. Works across
   *  the network.
   *  @param {string} mesgName message to send data to
   *  @param {Object} inData parameters for the message handler
   *  @param {Object} [options] see sendMessage() for option details
   *  @returns {Array} an array of Promises
   */
  async callMessage(mesgName, inData, options = {}) {
    mesgName = mesgName.toUpperCase();
    let { srcUID, type } = options;
    let { fromNet = false } = options;
    const { channel, message, toLocal, toNet, isNet } = m_DecodeMessage(mesgName);
    // console.log(mesgName, `channel:${channel} local:${toLocal} toNet:${toNet}`);
    const handlers = this.handlerMap.get(mesgName);
    let promises = [];
    /// handle a call from the network
    if (toLocal || fromNet) {
      console.log(
        ...PR(
          `incoming CallMessage: toLocal:${toLocal} fromNet:${fromNet} isNet:${isNet}`
        )
      );
      // initiated from app
      // NOTE: THIS SEEMS SUSPICIOUS AND UNNECESSARY
      // if (!channel.LOCAL && !fromNet)
      //   throw Error(`'${mesgName}' for local calls remove channel prefix`);
      if (handlers) {
        let count = 1;
        handlers.forEach(handlerFunc => {
          console.log(...PR(count++, 'calling func'));
          /*/
          handlerFunc signature: (data,dataReturn) => {}
          handlerFunc has ulink_id property to note originating URCHAN object
          handlerFunc has fromNet property if it expects to receive network sourced calls
          /*/
          // skip calls that don't have their fromNet stat set if it's a net call
          if (fromNet && !handlerFunc.isNetFunc) return;
          // skip "same origin" calls
          if (srcUID && handlerFunc.ulink_id === srcUID) return;
          // Create a promise. if handlerFunc returns a promise, it follows
          let p = m_MakeResolverFunction(handlerFunc, inData);
          promises.push(p);
        }); // end foreach
      } else {
        // no handlers
        promises.push(Promise.resolve({ error: 'message handler not found' }));
      }
    } // to local

    /// toNetwork (initiated from app)
    if (toNet) {
      if (!isNet) throw Error('net calls must use NET: message prefix');
      type = type || 'mcall';
      let pkt = new NetPacket(mesgName, inData, type);
      let p = pkt.transactionStart();
      promises.push(p);
    } // end toNetwork

    /// do the work
    let resArray = await Promise.all(promises);
    let resObj = Object.assign({}, ...resArray);
    return resObj;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Get list of messages that are handled by this Messager instance.
   *  @returns {Array<string>} message name strings
   */
  getAllMessageNames() {
    let handlers = [];
    this.handlerMap.forEach((set, key) => {
      handlers.push(key);
      if (DBG) console.log(`handler: ${key}`);
    });
    return handlers;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Get list of messages that are published to the network
   *  @returns {Array<string>} message name strings
   */
  getNetMessageNames() {
    let handlers = [];
    this.handlerMap.forEach((set, key) => {
      let addMessage = false;
      // eslint-disable-next-line no-return-assign, no-bitwise
      set.forEach(func => (addMessage |= func.isNetFunc === true));
      if (addMessage) handlers.push(key);
    });
    return handlers;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Check to see if a message is handled by this Messager instance
   *  @param {string=''} msg message name to check
   *  @returns {boolean} true if message name is handled
   */
  hasMessageName(msg = '') {
    return this.handlerMap.has(msg);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Ensure that the passed message names really exist in this Messager
   * instance
   * @param {Array<string>} msgs
   */
  validateMessageNames(msgs = []) {
    const valid = [];
    msgs.forEach(name => {
      if (this.hasMessageName(name)) valid.push(name);
      else
        throw new Error(`validateMessageNames() found invalid message '${name}'`);
    });
    return valid;
  }
} // class Messager

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE this is a dual-environment script, so use commonjs module format
module.exports = Messager;
