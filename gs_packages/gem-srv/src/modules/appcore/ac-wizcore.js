/* eslint-disable consistent-return */
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
import StateMgr from '@gemstep/ursys/src/class-state-mgr';
import {
  TextToScript,
  ScriptToText,
  ScriptToLines,
  StatementToText,
  LINE_START_NUM
} from '../sim/script/transpiler-v2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-MVVM', 'TagCyan');
const DBG = true;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DO_FAKE_EDIT = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let DEFAULT_TEXT = `
# BLUEPRINT TestAgent
# PROGRAM DEFINE
addFeature Costume
addFeature Movement
addFeature AgentWidgets
addProp vulnerable number 0

# PROGRAM INIT
// no first time initialization

# PROGRAM UPDATE
// no every simtick update

# PROGRAM EVENT
onEvent Start [[
  prop Costume.colorScaleIndex setTo colorIndx
  call Movement.wanderUntilInside TreeTrunk
  prop vulnerable setTo 1
  prop AgentWidgets.text setTo ""
]]
onEvent Tick [[
  prop x setTo {{ x + direction * speed }}
  if {{ direction === 1 && x > 400 || direction === -1 && x< -400 }} [[
    prop x setTo {{ 400 * direction * -1 }}
  ]]
]]

# PROGRAM CONDITION
// new syntax
when Moth lastTouches TreeTrunk [[
  call Moth.Movement.wanderUntilInside TreeTrunk
  prop Moth.vulnerable setTo 1
  prop Moth.alpha setMin 1
  prop Moth.alpha setTo 1
  call Moth.Costume.setPose 0
  prop Moth.moving setTo 1
  call Moth.Movement.wanderUntilInside TreeTrunk
  prop Moth.vulnerable setTo 1
  prop Moth.alpha setMin 1
  prop Moth.alpha setTo 1
  call Moth.Costume.setPose 0
  prop Moth.moving setTo 1
]]
`.trim();

/// MODULE STATE INITIALIZATION ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// create the new instance, and extract the methods we plan to use
const STORE = new StateMgr('WIZARDVIEW');
/// extract methods we want to use interrnally or export
const {
  _initializeState, // special state initializer method
  _interceptState, // special state interceptor method
  _setState, // special state set without notifier
  State, // return state
  SendState, // send { type, ...data } action to save
  SubscribeState, // provide listener for { type, ...data } on change
  UnsubscribeState // remove listener
} = STORE;

/// declare the allowed state keys for 'WIZARDVIEW'
const scriptToks = TextToScript(DEFAULT_TEXT);
const [scriptPage, lineMap] = ScriptToLines(scriptToks);
_initializeState({
  script_text: DEFAULT_TEXT, // the source text (WizardText)
  script_tokens: scriptToks, // source tokens (from text)
  script_page: scriptPage, // source tokens 'printed' as lines
  line_tokmap: lineMap, // lookup map from tokenLine+Pos to original token
  sel_line_num: -1, // selected line of wizard. If < 0 it is not set
  sel_line_pos: -1, // select index into line. If < 0 it is not set
  error: '' // used fo error messages
});

/// spy on incoming SendState events and modify/add events as needed
_interceptState(state => {
  const { script_text, script_tokens } = state;

  // if script_text is changing, we also want to emit new script_token
  if (!script_tokens && script_text) {
    try {
      const toks = TextToScript(script_text);
      state.script_tokens = toks;
      const [vmPage, tokMap] = ScriptToLines(toks);
      state.script_page = vmPage;
      state.line_tokmap = tokMap;
    } catch (e) {
      // ignore TextToScript compiler errors during live typing
    }
  }
  // if script_tokens is changing, we also want to emit new script_text
  if (!script_text && script_tokens) {
    try {
      const text = ScriptToText(state.script_tokens);
      state.script_text = text;
      const [vmPage, tokMap] = ScriptToLines(script_tokens);
      state.script_page = vmPage;
      state.line_tokmap = tokMap;
    } catch (e) {
      // ignore TextTpScript compiler errors during live typing
    }
  }
});

/// EVENT DISPATCHERS ("REDUCERS") ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Called by the document handler set in DevWizard. There are no other
 *  click handlers. Note that event is a React synthetic event which wraps
 *  the native event. https://reactjs.org/docs/events.html
 *  List of mouse events: https://www.w3.org/TR/DOM-Level-3-Events/#events-mouseevents
 */
function DispatchClick(event) {
  const newState = {};

  // (1) GToken was clicked?
  const tokenKey = event.target.getAttribute('data-key');
  if (tokenKey !== null) {
    if (DBG) console.log(`WIZCORE: click on token ${JSON.stringify(tokenKey)}`);
    const [line, pos] = tokenKey.split(',');

    newState.sel_line_num = Number(line); // STATE UPDATE: selected line
    newState.sel_line_pos = Number(pos); // STATE UPDATE: selected pos

    if (DBG) {
      // const token = State('line_tokmap').get(tokenKey);
      // token.identifier = 'Edited'; // INDIRECT STATE UPDATE: modified token

      // force all tokens to update after editing the token
      const script_tokens = State('script_tokens');
      const script_text = ScriptToText(script_tokens);
      newState.script_text = script_text; // STATE UPDATE: new script text
    }

    // notify subscribers of dependent state changes
    SendState(newState);
    return;
  }
  // if nothing processed, then unset selection
  if (DBG) console.log('unhandled click. deselecting');
  SendState({ sel_line_num: -1, sel_line_pos: -1 });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DispatchEditorClick(event) {
  event.preventDefault();
  event.stopPropagation();
  console.log('form click', event);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Called by DevWizard after text editing has stopped and there has been no
 *  input for a few hundred milliseconds. updates the script_page (token)
 *  display and also updates the text/script privately without sending the
 *  changes bak out
 */
function WizardTextChanged(text) {
  let script_tokens;
  try {
    script_tokens = TextToScript(text);
    const [script_page] = ScriptToLines(script_tokens);
    SendState({ script_page });
    _setState({ script_text: text, script_tokens });
  } catch (e) {
    SendState({ error: e.toString() });
    return;
  }
  SendState({ error: '' });
}

/// WIZCORE HELPER METHODS ////////////////////////////////////////////////////
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SelectedTokenId() {
  const { sel_line_num, sel_line_pos } = State();
  if (sel_line_num < 1) return undefined; // START_COUNT=1 in script-utilities
  if (sel_line_pos < 1) return `${sel_line_num}`;
  return `${sel_line_num},${sel_line_pos}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SelectedLineNum() {
  const { sel_line_num } = State();
  return Number(sel_line_num);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return selection information, used for interactive lookup */
function SelectedToken() {
  const token = State('line_tokmap').get(SelectedTokenId());
  const context = {}; // TODO: look up scope from symbol-utilities
  const { sel_line_num: lineNum, sel_line_pos: linePos, script_page } = State();
  if (lineNum > 0 && linePos > 0) {
    const tokenList = script_page[lineNum - LINE_START_NUM];
    return {
      token,
      context,
      lineNum,
      linePos,
      tokenList
    };
  }
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetLineScriptText(lineStatement) {
  console.log(JSON.stringify(lineStatement));
  return StatementToText(lineStatement);
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
  const all = GetAllTokenObjects(State().script_tokens);
  all.forEach(stok => {
    found = found || tok === stok;
  });
  if (DBG) {
    if (found) console.log(...PR('tokens are same object'));
    else console.log('%ctokens are different objects', 'color:red', tok);
  }
  return found;
}

/// FORWARDED STATE METHODS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// dispatchers
export { DispatchClick, WizardTextChanged, DispatchEditorClick };
/// utilities
export { IsTokenInMaster, GetAllTokenObjects };
export { SelectedTokenId, SelectedLineNum, SelectedToken, GetLineScriptText };
/// forwarded state methods
export { State, SendState, SubscribeState, UnsubscribeState };
