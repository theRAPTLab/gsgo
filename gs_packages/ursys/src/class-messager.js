/* eslint-disable @typescript-eslint/no-use-before-define */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Messager - Handle a collection of named events and their handlers.
    https://en.wikipedia.org/wiki/Event-driven_architecture#JavaScript

    This is a low-level class used by other URSYS modules both by client
    browsers and nodejs.

    NOTE: CallerReturnFunctions receive data object AND control object.
    The control object has the "return" function that closes a transaction;
    this is useful for async operations without Promises.

    NOTE: When providing a handlerFunc, users should be aware of binding
    context using Function.prototype.bind() or by using arrow functions
\
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

// NOTE: This module uses the COMMONJS module format for compatibility
// between node and browser-side Javascript.
const NetPacket = require('./class-netpacket');

/// MODULE VARS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let MSGR_IDCOUNT = 0;
let DBG = true;

/// URSYS MESSAGER CLASS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Implement network-aware message passing scheme based on message strings passing
 * single data objects. Message table stores multiple message handlers as a set
 * to avoid multiple registered handlers
 */
class Messager {
  constructor() {
    this.handlerMap = new Map(); // message map storing sets of functions
    this.messager_id = ++MSGR_IDCOUNT;
  }

  /// FIRE ONCE EVENTS //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Register a message string to a handler function that will receive a mutable
   * data object that is returned at the end of the handler function
   * @example Subscribe('MY_MESSAGE',(data)=>{ return data; });
   * @param {string} mesgName message to register a handler for
   * @param {function} handlerFunc function receiving 'data' object
   * @param {Object} [options] options
   * @param {string} [options.handlerUID] URSYS_ID identifies group, attaches handler
   * @param {string} [options.info] description of message handler
   * @param {Object} [options.syntax] dictionary of data object properties accepted
   */
  Subscribe(mesgName, handlerFunc, options = {}) {
    let { handlerUID } = options;
    let { syntax } = options;
    let { fromNet } = options;
    if (typeof handlerFunc !== 'function') {
      throw Error('arg2 must be a function');
    }
    if (typeof handlerUID === 'string') {
      // bind the URChan uid to the handlerFunc function for convenient access
      // by the message dispatcher
      handlerFunc.ulink_id = handlerUID;
    }
    if (typeof fromNet === 'boolean') {
      // true if this subscriber wants to receive network messages
      handlerFunc.fromNet = fromNet;
    }
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
  /**
   * Unsubscribe a handler function from a registered message. The handler
   * function object must be the same one used to register it.
   * @param {string} mesgName message to unregister a handler for
   * @param {function} handlerFunc function originally registered
   */
  Unsubscribe(mesgName, handlerFunc) {
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
  /**
   * Publish a message with data payload
   * @param {string} mesgName message to send data to
   * @param {Object} inData parameters for the message handler
   * @param {Object} [options] options
   * @param {string} [options.srcUID] URSYS_ID group that is sending the
   * message. If this is set, then the sending URSYS_ID can receive its own
   * message request.
   * @param {string} [options.type] type of message (mcall)
   * @param {boolean} [options.toLocal=true] send to local message handlers
   * @param {boolean} [options.toNet=false] send to network message handlers
   */
  Publish(mesgName, inData, options = {}) {
    let { srcUID, type } = options;
    let { toLocal = true, toNet = false } = options;
    const handlers = this.handlerMap.get(mesgName);
    /// toLocal
    if (handlers && toLocal)
      handlers.forEach(handlerFunc => {
        // handlerFunc signature: (data,dataReturn) => {}
        // handlerFunc has ulink_id property to note originating URCHAN object
        // skip "same origin" calls
        if (srcUID && handlerFunc.ulink_id === srcUID) {
          console.warn(
            `MessagerSend: [${mesgName}] skip call since ${srcUID} = ${handlerFunc.ulink_id}`
          );
          return;
        }
        // trigger the local handler (no return expected)
        handlerFunc(inData, {}); // second param is for control message expansion
      }); // end handlers.forEach

    /// toNetwork
    if (toNet) {
      let pkt = new NetPacket(mesgName, inData, type);
      pkt.SocketSend();
    } // end toNetwork
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Publish message to everyone, local and network, and also mirrors back to self.
   * This is a wrapper for Publish() that ensures that srcUID is overridden.
   * @param {string} mesgName message to send data to
   * @param {Object} inData parameters for the message handler
   * @param {Object} [options] see Publish() for option details
   */
  Signal(mesgName, data, options = {}) {
    if (options.srcUID) {
      console.warn(
        `overriding srcUID ${options.srcUID} with NULL because Signal() doesn't use it`
      );
      options.srcUID = null;
    }
    this.Publish(mesgName, data, options);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Issue a message transaction. Returns an array of promises. Works across
   * the network.
   * @param {string} mesgName message to send data to
   * @param {Object} inData parameters for the message handler
   * @param {Object} [options] see Publish() for option details
   * @returns {Array} an array of Promises
   */
  async CallAsync(mesgName, inData, options = {}) {
    let { srcUID, type } = options;
    let { toLocal = true, toNet = true } = options;
    let { fromNet = false } = options;
    const channel = NetPacket.ExtractChannel(mesgName);
    const handlers = this.handlerMap.get(mesgName);
    let promises = [];
    /// handle a call from the network
    if (toLocal) {
      if (!channel.LOCAL && !fromNet)
        throw Error(`'${mesgName}' for local calls remove channel prefix`);
      if (handlers) {
        handlers.forEach(handlerFunc => {
          /*/
          handlerFunc signature: (data,dataReturn) => {}
          handlerFunc has ulink_id property to note originating URCHAN object
          handlerFunc has fromNet property if it expects to receive network sourced calls
          /*/
          // skip calls that don't have their fromNet stat set if it's a net call
          if (fromNet && !handlerFunc.fromNet) {
            if (DBG)
              console.warn(
                `MessagerCall: [${mesgName}] skip netcall for handler uninterested in net`
              );
            return;
          }
          // skip "same origin" calls
          if (srcUID && handlerFunc.ulink_id === srcUID) {
            if (DBG)
              console.warn(
                `MessagerCall: [${mesgName}] skip call since origin = destination; use Signal() if intended`
              );
            return;
          }
          // Create a promise. if handlerFunc returns a promise, it follows
          let p = f_MakeResolverFunction(handlerFunc, inData);
          promises.push(p);
        }); // end foreach
      } else {
        // no handlers
        promises.push(
          Promise.resolve({ error: 'local message handler not found' })
        );
      }
    } // to local

    // end if handlers
    /// resolver function
    /// remember MESSAGER class is used for more than just Network Calls
    /// the state manager also uses it, so the resolved value may be of any type
    function f_MakeResolverFunction(handlerFunc) {
      return new Promise(resolve => {
        let retval = handlerFunc(inData, {
          /*control functions go here*/
        });
        resolve(retval);
      });
    }
    /// toNetwork
    if (toNet) {
      if (!channel.NET) throw Error('net calls must use NET: message prefix');
      type = type || 'mcall';
      let pkt = new NetPacket(mesgName, inData, type);
      let p = pkt.PromiseTransaction();
      promises.push(p);
    } // end toNetwork

    /// do the work
    let resArray = await Promise.all(promises);
    let resObj = Object.assign({}, ...resArray);
    return resObj;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Get list of messages that are handled by this Messager instance.
   * @returns {Array<string>} message name strings
   */
  MessageNames() {
    let handlers = [];
    this.handlerMap.forEach((set, key) => {
      handlers.push(key);
      if (DBG) console.log(`handler: ${key}`);
    });
    return handlers;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Get list of messages that are published to the network
   * @returns {Array<string>} message name strings
   */
  NetMessageNames() {
    let handlers = [];
    this.handlerMap.forEach((set, key) => {
      let addMessage = false;
      // eslint-disable-next-line no-return-assign, no-bitwise
      set.forEach(func => (addMessage |= func.fromNet === true));
      if (addMessage) handlers.push(key);
    });
    return handlers;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Check to see if a message is handled by this Messager instance
   * @param {string=''} msg message name to check
   * @returns {boolean} true if message name is handled
   */
  HasMessageName(msg = '') {
    return this.handlerMap.has(msg);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Ensure that the passed message names really exist in this Messager
   * instance
   * @param {Array<string>} msgs
   */
  ValidateMessageNames(msgs = []) {
    const valid = [];
    msgs.forEach(name => {
      if (this.HasMessageName(name)) valid.push(name);
      else
        throw new Error(`ValidateMessageNames() found invalid message '${name}'`);
    });
    return valid;
  }
} // class Messager

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Messager;
