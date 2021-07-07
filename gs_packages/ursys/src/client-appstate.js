/* eslint-disable @typescript-eslint/no-use-before-define */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  pure data module for import by multiple modules that need to share this
  data

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const PROMPT = require('./util/prompts');
const URDB = require('./client-urdb');

const DBG = true;
const PR = PROMPT.makeStyleFormatter('APPSTATE', 'TagDkOrange');

/// REACT STATE COMPATIBLE FLAT OBJECTS ///////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This structure it populated by InitializeState. The top-level keys define
 *  what is allowed in all state operations afterwards. InitializeState should
 *  only be called once by the app startup once before any state references
 *  occur
 */
let STATE = {};

/// a Set of React-style 'setState( {change} )' methods
const SUBSCRIBERS = new Set(); // StateHandlers
const CHANGEHOOKS = new Set(); // methods to intercept changes before we get

/// HELPER: STATE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Check if STATE contains a "group" with a particular property */
function u_StateHas(group, prop) {
  const groups = Object.keys(STATE);
  if (prop === undefined) return groups.includes(group);
  const props = Object.keys(STATE[group]);
  return props.includes(prop);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Completely overwrite STATE object and optionally publish */
function u_SetStateAll(stateObj) {
  if (typeof stateObj !== 'object')
    throw Error('u_SetStateAll requires stateObj');
  STATE = stateObj;
  return STATE;
}

/// STATE INITIALIZATION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Called once during app bootstrap. If you have any subscribers that need to
 *  run, make sure you define them with SubscribeState() before calling this
 *  method.
 *  @param {string|object} qsORobj - a GraphQL SDL query string or a state
 *  object
 *  @param {object} options - options
 *  @param {boolean} options.publish - whether or not to also publish the
 *  state change to subscribers
 */
async function InitializeState(qs_or_obj) {
  let data;
  let response;
  if (typeof qs_or_obj === 'string') {
    const query = qs_or_obj;
    response = await URDB.Query(query);
    if (response.errors) throw Error(`GraphQL error: ${response.errors}`);
    data = response.data;
    u_SetStateAll(data);
  } else if (typeof qs_or_obj === 'object') {
    data = qs_or_obj;
    u_SetStateAll(data);
  } else {
    throw Error(
      'InitializeState arg1 is either a GraphQL Query String or a state object'
    );
  }
}

/// STATE MANIPULATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** set a STATE group if it exists and optionally publish */
function UpdateStateGroup(group, secObj) {
  if (typeof group !== 'string') throw Error('arg1 must be string');
  if (!u_StateHas(group)) throw Error(`group '${group}' does not exist`);
  if (secObj === undefined) throw Error('arg3 must be defined');
  STATE[group] = secObj;
  const update = { [group]: STATE[group] };
  return update;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function UpdateStateGroupProp(group, prop, value) {
  if (typeof group !== 'string') throw Error('arg1 must be string');
  if (typeof prop !== 'string') throw Error('arg2 must be string');
  if (value === undefined) throw Error('arg3 must be defined');
  if (!u_StateHas(group)) throw Error(`group '${group}' does not exist`);
  if (!u_StateHas(group, prop))
    throw Error(`no such prop '${prop}' in group '${group}'`);
  STATE[group][prop] = value;
  const update = { [group]: { [prop]: value } };
  return update;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the entire state object */
function ReadState() {
  if (Object.keys.length === 0) throw Error('STATE has not been initialized yet');
  return STATE;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Call in the constructor of a component that is using this UISTATE module,
 *  passing a list of string arguments of groups to include.
 *  Returns { [arg1]: sectionData, [arg2]: sectionData, ... }
 */
function ReadStateGroup(...groups) {
  const returnState = {};
  groups.forEach(group => {
    if (!u_StateHas(group)) console.warn(...PR(`group '${group}' not in STATE`));
    else Object.assign(returnState, { [group]: STATE[group] });
  });
  return returnState;
}

/// HELPER: SUBSCRIBERS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This is called from the component's handleChangeState() handler, which
 *  handles the state change call on its behalf after getting a chance to
 *  update this modules state. If any hooks return a truthy value, it is
 *  considered handled and the normal UpdateStateGroupProp()/PublishState() isn't
 *  invoked automatically
 */
function HandleStateChange(group, prop, value) {
  // if there are any hooks, call each one to give it opportunity
  // to change values if an array is returned in group, name, value order
  // This is done for EACH returned array.
  // if a boolean is returned
  const hooks = [...CHANGEHOOKS.values()];
  const results = hooks.map(hook => hook(group, prop, value));
  let handledCount = 0;
  results.forEach(res => {
    if (!Array.isArray(res)) return;
    handledCount++;
    const [g, n, v] = res;
    UpdateStateGroupProp(g, n, v);
    PublishState({ [g]: { [n]: v } });
  });
  if (handledCount) return;
  // if there are no state changes intercepted, the normal Update/Publish
  // is run.
  UpdateStateGroupProp(group, prop, value);
  PublishState({ [group]: { [prop]: value } });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Invoke React-style 'setState()' method with change object. If no object
 *  is provided, all state groups are sent in a new object. Otherwise,
 *  the changeObject is
 */
function PublishState(changeObj) {
  let data;
  if (changeObj === undefined) data = { ...STATE };
  if (typeof changeObj !== 'object')
    throw Error('if arg provided, must be object');
  else {
    const groups = Object.keys(changeObj);
    if (!groups.every(g => u_StateHas(g))) {
      const json = JSON.stringify(changeObj);
      const err = `changeObj does not align with STATE groups ${json}`;
      console.error(...PR(err));
      throw Error(err);
    }
    data = changeObj;
  }
  const subs = [...SUBSCRIBERS.values()];
  subs.forEach(sub => sub(data, () => {}));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** React components can receive notification of state changes here.
 *  Make sure that the setStateMethod is actually bound to 'this' in the
 *  constructor of the component!
 */
function SubscribeState(stateHandler) {
  if (typeof stateHandler !== 'function')
    throw Error(
      'arg1 must be a method in a Component that receives change, group'
    );
  SUBSCRIBERS.add(stateHandler);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** For components that mount/unmount, you should make sure you unsubscribe
 *  to avoid memory leaks. For classes use componentWillUnmoun().
 */
function UnsubscribeState(stateHandler) {
  if (typeof stateHandler !== 'function')
    throw Error(
      'arg1 must be a method in a Component that receives change, group'
    );
  SUBSCRIBERS.delete(stateHandler);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Intercept state changer logic, allowing the intercepting function to alter
 *  by returning an optional [group,prop,value] array. Returning undefined
 *  will tell the state changer to process as normal
 */
function HookStateChange(hookFunction) {
  if (typeof hookFunction !== 'function')
    throw Error(
      'arg1 must be a function to receive group,name,value, returning opt array'
    );
  CHANGEHOOKS.add(hookFunction);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Remove the hookFunction from the hook interceptors, if it's part of the set
 */
function UnhookStateChange(hookFunction) {
  if (typeof hookFunction !== 'function')
    throw Error(
      'arg1 must be function  method to receive group,name,value and return true=handled '
    );
  CHANGEHOOKS.delete(hookFunction);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  PublishState,
  SubscribeState,
  UnsubscribeState,
  InitializeState,
  ReadState,
  ReadStateGroup,
  UpdateStateGroup,
  UpdateStateGroupProp,
  HandleStateChange,
  HookStateChange,
  UnhookStateChange
};
