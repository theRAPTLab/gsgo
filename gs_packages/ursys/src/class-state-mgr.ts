/* eslint-disable @typescript-eslint/no-use-before-define */
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
  * The difference between vmStateEvent and vmState is that the latter is
    the complete state object, whereas the event has the same shape but
    only includes the changed properties

  TODO: Extend to support Networked State

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// TYPE IMPORTS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import { TStateObject } from '../types';

/// LIBRARY IMPORTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// const { expect } = require('@hapi/code');
const PROMPT = require('./util/prompts');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPT.makeStyleFormatter('USTATE', 'TagPink');
///
const VM_STATE = {}; // global viewstate
const GROUPS = new Map();
const PROPMAP = new Map();

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class StateMgr {
  name: string;
  init: boolean;
  subs: Set<any>;
  queue: any[];
  taps: any[];
  effects: any[];

  /// CONSTRUCTOR /////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  constructor(groupName) {
    if (GROUPS.has(groupName)) throw Error('duplicate clonedEvent name');
    this.name = groupName.trim().toUpperCase();
    this.init = false;
    this.subs = new Set();
    this.queue = [];
    this.taps = [];
    this.effects = [];
    VM_STATE[this.name] = {};
    GROUPS.set(this.name, this);
    // bind 'this' for use with async code
    // if you don't do this, events will probably not have instance context
    this.State = this.State.bind(this);
    this.SendState = this.SendState.bind(this);
    this.SubscribeState = this.SubscribeState.bind(this);
    this.UnsubscribeState = this.UnsubscribeState.bind(this);
    this.QueueEffect = this.QueueEffect.bind(this);
    this._initializeState = this._initializeState.bind(this);
    this._setState = this._setState.bind(this);
    this._insertStateEvent = this._insertStateEvent.bind(this);
    this._interceptState = this._interceptState.bind(this);
    this._isValidState = this._isValidState.bind(this);
    this._mergeState = this._mergeState.bind(this);
    this._notifySubs = this._notifySubs.bind(this);
    this._enqueue = this._enqueue.bind(this);
    this._dequeue = this._dequeue.bind(this);
    this._doEffect = this._doEffect.bind(this);
  }

  /// DEBUG UTILITIES /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /// MAIN CLASS METHODS //////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Return a COPY of the current clonedEvent */
  State(key: string) {
    // const state = { ...VM_STATE[this.name] };
    const state = this._derefProps({ ...VM_STATE[this.name] });
    if (typeof key === 'string' && key.length > 0) return state[key];
    return state;
  }

  /** Handle a clonedEvent update from a subscribing module. The incoming
   *  vmstateEvent is checked against the master state object to ensure it
   *  contains valid keys. Any filter functions are allowed to mutate a copy of
   *  the incoming state event.
   *  @param {object} vmStateEvent - object with group-specific props
   */
  SendState(vmStateEvent: TStateObject, callback: Function) {
    if (this._isValidState(vmStateEvent)) {
      const clonedEvent = this._cloneStateObject(vmStateEvent);
      this.taps.forEach(tap => tap(clonedEvent));
      // queue the action for processing
      const action = { vmStateEvent: clonedEvent, callback };
      this._enqueue(action);
    } else throw Error('SendState: invalid vmState update received, got:');
  }

  /** When executing a side effect from a component, use this method to
   *  hold it until after all state updates have completed, so the DOM
   *  is stable
   */
  QueueEffect(effectFunc) {
    if (typeof effectFunc !== 'function')
      throw Error('effect must be a function');
    this.effects.push(effectFunc);
    this._doEffect();
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

  /// CLASS HELPER METHODS ////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Set the state object directly. used to initialize the state from within
   *  an appcore module. skips state validation because the VM_STATE entry
   *  is an empty object
   */
  _initializeState(stateObj) {
    // only allow this once per instance
    if (this.init)
      throw Error(`_initializeState: store '${this.name}' already initialized`);
    // validate stateObj
    Object.keys(stateObj).forEach(k => {
      // must be all lowercase
      if (k.toLowerCase() !== k)
        throw Error(`_initializeState: props must be lowercase, not '${k}'`);
      // must not contain undefined keys
      if (stateObj[k] === undefined)
        throw Error(
          `_initializeState: prop '${k}' value can't be undefined (use null instead)`
        );
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

  /** In some cases, we want to update state but not trigger subscribers
   *  related to it. Alias for _mergeState()
   */
  _setState(stateObj) {
    this._mergeState(stateObj);
  }

  /** When SendState() is invoked, give the instance manager a change to
   *  inspect the incoming state and do a side-effect and/or a filter.
   *  They will run in order of interceptor registration
   *  @param {function} tapFunc - receive stateEvent to mutate or act-on
   */
  _interceptState(tapFunc) {
    if (typeof tapFunc !== 'function')
      throw Error(`'${tapFunc}' is not a function`);
    this.taps.push(tapFunc);
  }

  /** Allow synthesis of a state event by adding to queue without
   *  immediately executing it. For use by _interceptState only.
   *  Creates an action { vmStateEvent, callback }
   */
  _insertStateEvent(vmStateEvent, callback) {
    this._enqueue({ vmStateEvent, callback });
  }

  /** Return true if the event object conforms to expectations (see below) */
  _isValidState(vmState) {
    // test 1 - is this event handled this manager instance?
    // const grp = vmStateEvent._group.trim().toUpperCase();
    // if (grp !== this.name) return false;

    // test 2 - any keys must already be defined in the store to
    // avoid typo-based errors and other such crapiness
    const curState = VM_STATE[this.name];
    let keysOk = true;
    Object.keys(vmState).forEach(k => {
      const keyTest = keysOk && curState[k] !== undefined;
      if (keyTest === false) console.warn(`isValidState: '${k}' not a valid key`);
      keysOk = keysOk && keyTest;
    });
    return keysOk;
  }

  /** Scan the object properties for arrays, and mutate with a new array.
   *  In the case of an array containing references, the references will still
   *  be the same but the array itself will be different
   */
  _derefProps(vmState) {
    Object.keys(vmState).forEach(k => {
      if (Array.isArray(vmState[k])) vmState[k] = [...vmState[k]];
    });
    return vmState;
  }

  /** Utility method to clone state event. It handles array cloning as well but
   *  is otherwise a shallow clone
   */
  _cloneStateObject(vmState) {
    const clone = this._derefProps({ ...vmState });
    return clone;
  }

  /** Take a clonedEvent event object and update the VM_STATE entry with
   *  its property values. This creates an entirely new state object
   */
  _mergeState(vmState) {
    if (!this._isValidState(vmState)) return undefined;
    // first make a new state object with copies of arrays
    const newState = this._derefProps({
      ...VM_STATE[this.name],
      ...vmState
    });
    // set the state
    VM_STATE[this.name] = newState;
    // also return the new state object
    return newState;
  }

  /** Forward the event to everyone. The vmStateEvent object contains
   *  properties that changed only, appending a 'stateGroup' identifier
   *  that tells you who sent it. Sends a read-only copy.
   */
  _notifySubs(vmStateEvent) {
    // fire notification in the next event cycle to make sure
    // that prior unsubscribes took effect
    setTimeout(() => {
      const subs = [...this.subs.values()];
      vmStateEvent.stateGroup = this.name; // mixed-case names reserved by system
      // also include the total state
      const currentState = this._derefProps({ ...VM_STATE[this.name] });
      subs.forEach(sub => sub(vmStateEvent, currentState));
    });
  }

  /** Placeholder queueing system that doesn't do much now.
   *  An action is { vmStateEvent, callback }
   */
  _enqueue(action) {
    const { vmStateEvent, callback } = action;
    if (!this._isValidState(vmStateEvent)) {
      console.warn(...PR('bad vmStateEvent', vmStateEvent));
      return;
    }
    if (callback && typeof callback !== 'function') {
      console.warn(
        ...PR('call must be function, not', typeof callback, callback)
      );
      return;
    }
    this.queue.push(action);
    // placeholder processes immediately
    this._dequeue();
  }

  /** Placeholder dequeing system that doesn't do much now.
   *  An action is { vmStateEvent, callback }
   */
  _dequeue() {
    const callbacks = [];
    // iterate over all actions in queue
    let action = this.queue.shift();
    while (action !== undefined) {
      const { vmStateEvent, callback } = action;
      this._mergeState(vmStateEvent); // merge partial state into state
      this._notifySubs(vmStateEvent); // send partial state to subs
      if (typeof callback === 'function') callbacks.push(callback);
      // get next action in queue
      action = this.queue.shift();
    }
    // issues callbacks after ALL actions have completed
    callbacks.forEach(f => f());
    this._doEffect();
  }

  /** execute effect functions that have been queued, generally if there
   *  are no pending state changes
   */
  _doEffect() {
    if (this.queue.length > 0) return;
    setTimeout(() => {
      let effect = this.effects.shift();
      while (effect !== undefined) {
        effect();
        effect = this.effects.shift();
      }
    });
  }

  /// STATIC METHODS //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static RO_GetStateGroupByName(groupName) {
    if (typeof groupName !== 'string')
      throw Error(`${groupName} is not a string`);
    const bucket = groupName.trim().toUpperCase();
    if (bucket !== groupName)
      throw Error(`groupNames should be all uppercase, not ${bucket}`);
    const state = VM_STATE[bucket];
    if (!state) throw Error(`stateGroup ${bucket} is not defined`);

    // create a read-only copy of state and set all its properties to
    // unwriteable
    const readOnlyState = { ...state };
    for (const prop of Object.keys(readOnlyState)) {
      Object.defineProperty(readOnlyState, prop, {
        writable: false
      });
    }
    return readOnlyState;
  }
}

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a READ-ONLY object containing state for a particular group */

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = StateMgr;
