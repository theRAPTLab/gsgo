/* eslint-disable @typescript-eslint/no-use-before-define */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The StateGroup class managed collection of "state groups" that are stored in
  a single master STATE object.

  STATE VALUES

  * new StateGroup( queryOrStateObj )
  * async initializeState( queryOrStateObj )
  * updateKey( name,groupObj | stateObj ) - sets entire groups by key
  * updateKeyProp( name, prop, value ) - sets specific prop within group
  * stateObj(...args) - return a stateObj with specified keys, or entire state

  STATE CHANGE REQUESTS

  * handleChange( key,prop,value ) - incoming changes written to state and published
  * addChangeHook( filterFunc ) - func receives key,prop,value

  STATE CHANGE NOTIFICATIONS

  * subscribe( stateHandler ) - handler receives stateObj, optional callback
  * publishState( stateObj ) - outgoing send stateObj to subscribers

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const PROMPT = require('./util/prompts');
const URDB = require('./client-urdb');

const DBG = true;
const PR = PROMPT.makeStyleFormatter('STATEGROUP', 'TagDkOrange');

/// REACT STATE COMPATIBLE FLAT OBJECTS ///////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this STATE object is shared across all instances of StatePacket
 */
const STATE = {};

/// HELPER: GLOBAL STATE //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** internal:
 *  Check if STATE contains a "key group" with a particular property. You can
 *  check just that the key exists, or a key.prop.
 */
function u_StateHas(key, prop) {
  const keys = Object.keys(STATE);
  if (prop === undefined) return keys.includes(key);
  const props = Object.keys(STATE[key]);
  return props.includes(prop);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** internal:
 *  For initial setup of the global STATE object. The keys in the STATE object
 *  determine what groups exist and what can be changed. It does not check
 *  whether the calling StateGroupMgr instance has permission to change it,
 *  so it's used only during instance initialization inside an appcore module,
 *  which configures its managed state keys to detect errors.
 *  This is called by every instance of StateGroupMgr on init, and it makes
 *  sure that a key is not being overwritten because all state group keys
 *  must be unique.
 *  @param {object} stateObj - an object literal with group keys and values
 *  @return {Array<string>} - list of groupnames found in
 */
function u_SetStateKeys(stateObj) {
  if (typeof stateObj !== 'object')
    throw Error('u_SetStateKeys requires an object with group keys');
  const initGroups = Object.keys(stateObj);
  if (DBG) console.log(...PR(`Writing ${initGroups.length} groups into STATE`));
  initGroups.forEach(grp => {
    const ng = stateObj[grp];
    if (STATE[grp]) {
      const og = STATE[grp];
      console.error(...PR(`STATE[${grp}] collision`));
      console.log(...PR('existing state:', og));
      console.log(...PR('conflict state:', ng));
    }
    STATE[grp] = stateObj[grp];
  });
  return initGroups; // the list of group names found
}

/// CLASS STATEPACKET  ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Check if STATE contains a "group" with a particular property */
class StateGroupMgr {
  constructor(qs_or_obj) {
    this.subs = new Set();
    this.hooks = new Set();
    this.validKeys = new Set();
    // bind methods that will be called by async events
    this.updateKey = this.updateKey.bind(this);
    if (qs_or_obj !== undefined) this.initializeState(qs_or_obj);
  }

  /** Called once during app bootstrap. If you have any subscribers that need to
   *  run, make sure you define them with SubscribeState() before calling this
   *  method.
   *  @param {string|object} qsORobj - a GraphQL SDL query string or a state
   *  object
   *  @param {object} options - options
   *  @param {boolean} options.publish - whether or not to also publish the
   *  state change to subscribers
   */
  async initializeState(qs_or_obj) {
    let response;
    if (typeof qs_or_obj === 'string') {
      const query = qs_or_obj;
      response = await URDB.Query(query);
      if (response.errors) throw Error(`GraphQL error: ${response.errors}`);
      u_SetStateKeys(response.data).forEach(name => {
        this.validKeys.add(name);
      });
    } else if (typeof qs_or_obj === 'object') {
      u_SetStateKeys(qs_or_obj).forEach(name => {
        this.validKeys.add(name);
      });
    } else {
      throw Error(
        'InitializeState arg1 is either a GraphQL Query String or a state object'
      );
    }
  }
  /** return true if this state packet has the specified groupName */
  hasKey(stateKey) {
    return this.validKeys.has(stateKey);
  }

  /// MAIN STATE ACCESS METHODS ///////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** main method to update a key */
  updateKey(arg, secObj) {
    let retObj = {};

    // signature 1: arg is an object literal
    if (typeof arg === 'object') {
      if (secObj !== undefined) throw Error('unexpected parameter types');
      Object.keys(arg).forEach(key =>
        Object.assign(retObj, this.updateKey(key, arg[key]))
      );
      return retObj;
    }
    // signature 2: arg is string, secObj is value
    if (typeof arg !== 'string')
      throw Error('arg must be string or object literal');
    if (secObj === undefined) throw Error('arg2 must be object literal');
    if (!this.hasKey(arg))
      throw Error(`group '${arg}' not managed by this state`);
    STATE[arg] = secObj;
    retObj = { [arg]: STATE[arg] };
    return retObj;
  }
  /** main method to update a prop inside a key item */
  updateKeyProp(key, prop, value) {
    if (typeof key !== 'string') throw Error('arg1 must be string');
    if (typeof prop !== 'string') throw Error('arg2 must be string');
    if (value === undefined) throw Error('arg3 must be object literal');
    if (!this.hasKey(key))
      throw Error(`group '${key}' not managed by this state`);
    if (!u_StateHas(key, prop))
      throw Error(`no such prop '${prop}' in group '${key}'`);
    STATE[key][prop] = value;
    const update = { [key]: { [prop]: value } };
    return update;
  }
  /** returns an object literal containing all managed state of this instance */
  stateObject(...args) {
    // if no args, return all the groups associate with this state
    let keys = args.length > 0 ? args : [...this.validKeys.values()];
    const returnState = {};
    keys.forEach(key => {
      if (!this.hasKey(key))
        console.warn(...PR(`group '${key}' not managed by this state`));
      else Object.assign(returnState, { [key]: STATE[key] });
    });
    return returnState;
  }

  /// STATE CHANGE SUBSCRIPTIONS //////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** React components can receive notification of state changes here.
   *  Make sure that the setStateMethod is actually bound to 'this' in the
   *  constructor of the component!
   */
  subscribe(stateHandler) {
    if (typeof stateHandler !== 'function')
      throw Error(
        'arg1 must be a method in a Component that receives change, keyname'
      );
    this.subs.add(stateHandler);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** For components that mount/unmount, you should make sure you unsubscribe
   *  to avoid memory leaks. For classes use componentWillUnmoun().
   */
  unsubscribe(stateHandler) {
    if (typeof stateHandler !== 'function')
      throw Error(
        'arg1 must be a method in a Component that receives change, keyname'
      );
    this.subs.delete(stateHandler);
  }

  /// INCOMING STATE CHANGES & SUB NOTIFICATION ///////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** handles the state change call after getting a chance to update this
   *  modules state. If any hooks return a truthy value, it is considered
   *  handled and the normal update/pbulish cycle isn't automatically invoked
   */
  handleChange(key, prop, value) {
    const hooks = [...this.hooks.values()];
    const results = hooks.map(hook => hook(key, prop, value));
    let handledCount = 0;
    results.forEach(res => {
      if (!Array.isArray(res)) return;
      handledCount++;
      const [g, n, v] = res;
      this.updateKeyProp(g, n, v);
      this.publishState({ [g]: { [n]: v } });
    });
    if (handledCount) return;
    // if there are no state changes intercepted, the normal Update/Publish
    // is run.
    this.updateKeyProp(key, prop, value);
    this.publishState({ [key]: { [prop]: value } });
  }
  /** Invoke React-style 'setState()' method with change object. If no object
   *  is provided, all state groups are sent in a new object. Otherwise,
   *  the stateObject is passed as is. It should
   */
  publishState(stateObj) {
    let data;
    if (stateObj === undefined) data = this.stateObject();
    if (typeof stateObj !== 'object')
      throw Error('if arg provided, must be object');
    else {
      const keys = Object.keys(stateObj);
      if (!keys.every(g => u_StateHas(g))) {
        const json = JSON.stringify(stateObj);
        const err = `stateObj does not align with STATE key: ${json}`;
        console.error(...PR(err));
        throw Error(err);
      }
      data = stateObj;
    }
    const subs = [...this.subs.values()];
    subs.forEach(sub =>
      sub(data, () => {
        /* unused callback */
      })
    );
  }

  /// STATE REWRITING ///////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Intercept state changer logic, allowing the intercepting function to alter
   *  by returning an optional [key,prop,value] array. Returning undefined
   *  will tell the state changer to process as normal
   */
  addChangeHook(filterFunc) {
    if (typeof hookFunction !== 'function')
      throw Error(
        'arg1 must be a function to receive key,name,value, returning opt array'
      );
    this.hooks.add(filterFunc);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Remove the hookFunction from the hook interceptors, if it's part of the set
   */
  deleteChangeHook(filterFunc) {
    if (typeof hookFunction !== 'function')
      throw Error(
        'arg1 must be function  method to receive key,name,value and return true=handled '
      );
    this.hooks.delete(filterFunc);
  }
} // end class StatePacket

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = StateGroupMgr;
