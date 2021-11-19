/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GUI ViewModel Support

  Implement a Model-View-ViewModel style support module for GEMSCRIPT Script
  Wizard renderer.

  STATE MODULE NOTES - State module initialization can only be done once. This
  is similar to setting this.state directly in a React class component
  constructor. The properties set here determine what values are settable, and
  their names must be LOWERCASE and UNIQUE across all StateModules!!! This is to
  help prevent stupid naming errors or ambiguities by forcing you to think
  things through.

  LIFECYCLE NOTES - This module's state data is initialized on load by
  _initializeState(), which occurs well before React initializes

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TextToScript, ScriptToText } from '../sim/script/transpiler-v2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-MVVM', 'TagCyan');
const DBG = false;
// initial script text
const DEFAULT_TEXT = `
# BLUEPRINT HoneyBee Bee

// start of agent definition
# PROGRAM DEFINE
addProp frame Number 3
useFeature Movement
# PROGRAM UPDATE
prop skin setTo "bunny.json"
featCall agent.Movement jitterPos -5 5

// start of frame updates
#PROGRAM UPDATE
featCall Movement flapwings

// start of interactive code
# PROGRAM EVENT
onEvent Tick [[
  ifExpr {{ agent.getProp('name').value==='bun0' }} [[
    dbgOut 'my tick' 'agent instance' {{ agent.getProp('name').value }}
    if {{ true }} [[
      // nested nested
    ]]
  ]]
  prop agent.x setTo  0
  prop agent.y setTo 0
]]
# PROGRAM CONDITION
when Bee sometest [[
  dbgOut SingleTest
]]
when Bee sometest Bee [[
  dbgOut PairTest
]]
`.trim();

/// MODULE HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a flat array of all token objects for refence comparison purposes */
function GetAllTokenObjects(statements) {
  const allToks = [];
  statements.forEach(stm => {
    const stmToks = [...stm];
    stmToks.forEach(stok => {
      const { block } = stok;
      if (Array.isArray(block)) {
        allToks.push(...GetAllTokenObjects(block));
      } else allToks.push(stok);
    });
  });
  return allToks;
}

/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a token object, return true if the object reference is found anywhere
 *  in the current script_token state object. Used to debug whether we are
 *  passing the same object references around
 */
function IsTokenInMaster(tok) {
  // script_tokens is an array of statements
  let found = false;
  const all = GetAllTokenObjects(script_tokens);
  all.forEach(stok => {
    found = found || tok === stok;
  });
  if (DBG) {
    if (found) console.log(...PR('tokens are same object'));
    else console.log('%ctokens are different objects', 'color:red', tok);
  }
  return found;
}

/// MODULE STATE INITIALIZATION ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// create the new instance, and extract the methods we plan to use
const STORE = new UR.class.StateMgr('WIZARDVIEW');
/// extract methods we want to use interrnally or export
const {
  _initializeState, // special state initializer method
  _interceptState, // special state interceptor method
  _insertStateEvent, // use internal method to add actions on intercept
  State, // return state
  SendState, // send { type, ...data } action to save
  SubscribeState, // provide listener for { type, ...data } on change
  UnsubscribeState // remove listener
} = STORE;

/// declare the allowed state keys for 'WIZARDVIEW'
let script_text = DEFAULT_TEXT;
let script_tokens = TextToScript(script_text);
_initializeState({
  script_tokens, // an array of tokenized statements
  script_text // the source text
});
/// spy on incoming SendState events to trigger side effects and/or mutate
/// the event before it's enqueued as an action.
_interceptState(state => {
  // if script_text is changing, we also want to emit new script_token
  if (state.script_text) {
    try {
      const toks = TextToScript(state.script_text);
      _insertStateEvent({ script_tokens: toks }, () => {
        // console.log('new script_tokens update queued');
      });
    } catch (e) {
      // ignore TextTpScript compiler errors during live typing
    }
  }
  if (state.script_tokens) {
    const text = ScriptToText(state.script_tokens);
    _insertStateEvent({ script_text: text }, () => {
      // console.log('new script_text update queued');
    });
  }
});
/// add some console debug helpers to inspect state
UR.AddConsoleTool({
  'dump_vm': () => {
    const jt = JSON.stringify(State().script_tokens);
    console.log(...PR(jt));
  }
});

/// FORWARDED STATE METHODS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// main api
export { IsTokenInMaster, GetAllTokenObjects };

/// also forward StateModule methods for use by users of this module
export { State, SendState, SubscribeState, UnsubscribeState };
