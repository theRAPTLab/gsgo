/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  View Model State Manager

  For use by modular application core features (i.e. APPCORE)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const PROMPT = require('./util/prompts');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPT.makeStyleFormatter('VMSTATE', 'TagUR');
///
const VM_STATE = {}; // global viewstate
const GROUPS = new Map();
const PROPMAP = new Map();

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export class ViewModelState {
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
  }

  /// MAIN CLASS METHODS //////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return the current vmstate */
  State = () => VM_STATE[this.name];

  /** handle a vmstate update from a subscribing module */
  SendState = vmStateEvent => {
    // receive { type, ...data }
    if (this._isValidState(vmStateEvent)) {
      this._enqueue(vmStateEvent);
    }
  };

  /** subscribe to state */
  SubscribeState = subFunc => {
    if (typeof subFunc !== 'function') throw Error('subscriber must be function');
    if (this.subs.has(subFunc))
      console.warn(...PR('duplicate subscriber function'));
    this.subs.add(subFunc);
  };

  /** unsubscribe state */
  UnsubscribeState = subFunc => {
    if (!this.subs.delete(subFunc))
      console.warn(...PR('function not subscribed for', this.nam));
  };

  /// HELPER METHODS //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** set the state object directly. used to initialize the state from within
   *  an appcore module. skips state validation because the VM_STATE entry
   *  is an empty object
   */
  _initializeState = stateObj => {
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
        if (k === 'type') return;
        // check for duplicate keys. they must be unique across ALL state groups
        const assTo = PROPMAP.get(k);
        if (assTo !== undefined) throw Error(`${k} already assigned to ${assTo}`);
        // register the property name so it can't be used by another manager
        PROPMAP.set(k, this.name);
      });
      VM_STATE[this.name] = stateObj; // initialize!
      this.init = true;
    } else throw Error(`${this.name} does't exist in VM_STATE`);
  };

  /** return true if the state event matches this manager's name */
  _isValidState = vmStateEVent => {
    // test 1 - is this event handled this manager instance?
    const type = vmStateEVent.type.trim().toUpperCase();
    if (type !== this.name) return false;
    // test 2 - do the keys in event exist in state already?
    const curState = VM_STATE[this.name];
    let keysOk = true;
    Object.keys(vmStateEVent).forEach(k => {
      keysOk = keysOk && curState[k] !== undefined;
    });
    return keysOk;
  };

  /** take a vmstate object and update the VM_STATE entry */
  _mergeState = vmStateEvent => {
    if (!this._isValidState(vmStateEvent)) return;
    // we want to merge with special processing for array types
    // first make a new state object
    const newState = { ...VM_STATE[this.name], ...vmStateEvent };
    // then duplicate arrays if there are any
    Object.keys(newState).forEach(k => {
      if (Array.isArray(newState[k])) newState[k] = [...newState[k]];
    });
  };

  /** forward the event to everyone */
  _notifySubs = vmStateEvent => {
    const subs = [...this.subs.values()];
    subs.forEach(sub => sub(vmStateEvent));
  };

  /** placeholder queueing system that doesn't do much now */
  _enqueue = vmStateEvent => {
    this.queue.push(vmStateEvent);
    // placeholder processes immediately
    this._dequeue();
  };

  /** placeholder dequeing system that doesn't do much now */
  _dequeue = () => {
    let vmStateEvent = this.queue.unshift();
    while (vmStateEvent !== undefined) {
      this._mergeState(vmStateEvent);
      this._notifySubs(vmStateEvent);
      vmStateEvent = this.queue.unshift();
    }
  };
}

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
