/* eslint-disable @typescript-eslint/no-use-before-define */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The StateGroupMgr class managed collection of "state groups" that are stored
  in a single master STATE object. The static methods of StateGroup are the
  external API to find a particular StateGroupMgr.

  StateGroupMgr instances are created by APPCORE modules, which each handle a
  particular application-specific set of operations. State is considered as
  "transient data" that is useful for remembering (1) what "mode" the app is in
  and (2) providing datastructures that can be rendered directly by the user
  interface as is. APPCORE is the bridge between pure data models, user
  interface, and controller/viewmodel logic.

  METHODS: see docs/02-arch/02-state.md for operations

  NOTES:

  This implementation of StateGroupMgr does not maintain "queues" of action
  calls which would help control overlapping asynchronous operations. When the
  base version is stable, we'll add that.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const PROMPT = require('./util/prompts');
const URDB = require('./client-urdb');

const DBG = true;
const PR = PROMPT.makeStyleFormatter('STATEGROUP', 'TagDkOrange');

/// REACT STATE COMPATIBLE FLAT OBJECTS ///////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this GSTATE object is shared across all instances of StatePacket
 */
const GSTATE = {};
const SMGRS = new Map(); // modulename -> class instance

/// HELPERS: GLOBAL STATE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** internal
 *  return shallow clone objects and array values
 */
function u_DerefValue(value) {
  if (Array.isArray(value)) return [...value];
  if (typeof value === 'object') return { ...value };
  return value;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** internal:
 *  Check if GSTATE contains a "key group" with a particular property. You can
 *  check just that the key exists, or a key.prop.
 */
function u_StateHas(key, prop) {
  const keys = Object.keys(GSTATE);
  if (prop === undefined) return keys.includes(key);
  const props = Object.keys(GSTATE[key]);
  return props.includes(prop);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** internal:
 *  For initial setup of the global GSTATE object. The keys in the GSTATE object
 *  determine what keys exist and what can be changed. It does not check
 *  whether the calling StateGroupMgr instance has permission to change it,
 *  so it's used only during instance initialization inside an appcore module,
 *  which configures its managed state keys to detect errors.
 *  This is called by every instance of StateGroupMgr on init, and it makes
 *  sure that a key is not being overwritten because all state group keys
 *  must be unique.
 *  @param {object} stateObj - an object literal with group keys and values
 *  @return {Array<string>} - list of keys
 */
function u_SetStateKeys(stateObj) {
  if (typeof stateObj !== 'object')
    throw Error('u_SetStateKeys requires an object with group keys');
  const initKeys = Object.keys(stateObj);
  if (DBG) console.log(...PR(`Writing ${initKeys.length} groups into GSTATE`));
  initKeys.forEach(key => {
    const ng = stateObj[key];
    if (GSTATE[key]) {
      const og = GSTATE[key];
      console.error(...PR(`GSTATE[${key}] collision`));
      console.log(...PR('existing state:', og));
      console.log(...PR('conflict state:', ng));
    }
    GSTATE[key] = stateObj[key];
  });
  return initKeys; // the list of group names found
}

/// CLASS STATEPACKET  ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Check if GSTATE contains a "group" with a particular property */
class StateGroupMgr {
  constructor(moduleName) {
    this.subs = new Set();
    this.changeHooks = new Set();
    this.effectHooks = new Set();
    if (SMGRS.has(moduleName))
      throw Error(`modulename already exists: ${moduleName}`);
    this.name = moduleName;
    SMGRS.set(moduleName, this);
    this.validKeys = new Set();

    // bind methods that will be called by an initial async event (e.g. ui handlers)
    this.updateKey = this.updateKey.bind(this);
    this.stateObj = this.stateObj.bind(this);
    this.flatStateValue = this.flatStateValue.bind(this);

    // these need to be bound when dereferenced from an appcore module running
    // during module init
    this.addChangeHook = this.addChangeHook.bind(this);
    this.addEffectHook = this.addEffectHook.bind(this);
    this.deleteChangeHook = this.deleteChangeHook.bind(this);
    this.deleteEffectHook = this.deleteEffectHook.bind(this);

    // these are internal state for appcore use that might be invoked async
    this._getKey = this._getKey.bind(this);
    this._smartUpdate = this._smartUpdate.bind(this);
    this._handleChange = this._handleChange.bind(this);
    this._publishState = this._publishState.bind(this);
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
      // graphQL interfaces should match the state group/key/prop format
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

  /// MAIN GSTATE ACCESS METHODS ///////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** main method to update a key.
   *  this does NOT fire publish or change handlers
   */
  updateKey(objOrKey, value) {
    let retObj = {};

    // signature 1: arg is an object literal
    if (typeof objOrKey === 'object') {
      if (value !== undefined) throw Error('unexpected parameter types');
      Object.keys(objOrKey).forEach(key => {
        // note recursive call to self returning change object
        const change = this.updateKey(key, objOrKey[key]);
        Object.assign(retObj, change);
      });
      return retObj;
    }
    // signature 2: args are prop + valueObj
    if (typeof objOrKey !== 'string')
      throw Error('arg must be keystring or object literal with keys');
    if (value === undefined) throw Error('arg2 must be object literal');
    if (!this.hasKey(objOrKey))
      console.warn(
        ...PR(
          `key '${objOrKey}' not in validKeys for '${this.name}'`,
          this.validKeys
        )
      );
    GSTATE[objOrKey] = u_DerefValue(value);
    return { [objOrKey]: GSTATE[objOrKey] };
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** strict method to update a prop inside a key item
   *  this does NOT fire publish or change handlers
   */
  updateKeyProp(key, prop, value) {
    if (typeof key !== 'string') throw Error(`arg1 ${key} must be string`);
    if (typeof prop !== 'string') throw Error(`arg2 ${prop} must be string`);
    if (value === undefined) throw Error(`arg3 ${value} must be object literal`);
    if (!this.hasKey(key)) {
      console.warn(
        ...PR(`updateKeyProp: group '${key}' not managed by this state`)
      );
      return {};
    }
    if (!u_StateHas(key, prop)) {
      console.warn(
        ...PR(`updateKeyProp: ${key}.${prop} doesn't exist in smgr ${this.name}`)
      );
      return {};
    }
    GSTATE[key][prop] = value;
    const update = { [key]: { [prop]: value } };
    return update;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return a { [group]:{ [key]: value }} object consistently */
  newStateObj(a, b, c) {
    const group = this.name;
    if (c === undefined) return { [group]: { [a]: b } };
    return { [group]: { [a]: { [b]: c } } };
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** returns an object literal containing the keys of this instance,
   *  but only if the keys are actually managed by this group.
   *  Returns { [group] : { [key] : valueObj } }
   */
  stateObj(...keys) {
    // if no args, return all the keys associated with this state mgr
    keys = keys.length > 0 ? keys : [...this.validKeys.values()];
    const returnState = {};
    keys.forEach(key => {
      if (!this.hasKey(key)) {
        console.warn(...PR(`stateObj: key '${key}' not managed by this smgr`));
      } else Object.assign(returnState, { [key]: GSTATE[key] });
    });
    // console.log('stateObj returning', returnState);
    return { [this.name]: returnState };
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return the actual mutate-safe value
   */
  flatStateValue(key) {
    if (!this.hasKey(key)) {
      console.warn(...PR(`stateObj: key '${key}' not managed by this smgr`));
      return undefined;
    }
    const val = GSTATE[key];
    if (Array.isArray(val)) return val.slice();
    if (typeof val === 'object') return { ...val };
    return val;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return value of a given key
   *  unlike stateObj(), this returns the actual reference object for direct
   *  mutation
   */
  _getKey(key) {
    // if no args, return all the groups associate with this state
    if (typeof key !== 'string') {
      console.warn(...PR('_getKey: bad arg', key));
      return undefined;
    }
    return GSTATE[key]; // remember, GSTATE is flat!
  }

  /// GSTATE CHANGE SUBSCRIPTIONS //////////////////////////////////////////////
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
    if (!this.subs.delete(stateHandler))
      console.warn(...PR('func was not in subscription set'));
  }

  /// INCOMING GSTATE CHANGES & SUB NOTIFICATION ///////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Before state is written, changeHooks get a chance to modify the key,
   *  prop, value. These changeHooks can also be used to fire side effects
   *  though maybe that is not a good pattern.
   *  If a hook function returns an array, those become the new k p v for the
   *  next hook.
   */
  _handleChange(key, propOrValue, propValue) {
    const hooks = [...this.changeHooks.values()];
    let k = key;
    let p = propOrValue;
    let v = propValue;
    // process kpv through each hook, which will return array [kpv]
    hooks.forEach(hook => {
      const result = hook(k, p, v);
      if (Array.isArray(result)) {
        k = result[0];
        p = result[1];
        v = result[2];
      }
    });
    this._smartUpdate(k, p, v);
  }
  /// UPDATE GSTATE ///////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** we can either handle 'key, { [prop]:value }' or 'key, prop, value' so have to
   *  detect what we're getting
   */
  _smartUpdate(key, a, b) {
    if (b === undefined) {
      this.updateKey(key, a);
      this._publishState({ [key]: a });
    } else {
      this.updateKeyProp(key, a, b);
      this._publishState({ [key]: { [a]: b } });
    }
    // after update is complete, issue registered callbacks
    const effects = [...this.effectHooks.values()];
    effects.forEach(fx => fx(key, a, b));
  }
  /// PUBLISH GSTATE //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoke React-style 'setState()' method with change object. If no object
   *  is provided, all state groups are sent in a new object. Otherwise,
   *  the stateObj is passed as is. It should
   */
  _publishState(stateObj) {
    let data;
    if (stateObj === undefined) data = this.stateObj();
    if (typeof stateObj !== 'object')
      throw Error('if arg provided, must be object');
    else {
      const keys = Object.keys(stateObj);
      if (!keys.every(g => u_StateHas(g))) {
        const json = JSON.stringify(stateObj);
        const err = `stateObj does not align with GSTATE key: ${json}`;
        console.error(...PR(err));
        throw Error(err);
      }
    }
    const subs = [...this.subs.values()];
    subs.forEach(sub =>
      sub(stateObj, () => {
        /* unused callback */
      })
    );
  }

  /// GSTATE REWRITING ///////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Intercept state changer logic, allowing the intercepting function to alter
   *  by returning an optional [key,prop,value] array. Returning undefined
   *  will tell the state changer to process as normal
   */
  addChangeHook(filterFunc) {
    if (typeof filterFunc !== 'function')
      throw Error(
        'arg1 must be a function to receive key,name,value, returning opt array'
      );
    this.changeHooks.add(filterFunc);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Remove the hookFunction from the hook interceptors, if it's part of the set
   */
  deleteChangeHook(filterFunc) {
    if (typeof filterFunc !== 'function')
      throw Error(
        'arg1 must be function  method to receive key,name,value and return true=handled '
      );
    if (!this.changeHooks.delete(filterFunc))
      console.warn(...PR('func was not in changeHooks set'));
  }

  /// GSTATE UPDATE SIDE EFFECTS ////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Side effect hooks are run after all the changeHooks are processed for a
   *  given state update initiated by updateKey() or updateKeyProp()
   */
  addEffectHook(effectFunc) {
    if (typeof effectFunc !== 'function')
      throw Error(
        'arg1 must be function method to receive key,name,value side effect'
      );
    this.effectHooks.add(effectFunc);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Remove Side effect hook
   */
  deleteEffectHook(effectFunc) {
    if (typeof effectFunc !== 'function')
      throw Error(
        'arg1 must be a function previously-registered with addEffectHook()'
      );
    if (!this.effectHooks.delete(effectFunc))
      console.warn(...PR('func was not in effectHook set'));
  }
} // end class StatePacket

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns the state groups provided. If no args provided, the entire
 *  state object (copy) is provided. The primary keys will be the contents
 *  of each state group's keys
 */
StateGroupMgr.ReadStateGroups = (...smgrNames) => {
  const retObj = {};
  if (smgrNames.length === 0) smgrNames = Object.keys(GSTATE);
  if (smgrNames.length === 0) {
    console.warn(...PR('ReadStateGroups() found no state. Called too early?'));
    return {};
  }
  smgrNames.forEach(name => {
    const smgr = SMGRS.get(name);
    if (smgr === undefined) {
      console.warn(...PR(`ReadStateGroups: SMGR[${name}] doesn't exist`));
      return;
    }
    const keys = smgr.stateObj(); // returns { [group]:{ [key]: value } }
    Object.assign(retObj, keys); // return group
  });
  return retObj;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a flattened version of ReadStateGroups(). Useful for setting
 *  initial state of component with everything at root level
 */
StateGroupMgr.ReadFlatStateGroups = (...smgrNames) => {
  const sgroups = StateGroupMgr.ReadStateGroups(...smgrNames);
  const gnames = Object.keys(sgroups);
  const flatState = {};
  gnames.forEach(gn => {
    const keyObj = sgroups[gn];
    Object.assign(flatState, keyObj);
  });
  return flatState;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** selector variations are:
 *  selector = group, key, propOrValue, value
 *  selector = group.key, propOrValue, value
 */
StateGroupMgr.WriteState = (selector, ...args) => {
  const arr = selector.split('.');
  if (arr.length < 1 || arr.length > 2) throw Error(`bad selector '${selector}'`);
  const [smgrName, key] = arr;
  const smgr = SMGRS.get(smgrName);
  if (smgr === undefined) {
    console.warn(...PR(`WriteState: statemgr[${smgrName}] doesn't exist`));
    return {};
  }
  if (key === undefined) return smgr._handleChange(...args); // key, prop, value
  return smgr._handleChange(key, ...args); // key, prop, value
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
StateGroupMgr.SubscribeState = (smgrName, handler) => {
  const smgr = SMGRS.get(smgrName);
  if (smgr === undefined) {
    console.warn(...PR(`SubscribeState: statemgr[${smgrName}] doesn't exist`));
    return;
  }
  smgr.subscribe(handler);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
StateGroupMgr.UnsubscribeState = (smgrName, handler) => {
  const smgr = SMGRS.get(smgrName);
  if (smgr === undefined) {
    console.warn(...PR(`UnsubscribeState: statemgr[${smgrName}] doesn't exist`));
    return;
  }
  smgr.unsubscribe(handler);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
StateGroupMgr.AddStateChangeHook = (smgrName, filterFunc) => {
  const smgr = SMGRS.get(smgrName);
  if (smgr === undefined) {
    console.warn(...PR(`AddHookChange: statemgr[${smgrName}] doesn't exist`));
    return;
  }
  smgr.addChangeHook(filterFunc);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
StateGroupMgr.DeleteStateChangeHook = (smgrName, filterFunc) => {
  const smgr = SMGRS.get(smgrName);
  if (smgr === undefined) {
    console.warn(...PR(`DeleteHookChange: statemgr[${smgrName}] doesn't exist`));
    return;
  }
  smgr.deleteChangeHook(filterFunc);
};

/// DEBUG HACK ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
window.state = group => {
  if (typeof group !== 'string') return GSTATE;
  const state = GSTATE[group];
  if (state) return state;
  const validGroups = Object.keys(GSTATE)
    .map(n => n)
    .join(' ');
  return `error: ${group} doesn't exist in [${validGroups}]`;
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = StateGroupMgr;
