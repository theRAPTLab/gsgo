/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS State Manager

  For use by modular application core features that require a centralized
  state object that can be shared between modules. It does something similar
  to Redux, but requires less boilerplate code.

  DATA STRUCTURES

  * vmStateEvent is an object with event-specific properties. When sent
    to subscribers, it contains a groupName property matching the name of
    the StateManager instance (e.g. LOCALE). This is not required (or even
    settable) when using SendState( vmStateEvent )

  TODO: Extend to support Networked State

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { expect } = require('@hapi/code');
const PROMPT = require('./util/prompts');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPT.makeStyleFormatter('USTATE', 'TagPink');
///
const VM_STATE = {}; // global viewstate
const GROUPS = new Map();
const PROPMAP = new Map();

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class StateMgr {
  /// CONSTRUCTOR /////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  constructor(groupName) {
    if (GROUPS.has(groupName)) throw Error('duplicate vmstate name');
    this.name = groupName.trim().toUpperCase();
    this.init = false;
    this.subs = new Set();
    this.queue = [];
    VM_STATE[this.name] = {};
    GROUPS.set(this.name, this);
    // bind 'this' for use with async code
    // if you don't do this, events will probably not have instance context
    this.State = this.State.bind(this);
    this.SendState = this.SendState.bind(this);
    this.SubscribeState = this.SubscribeState.bind(this);
    this.UnsubscribeState = this.UnsubscribeState.bind(this);
    this._initializeState = this._initializeState.bind(this);
    this._isValidState = this._isValidState.bind(this);
    this._mergeState = this._mergeState.bind(this);
    this._notifySubs = this._notifySubs.bind(this);
    this._enqueue = this._enqueue.bind(this);
    this._dequeue = this._dequeue.bind(this);
  }

  /// MAIN CLASS METHODS //////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Return a COPY of the current vmstate */
  State() {
    // const state = { ...VM_STATE[this.name] };
    const state = this._derefProps({ ...VM_STATE[this.name] });
    return state;
  }

  /** Handle a vmstate update from a subscribing module. It checks that
   *  the keys in the object are defined for this stategroup before
   *  queueing the action
   *  @param {object} vmStateEvent - object with group-specific props
   *  @param {string} vmStateEvent._group - mandatory event group
   */
  SendState(vmStateEvent, callback) {
    if (this._isValidState(vmStateEvent)) {
      const action = { vmStateEvent, callback };
      this._enqueue(action);
    } else throw Error('invalid vmState update received', vmStateEvent);
  }

  /** Subscribe to state. The subscriber function looks like:
   *  ( vmStateEvent, currentState ) => void
   */
  SubscribeState(subFunc) {
    if (typeof subFunc !== 'function') throw Error('subscriber must be function');
    if (this.subs.has(subFunc))
      console.warn(...PR('duplicate subscriber function'));
    this.subs.add(subFunc);
  }

  /** Unsubscribe state */
  UnsubscribeState(subFunc) {
    if (!this.subs.delete(subFunc))
      console.warn(...PR('function not subscribed for', this.name));
  }

  /// HELPER METHODS //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Set the state object directly. used to initialize the state from within
   *  an appcore module. skips state validation because the VM_STATE entry
   *  is an empty object
   */
  _initializeState(stateObj) {
    // only allow this once per instance
    if (this.init) throw Error(`attempt to reinitialize ${this.name}`);
    // make sure stateObj has only lower_case keys
    Object.keys(stateObj).forEach(k => {
      if (k.toLowerCase() !== k)
        throw Error(`${k} vmstate props must be lowercase`);
    });
    // check that VM_STATE entry is valid (should be created by constructor)
    if (VM_STATE[this.name]) {
      Object.keys(stateObj).forEach(k => {
        // skip the viewStateEvent key
        if (k === '_group') return;
        // check for duplicate keys. they must be unique across ALL state groups
        const assTo = PROPMAP.get(k);
        if (assTo !== undefined) throw Error(`${k} already assigned to ${assTo}`);
        // register the property name so it can't be used by another manager
        PROPMAP.set(k, this.name);
      });
      VM_STATE[this.name] = stateObj; // initialize!
      this.init = true;
    } else throw Error(`${this.name} does't exist in VM_STATE`);
  }

  /** Return true if the event object conforms to expectations (see below) */
  _isValidState(vmStateEvent) {
    // test 1 - is this event handled this manager instance?
    // const grp = vmStateEvent._group.trim().toUpperCase();
    // if (grp !== this.name) return false;

    // test 2 - any keys must already be defined in the store to
    // avoid typo-based errors and other such crapiness
    const curState = VM_STATE[this.name];
    let keysOk = true;
    Object.keys(vmStateEvent).forEach(k => {
      keysOk = keysOk && curState[k] !== undefined;
    });
    return keysOk;
  }

  /** Scan the object properties for arrays, and mutate with a new array.
   *  In the case of an array containing references, the references will still
   *  be the same but the array itself will be different
   */
  _derefProps(vmStateEvent) {
    Object.keys(vmStateEvent).forEach(k => {
      if (Array.isArray(vmStateEvent[k])) vmStateEvent[k] = [...vmStateEvent[k]];
    });
    return vmStateEvent;
  }

  /** Take a vmstate event object and update the VM_STATE entry with
   *  its property values. This creates an entirely new state object
   */
  _mergeState(vmStateEvent) {
    if (!this._isValidState(vmStateEvent)) return;
    // first make a new state object with copies of arrays
    const newState = this._derefProps({
      ...VM_STATE[this.name],
      ...vmStateEvent
    });
    // set the state
    VM_STATE[this.name] = newState;
  }

  /** Forward the event to everyone. The vmStateEvent object contains
   *  properties that changed, and the shape matches the initializing object
   */
  _notifySubs(vmStateEvent) {
    const subs = [...this.subs.values()];
    vmStateEvent.stateGroup = this.name; // mixed-case names reserved by system
    // also include the total state
    const currentState = this._derefProps({ ...VM_STATE[this.name] });
    subs.forEach(sub => sub(vmStateEvent, currentState));
  }

  /** Placeholder queueing system that doesn't do much now */
  _enqueue(action) {
    this.queue.push(action);
    // placeholder processes immediately
    this._dequeue();
  }

  /** Placeholder dequeing system that doesn't do much now */
  _dequeue() {
    const callbacks = [];
    let action = this.queue.shift();
    while (action !== undefined) {
      const { vmStateEvent, callback } = action;
      this._mergeState(vmStateEvent);
      this._notifySubs(vmStateEvent);
      if (typeof callback === 'function') callbacks.push(callback);
      action = this.queue.shift();
    }
    callbacks.forEach(f => f());
  }
}

/// TESTING PLAYGROUND ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ERRS = [];
try {
  const vms = new StateMgr('Test');
  expect(vms.name).to.be.equal('TEST'); // state names are forced to uppercase
} catch (e) {
  ERRS.push([e.message, 'color:white;background-color:orange;padding:2px 4px']);
}
if (ERRS.length) {
  console.group(...PR('RUNTIME CLASS VALIDATION ERRORS'));
  ERRS.forEach(([message, css], idx) => {
    console.log(`${idx}\n%c${message}`, css);
  });
  console.groupEnd();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = StateMgr;
