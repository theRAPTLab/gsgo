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

/// HELPER: STATE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Check if STATE contains a "section" with a particular property */
function u_StateHas(sec, prop) {
  const sections = Object.keys(STATE);
  if (prop === undefined) return sections.includes(sec);
  const props = Object.keys(STATE[sec]);
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
/** set a STATE section if it exists and optionally publish */
function UpdateStateSection(sec, secObj) {
  if (typeof sec !== 'string') throw Error('arg1 must be string');
  if (!u_StateHas(sec)) throw Error(`section '${sec}' does not exist`);
  if (secObj === undefined) throw Error('arg3 must be defined');
  STATE[sec] = secObj;
  const update = { [sec]: STATE[sec] };
  return update;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function UpdateStateProp(sec, prop, value) {
  if (typeof sec !== 'string') throw Error('arg1 must be string');
  if (typeof prop !== 'string') throw Error('arg2 must be string');
  if (value === undefined) throw Error('arg3 must be defined');
  if (!u_StateHas(sec)) throw Error(`section '${sec}' does not exist`);
  if (!u_StateHas(sec, prop))
    throw Error(`no such prop '${prop}' in section '${sec}'`);
  STATE[sec][prop] = value;
  const update = { [sec]: { [prop]: value } };
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
 *  passing a list of string arguments of sections to include.
 *  Returns { [arg1]: sectionData, [arg2]: sectionData, ... }
 */
function ReadStateSection(...sections) {
  const returnState = {};
  sections.forEach(section => {
    if (!u_StateHas(section))
      console.warn(...PR(`section '${section}' not in STATE`));
    else Object.assign(returnState, { [section]: STATE[section] });
  });
  return returnState;
}

/// HELPER: SUBSCRIBERS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// a Set of React-style 'setState( {change} )' methods
const SUBSCRIBERS = new Set(); // StateHandlers
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This is called from the component's handleChangeState() handler, which
 *  handles the state change call on its behalf after getting a chance to
 *  update this modules state.
 */
function HandleStateChange(section, name, value) {
  UpdateStateProp(section, name, value);
  PublishState({ [section]: { [name]: value } });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Invoke React-style 'setState()' method with change object
 */
function PublishState(change) {
  let data;
  if (change === undefined) data = { ...STATE };
  if (typeof change !== 'object') throw Error('if arg provided, must be object');
  else data = change;
  const subs = [...SUBSCRIBERS.values()];
  console.log('publishing', data);
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
      'arg1 must be a method in a Component that receives change, section'
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
      'arg1 must be a method in a Component that receives change, section'
    );
  SUBSCRIBERS.delete(stateHandler);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  PublishState,
  SubscribeState,
  UnsubscribeState,
  InitializeState,
  ReadState,
  ReadStateSection,
  UpdateStateSection,
  UpdateStateProp,
  HandleStateChange
};
