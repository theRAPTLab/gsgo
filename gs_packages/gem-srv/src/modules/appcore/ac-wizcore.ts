/* eslint-disable no-alert */
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
import { TStateObject } from '@gemstep/ursys/types';
import * as TRANSPILER from 'script/transpiler-v2';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import * as SIMDATA from 'modules/datacore/dc-sim-data';
import * as WIZUTIL from 'modules/appcore/ac-wizcore-util';
import {
  DecodeSymbolViewData,
  UnpackViewData,
  UnpackSymbolType
} from 'script/tools/symbol-utilities';
import * as COMPILER from 'script/tools/script-compiler';
import * as BUNDLER from 'script/tools/script-bundler';
import { GetTextBuffer } from 'lib/class-textbuffer';
import { GUI_EMPTY_TEXT } from 'modules/../types/t-script.d'; // workaround to import constant

// load state
const { StateMgr } = UR.class;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('WIZCORE', 'TagBlue');
const DBG = false;

/// HELPERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// http://jsfiddle.net/C76xb/
function m_ChildOf(child, parent) {
  // eslint-disable-next-line no-cond-assign
  while ((child = child.parentNode) && child !== parent);
  return !!child;
}

/// MODULE STATE INITIALIZATION ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// First create the new instance, and extract the methods we plan to use
const STORE = new StateMgr('ScriptWizard');
WIZUTIL.LoadDependencies(PR);

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// initial values of state have to be defined for constructors of components
/// that are relying on it, but these are not yet loaded
STORE._initializeState({
  // script UI interaction
  script_text: '# BLUEPRINT AWAIT LOAD', // the source text (WizardText)
  script_tokens: [], // source tokens (from text)

  script_page: [], // source tokens 'printed' as lines
  key_to_token: new Map(), // lookup map from tokenLine+Pos to original token
  program_map: null, // lookup map for directive sections

  sel_linenum: -1, // selected line of wizard. If < 0 it is not set, pointer to script_page
  sel_linepos: -1, // select index into line. If < 0 it is not set
  error: '', // used for displaying error messages

  // slot data
  // -- current selected slot
  sel_slotpos: -1, // selected slot currently being edited.  If < 0 it is not set
  // -- the whole line of slots
  slots_linescript: [], // lineScript being edited in slot editor -- the whole line
  slots_validation: null, // validation object for the current slot line being edited { validationTokens, validationLog }
  slots_bundle: null, // temporary bundle used to store line-based symbol tables

  // project context
  proj_list: [], // project list
  cur_prjid: null, // current project id
  cur_bpid: null, // current blueprint
  cur_bdl: null, // current blueprint bundle

  // selection-driven data
  sel_symbol: null, // selection-dependent symbol data
  sel_validation: null, // { validationTokens, validationLog }
  sel_context: null, // selection-dependent context
  sel_unittext: '', // selection-dependent unit_text

  // runtime filters to limit what to show
  rt_bpfilter: null,
  rt_propfilter: null,
  rt_instancefilter: null,
  rt_testfilter: null,
  dev_or_user: 0,
  // console
  dbg_console: 'ScriptContextor'
});

/// DERIVED STATE LOGIC ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// spy on incoming SendState events and modify/add events as needed
/// BL NOTE: `state` only contains state objects that have CHANGED, it does not include
///          ALL state objects, but it CAN be used to set other state vars?
STORE._interceptState(state => {
  const { script_text, script_tokens, sel_linenum, sel_slotpos } = state;

  // if script_text is changing, we also want to emit new script_token
  if (script_text && !script_tokens) {
    let toks = TRANSPILER.TextToScript(script_text);
    toks = TRANSPILER.EnforceBlueprintPragmas(toks);
    state.script_tokens = toks;
    TRANSPILER.SymbolizeBlueprint(toks);
    state.cur_bdl = TRANSPILER.CompileBlueprint(toks);
    const [vmPage, tokMap] = TRANSPILER.ScriptToLines(toks);
    const programMap = TRANSPILER.ScriptToProgramMap(toks);
    // INSERT validation tokens to script_page
    state.script_page = vmPage;
    state.key_to_token = tokMap;
    state.program_map = programMap;
  }

  // if script_tokens is changing, we also want to emit new script_text
  if (script_tokens && !script_text) {
    try {
      state.script_tokens = TRANSPILER.EnforceBlueprintPragmas(script_tokens);
      const text = TRANSPILER.ScriptToText(state.script_tokens);
      state.script_text = text;
      const [vmPage, tokMap] = TRANSPILER.ScriptToLines(state.script_tokens);
      const programMap = TRANSPILER.ScriptToProgramMap(state.script_tokens);
      state.script_page = vmPage;
      state.key_to_token = tokMap;
      state.program_map = programMap;
    } catch (e) {
      // ignore TextToScript compiler errors during live typing
      console.error(`wizcore_interceptState tokens: ${e.toString()}`);
    }
  }

  // run validation and save result if new selected token
  if (sel_linenum) {
    if (sel_linenum > 0) {
      const { script_page } = State();
      const { lineScript } = script_page[CHECK.OffsetLineNum(sel_linenum, 'sub')];
      // FIXME: IF the slot is currently being edited, don't allow selection?
      // clone the current linescript
      state.slots_linescript = lineScript.map(t => ({ ...t }));
    } else {
      // REVIEW does this ever happen?!?
      state.sel_validation = null;
    }
  }

  // if cur_bdl changes, then copy slots_bundle
  if (state.cur_bdl) {
    state.slots_bundle = state.cur_bdl.carelessClone();
  }

  // if the slot linescript changes, recalculate slots_validation
  if (state.slots_linescript) {
    let { slots_bundle, cur_bdl } = State();

    if (!slots_bundle) {
      slots_bundle = cur_bdl.carelessClone();
    }
    state.slots_bundle = slots_bundle;

    // if we're first setting sel_linenum, use state.sel_linenum becase it doesn't exist in State yet
    // otherwise fall back to the value set in State
    const line = state.sel_linenum || State().sel_linenum;
    const vmPageLine = GetVMPageLine(line);
    const { globalRefs } = vmPageLine;

    // we have to make changes to the bundle
    const newSymbols = COMPILER.SymbolizeStatement(state.slots_linescript);
    BUNDLER.OpenBundle(slots_bundle);
    BUNDLER.AddSymbols(newSymbols);
    BUNDLER.CloseBundle();
    // console.log('newSymbols', newSymbols);
    // console.log('cur_bdl.symbol', cur_bdl.symbols);
    if (DBG)
      console.log(
        ...PR(
          `slots_linescript: validating '${TRANSPILER.StatementToText(
            state.slots_linescript
          ).trim()}' with slots_bundle symbols:`,
          state.slots_bundle.symbols
        )
      );

    state.slots_validation = TRANSPILER.ValidateStatement(
      state.slots_linescript,
      {
        bundle: state.slots_bundle,
        globals: globalRefs
      }
    );
  }
});

/// UI-DRIVEN STATE UPDATES ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// DEPRECATED.  UpdateSlotValue handels validation on each keystroke.
///              If someone else needs to use this, the update routines need to be rewitten
///
// /** API: Recreates text, script_page when the underlying script tokens
//  *  have changed. Use after writing a change to individual tokens
//  *  by the UI to force an update
//  */
// function ScriptChanged() {
//   const { script_tokens, sel_slotpos, slots_linescript } = State(); // we changed this elsewhere
//   try {
//     const script_text = TRANSPILER.ScriptToText(script_tokens);

//     // Update Slot Editor
//     // Replace the token in the current line script
//     const slotIdx = CHECK.OffsetLineNum(sel_slotpos,'sub');

//     let newScriptToken = script_tokens[slotIdx];
//     if (slotIdx < slots_linescript.length) {
//       // replace existing slot data?
//       newScriptToken = slots_linescript[slotIdx];
//       newScriptToken.identifier = symbolValue;
//     } else {
//       // add new slot data
//       newScriptToken.identifier = symbolValue;
//     }
//     slots_linescript.splice(slotIdx, 1, newScriptToken);
//     newState.slots_linescript = slots_linescript;
//     console.warn('newline!', slots_linescript, 'sel_slotpos', sel_slotpos);

//     // advance the slot selector to the next slot
//     newState.sel_slotpos = sel_slotpos + 1;

//     SendState(newState);

//     // OLD CODE
//     // REVIEW: This is handling changs to the LEFT side, not to slots?
//     // const [script_page, key_to_token] = TRANSPILER.ScriptToLines(script_tokens);
//     // STORE.SendState({ script_tokens, script_text, script_page, key_to_token });
//   } catch (e) {
//     // ignore TextToScript compiler errors during live typing
//     console.log(`wizcore_interceptState tokens: ${e.toString()}`);
//   }
// }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Recreates script_page, etc structure when the script text has been
 *  modifie by the UI. Since this is called while text is being entered
 *  character-by-character, it purposefully waits for a few hundred milliseconds
 *  before performing the update.
 */
function WizardTextChanged(text) {
  let script_tokens: TScriptUnit[];
  let cur_bdl: ISMCBundle;
  try {
    // compile the next text from the scriptText editor
    // and update the state WITHOUT broadcasting the changes
    // to avoid retriggering the scriptText editor
    script_tokens = TRANSPILER.TextToScript(text); // can throw error
    TRANSPILER.SymbolizeBlueprint(script_tokens);
    cur_bdl = TRANSPILER.CompileBlueprint(script_tokens); // can throw error
    STORE._setState({ script_text: text, script_tokens, cur_bdl });
    // since the script tokens have changed, need to redo the viewmodels for
    // the scriptWizard and tell it to update
    const [script_page, key_to_token] = TRANSPILER.ScriptToLines(script_tokens);
    STORE.SendState({ script_page, key_to_token });
  } catch (e) {
    STORE.SendState({ error: e.toString() });
    // eslint-disable-next-line no-useless-return
    return;
  }
  // if there was no error above, then everything was ok
  // so erase the error state!
  STORE.SendState({ error: '' });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function UIToggleRunEditMode() {
  STORE.SendState({ dev_or_user: 1 - STORE.State().dev_or_user });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Local helper  */
function m_UpdateSlotValueToken(key, value) {
  // Update slots_linescript
  const { slots_linescript, sel_slotpos } = State();
  // if the scriptToken already exists, update it byRef
  const slotScriptToken =
    slots_linescript[CHECK.OffsetLineNum(sel_slotpos, 'sub')] || // existing token
    {}; // or new object if this is creating a new slot
  // if the token was previously used to as a token, remove the old string/value keys
  // otherwise both keys will be active
  delete slotScriptToken.value;
  delete slotScriptToken.string;
  delete slotScriptToken.expr;
  delete slotScriptToken.identifier;
  slotScriptToken[key] = value; // We know the scriptToken is a value
  if (sel_slotpos > slots_linescript.length) {
    slots_linescript.push(slotScriptToken); // it's a new token so add it
  }
  SendState({ slots_linescript }); // Update state to trigger validation rerun
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Called by SelectEditor when user enters a new value (e.g. for a method argument) */
function UpdateSlotValue(val) {
  m_UpdateSlotValueToken('value', val);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Called by SelectEditor when user enters a new value (e.g. for a method argument) */
function UpdateSlotString(val) {
  m_UpdateSlotValueToken('string', val);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Called by SelectEditor when user enters a new value (e.g. for a method argument)
 *  returns true if input validation passed */
function UpdateIdentifier(val): string {
  // don't allow leading numbers
  // spaces are filtered out at the input level
  if (val === '') return 'identifiers may not be blank';
  const ch = val.charAt(0);
  const isDigit = !isNaN(ch) && !isNaN(parseFloat(ch));
  if (isDigit) return 'identifiers can not start with a number';
  m_UpdateSlotValueToken('identifier', val);
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Called by SelectEditor when user enters a new value (e.g. for a method argument) */
function UpdateSlotBoolean(val) {
  m_UpdateSlotValueToken('value', val);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Called by SelectEditor when user enters a new value (e.g. for a method argument) */
function UpdateSlotExpr(val) {
  m_UpdateSlotValueToken('expr', val);
}

/// UI EVENT DISPATCHERS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Called by the document handler set in DevWizard. There are no other
 *  click handlers. Note that event is a React synthetic event which wraps
 *  the native event. https://reactjs.org/docs/events.html
 *  List of mouse events: https://www.w3.org/TR/DOM-Level-3-Events/#events-mouseevents
 */
function DispatchClick(event) {
  const fn = 'DC:';
  const newState: TStateObject = {};

  /** (1) GToken was clicked? ************************************************
   *      a. set `sel_linenum` and `sel_linepos`
   *      b. set the slot as a secondary action
   *         --  set `sel_slotpos`
   *      c. NOTE the state update will result in `slots_linescript` and `slots_validation` updates
   */
  const tokenKey = event.target.getAttribute('data-key');
  if (tokenKey !== null) {
    // notify subscribers of new current line and token index
    const [line, pos] = tokenKey.split(',');
    newState.sel_linenum = Number(line); // STATE UPDATE: selected line
    newState.sel_linepos = Number(pos); // STATE UPDATE: selected pos
    newState.sel_slotpos = Number(pos); // STATE UPDATE: selected slot
    STORE.SendState(newState);
    const { sel_linenum, sel_linepos } = State();
    if (sel_linenum > 0 && sel_linepos >= 0) {
      // sel_linepos = 0 if user clicked on line number
      return;
    }
  }

  /** (2) GValidationToken was clicked? ************************************************/
  const slotKey = event.target.getAttribute('data-slotkey');
  if (slotKey !== null) {
    // If the slot was disabled, don't let it be clicked
    if (event.target.className.includes('styleFlagDisabled')) return;
    // Else, select the slot
    const [line, pos] = slotKey.split(',');
    newState.sel_slotpos = Number(pos); // STATE UPDATE: selected line
    SendState(newState);
    const { sel_slotpos } = State();
    if (sel_slotpos > 0) {
      return;
    }
  }

  /** (3) ChoiceToken was clicked? ******************************************/
  const choiceKey = event.target.getAttribute('data-choice');
  if (choiceKey !== null) {
    const {
      scriptToken, // the actual script token (not vmToken)
      sel_linenum, // line number in VMPage
      sel_linepos, // line position in VMPage[lineNum]
      sel_slotpos,
      slots_linescript,
      slots_validation,
      context, // the memory context for this token
      validation,
      vmPageLine // all the VMTokens in this line
    } = SelectedTokenInfo();

    // here we want to map the selected symbolType/symbolValue to the
    // scriptToken which has its own type. We also need to know the
    // This is that TYPE MATCHING challenge again...

    let [symbolType, symbolValue] = choiceKey.split('-');
    // note: every keyword options can have a '' choice, so we have
    // re-encode '' as the value of GUI_EMPTY_TEXT and have to reverse
    // it as well
    if (symbolValue === GUI_EMPTY_TEXT) symbolValue = '';

    // symbolType = 'props' or 'methods'
    // symbolValue = the text label of the selected choice

    // if the scriptToken already exists, update it byRef
    const slotScriptToken =
      slots_linescript[CHECK.OffsetLineNum(sel_slotpos, 'sub')] || // existing token
      {}; // or new object if this is creating a new slot
    // Assume it's an identifier
    slotScriptToken.identifier = symbolValue;

    // special handling to replace empty lines
    delete slotScriptToken.line;

    if (sel_slotpos > slots_linescript.length) {
      // it's a new token so add it
      slots_linescript.push(slotScriptToken);
    }
    // Update state to trigger validation rerun
    newState.slots_linescript = slots_linescript;

    // also auto-advance the slot selector to the next slot
    // REVIEW: Only advance if there are more validation tokens?  Otherwise, we go past the end?
    // newState.sel_slotpos = sel_slotpos + 1;

    SendState(newState);

    PrintDBGConsole(
      `${fn} clicked ${JSON.stringify(choiceKey)}\nscriptToken ${JSON.stringify(
        scriptToken
      )}`
    );

    /** end hack test **/
    return;
  }
  /** (3) ScriptContextor clicks ********************************************/
  const sc = document.getElementById('ScriptContextor');
  if (m_ChildOf(event.target, sc)) {
    // console.log('click inside ScriptContextor', event.target);
    return;
  }
  /** (4) DESELECT IF NON-TOKEN *********************************************/
  const sv = document.getElementById('ScriptWizardView');
  if (m_ChildOf(event.target, sv)) {
    // if nothing processed, then unset selection
    SendState({ sel_linenum: -1, sel_linepos: -1 });
    return;
  }
  /** (N) unhandled click oops **********************************************/
  const err = 'unhandled click in';
  // console.log(err, event.target);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Called by the ScriptElementEditor component, or anything that wants to intercept
 *  a click before DispatchClick() guesses no token was clicked
 */
function DispatchEditorClick(event) {
  const fn = 'DispatchEditorClick';
  event.preventDefault();
  event.stopPropagation();
  console.log(`${fn}`, event);
}

/// UI SCREEN HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a line number, scroll that line into view. to be used
 *  when clicking an element that is covered-up by the edit box
 */
function ScrollLineIntoView(lineNum: number) {
  let tokenKey;
  if (typeof lineNum === 'number') tokenKey = `${lineNum},1`;
  else tokenKey = `${SelectedLineNum()},0`;
  const element = document.querySelector(`div[data-key="${tokenKey}"]`);
  if (element) {
    // When ScrollLineIntoView is called from a Component update
    // the occurred do to a change in our state manager, any
    // side effects also have to be queued by the state manager
    // to stay in sync, otherwise it may fire before the state change
    // has updated the DOM
    STORE.QueueEffect(() =>
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    );
  }
}

/// UI SELECTION HELPERS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return the string of form '1,2', which is the line number and line position
 *  with 1 being the first element. This string is used as a hash.
 */
function SelectedTokenId() {
  const { sel_linenum, sel_linepos } = State();
  if (sel_linenum < 1) return undefined; // START_COUNT=1 in script-to-lines
  if (sel_linepos < 1) return `${sel_linenum}`;
  return `${sel_linenum},${sel_linepos}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return the current line number */
function SelectedLineNum() {
  const { sel_linenum } = STORE.State();
  return Number(sel_linenum);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return selection information, used for interactive lookup */
function SelectedTokenInfo() {
  const scriptToken = GetTokenById(SelectedTokenId());
  const context = {}; // TODO: look up scope from symbol-utilities
  const {
    sel_linenum,
    sel_linepos,
    script_page,
    sel_validation: validation,
    sel_slotpos,
    slots_linescript,
    slots_validation
  } = State();
  if (sel_linenum > 0 && sel_linepos > 0) {
    const vmPageLine = GetVMPageLine(sel_linenum);
    const selInfo = {
      scriptToken, // the actual script token (not vmToken)
      sel_linenum, // line number in VMPage
      sel_linepos, // line position in VMPage[lineNum]
      context, // the memory context for this token
      validation, // validation tokens in this line
      vmPageLine, // all the VMTokens in this line
      sel_slotpos, // slot position
      slots_linescript, // current scriptTokens for line being editee
      slots_validation // validation tokens for line being edited
    };
    return selInfo;
  }
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the token by tokenKey 'line,pos' */
function GetTokenById(key) {
  const scriptToken = STORE.State('key_to_token').get(key);
  // this can happen if script-to-lines ScriptToLines() is called on another body
  // of text that isn't what you're clicking on
  return scriptToken;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return the script_page line, taking the 1-index into account */
function GetVMPageLine(line: number) {
  const { script_page } = STORE.State();
  return script_page[CHECK.OffsetLineNum(line, 'sub')];
}

/// DATA CONVERSION HELPERS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return a string version of a ScriptUnit */
function GetLineScriptText(lineScript) {
  return TRANSPILER.StatementToText(lineScript);
}

/// DATA VALIDATION HELPERS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** if you don't want to rely on sel_validation, use this call, but you probably
 *  don't need to worry as it's updated everytime something is clicked
 */
function ValidateSelectedLine(): TValidatedScriptUnit {
  const { sel_linepos } = STORE.State();
  return ValidateLine(sel_linepos);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a line number, return the Validation Tokens for it */
function ValidateLine(lineNum: number): TValidatedScriptUnit {
  const vmPageLine = GetVMPageLine(lineNum);
  return ValidatePageLine(vmPageLine);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** if you have a stand-alone vmPageLine structure that isn't related to the
 *  current script or selected line, use this! It will validate it in context
 *  of the current bundle
 */
function ValidatePageLine(vmLine: VMPageLine): TValidatedScriptUnit {
  const { lineScript, globalRefs } = vmLine;
  const { cur_bdl } = STORE.State();
  return TRANSPILER.ValidateStatement(lineScript, {
    bundle: cur_bdl,
    globals: globalRefs
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Validate all the lines in the script_page and return the validation
 *  tokens. `validationTokens` are 1-based.
 */
function ValidateScriptPage(): TValidatedScriptUnit[] {
  const { script_page } = STORE.State();
  const validationTokens = []; // default to one-based
  const lsos = TRANSPILER.ScriptPageToEditableTokens(script_page);
  script_page.forEach(l => {
    const { lineNum } = l;
    validationTokens[lineNum] = ValidatePageLine(l);
  });
  return validationTokens;
}

/// UI LIST HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the names of symbolData object keys as an array of strings  */
function GetSymbolNames(symbolType: keyof TSymbolData): string[] {
  if (symbolType === 'keywords') return SIMDATA.GetAllKeywords();
  const bdl = STORE.State().cur_bdl; // returns null
  return bdl.GetSymbolDataNames(symbolType);
}

/// DATA QUERY HELPERS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a token object, return true if the object reference is found anywhere
 *  in the current script_token state object. Used to debug whether we are
 *  passing the same object references around
 */
function IsTokenInMaster(tok) {
  // script_tokens is an array of statements
  let found = false;
  const all = GetAllTokenObjects(STORE.State().script_tokens);
  all.forEach(stok => {
    found = found || tok === stok;
  });
  if (DBG) {
    if (found) console.log(...PR('tokens are same object'));
    else console.log('%ctokens are different objects', 'color:red', tok);
  }
  return found;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return a flat array of all token objects for comparison purposes */
function GetAllTokenObjects(statements: TScriptUnit[]) {
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

/// DEBUGGING + PROTOTYPING ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a scriptText consiting of a single line, return the validation
 *  data for testing. Note that this will nuke the PAGE and MAP structures
 *  for the rest of the script because script-to-lines doesn't handle multiple
 *  instances
 */
function WizardTestLine(text: string) {
  try {
    const script = TRANSPILER.TextToScript(text);
    const [vmPage] = TRANSPILER.ScriptToLines(script); // note: use different instance
    const [vmPageLine] = vmPage; // get the first line
    const { vmTokens, lineScript } = vmPageLine;
    const { validationTokens: vtoks, validationLog } =
      ValidatePageLine(vmPageLine);
    return { validTokens: vtoks, vmTokens, lineScript };
  } catch (e) {
    const error = e.toString();
    const re = /(.*)@(\d+):(\d+).*/;
    let matches = re.exec(error);
    if (matches) {
      const [, errMsg, line, pos] = matches;
      const col = Number(pos);
      const errLine = `${text.slice(0, col)}***ERROR***`;
      // eslint-disable-next-line no-alert
      alert(
        `LineTester Error in position ${col}:\n\n${errLine}\n${text}\n\n${errMsg}`
      );
    } else console.log(error);
  } // try-catch
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: saves the currently edited slot linescript into the current script_tokens
 *  Called by SelectEditorLineSlot
 */
function SaveSlotLineScript(event) {
  const fn = 'SaveSlotLineScript:';
  const { script_page, sel_linenum, slots_linescript } = STORE.State();
  const lineIdx = CHECK.OffsetLineNum(sel_linenum, 'sub'); // 1-based
  const lsos = TRANSPILER.ScriptPageToEditableTokens(script_page);
  const updatedLine = lsos[lineIdx]; // clone existing line to retain block info
  updatedLine.lineScript = slots_linescript.filter(({ identifier }) => {
    // SelectEditorLineSlot() treats lineScript tokens as "view data" and
    // stores { identifier:'' } as part of its GUI operation, but this is an
    // illegal script token so we can't just send it as a real token...filtering
    // it out here
    if (identifier === undefined) return true;
    if (identifier === '') return false;
    return true;
  }); // just update the lineScript
  console.log(...PR(fn, 'updateLine', updatedLine));
  lsos.splice(lineIdx, 1, updatedLine);
  const nscript = TRANSPILER.EditableTokensToScript(lsos);
  STORE.SendState({ script_tokens: nscript });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API */
function CancelSlotEdit(event) {
  // deselect slot
  STORE.SendState({
    sel_slotpos: -1,
    slots_linescript: [],
    slots_validation: null
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API Slot editor remove extraneous slot, e.g. if gemscript has too many parameters */
function DeleteSlot(event) {
  const { slots_linescript, script_tokens, sel_linenum, sel_slotpos } =
    STORE.State();
  // remove the token
  const slotIdx = CHECK.OffsetLineNum(sel_slotpos, 'sub'); // 1-based
  slots_linescript.splice(slotIdx, 1);
  STORE.SendState({ slots_linescript });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API ScriptViewPane add line before/after selected line
 *  If you select a line within a block, adding a line before
 *  or after inserts a new line within the block.
 *  If you want to add a line outside of a block, select a line
 *  outside of the block to insert.
 */
function AddLine(position: VMLineScriptInsertionPosition) {
  const { script_page, sel_linenum } = STORE.State();
  const lineIdx = CHECK.OffsetLineNum(sel_linenum, 'sub'); // 1-based
  const lsos = TRANSPILER.ScriptPageToEditableTokens(script_page);
  const newLine: VMLineScriptLine = { lineScript: [{ line: '' }] };
  let newLineNum;
  if (position === 'before') {
    newLineNum = sel_linenum;
    lsos.splice(lineIdx, 0, newLine);
  } else if (position === 'end') {
    lsos.push(newLine);
    newLineNum = lsos.length;
  } else {
    lsos.splice(lineIdx + 1, 0, newLine);
    newLineNum = sel_linenum + 1;
  }
  const nscript = TRANSPILER.EditableTokensToScript(lsos);
  const text = TRANSPILER.ScriptToText(nscript);

  // figure out what to update
  const newState: TStateObject = {};
  newState.script_tokens = nscript;
  STORE.SendState(newState);

  // Auto-select the new line for editing
  STORE.QueueEffect(() => {
    const selectState: TStateObject = {};
    selectState.sel_linenum = newLineNum;
    selectState.sel_linepos = 1; // emulate clicking on line number
    selectState.sel_slotpos = 1;
    STORE.SendState(selectState);
    // Force delay the scroll, otherwise dom isn't quite ready
    // Using `UseEffect` in ScriptViewPane doesn't quite work either
    // and also requires a timeout, so we may as well do it here
    // where we have explicit control over situations where we DO
    // want to scroll (UseEffect's approach would scroll on every
    // script_page update)
    setTimeout(() => {
      ScrollLineIntoView(newLineNum);
    }, 10);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API ScriptViewPane delete selected line */
function DeleteSelectedLine(event) {
  const { script_page, sel_linenum } = STORE.State();
  const lineIdx = CHECK.OffsetLineNum(sel_linenum, 'sub'); // 1-based
  const lsos = TRANSPILER.ScriptPageToEditableTokens(script_page);
  lsos.splice(lineIdx, 1);
  const nscript = TRANSPILER.EditableTokensToScript(lsos);
  STORE.SendState({ script_tokens: nscript });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API return what PROGRAM directive a line is inside, as well as its range */
function GetProgramContextForLine(lineNum: number): TLineContext {
  const { script_tokens, program_map } = STORE.State();
  if (program_map === null && script_tokens.length === 0) {
    console.warn(
      '%cscript_tokens and program_map are empty...is ScriptEditor initializing out-of-order?',
      'font-size:1.5em'
    );
  }
  let map = program_map || TRANSPILER.ScriptToProgramMap(script_tokens);

  let foundProgram: string;
  map.forEach(({ program, start, end }) => {
    if (foundProgram) return foundProgram;
    if (lineNum <= end && lineNum >= start) foundProgram = program;
  });
  //
  if (foundProgram) return map.get(foundProgram);
  return undefined;
}

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** example for ben...
 *
 *
 *  DELETE this when you don't need it anymore
 *
 *
 */
UR.HookPhase('UR/APP_START', () => {
  let lineToCheck = 34;
  const { program_map, script_tokens } = STORE.State();
  console.group(`Testing Program Directive Line Context for line ${lineToCheck}`);
  const lineInfo: TLineContext = GetProgramContextForLine(lineToCheck);
  if (!lineInfo) {
    console.warn(`${lineToCheck} isnt in a PROGRAM section!`);
  } else {
    const { program, start, end } = lineInfo;
    const range = `${start}-${end}`;
    console.log(
      `%cline ${lineToCheck} in 'PROGRAM ${program}' (lines ${range})`,
      'font-size:1.5em'
    );
  }
  const [page] = TRANSPILER.DBG_ScriptToLinesV2(script_tokens);
  console.group('program_map used v2 line maper');
  page.forEach(pline => {
    const { num, level, line } = pline;
    const lineNum = String(num).padStart(3, '0');
    const indent = ''.padStart(level * 2, ' ');
    const text = TRANSPILER.StatementToText(line);
    console.log(`${lineNum} - ${indent} ${text}`);
  });

  console.groupEnd();
  console.groupEnd();
}); // end of HookPhase

/// DEBUG CONSOLE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function PrintDBGConsole(str: string) {
  const buf = GetTextBuffer(STORE.State().dbg_console);
  buf.printLine(str);
  console.log(str);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function UpdateDBGConsole(validationLog: string[] = []) {
  const buf = GetTextBuffer(STORE.State().dbg_console);
  buf.set(validationLog);
}

/// EXPORTED STATE METHODS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { State, SendState, SubscribeState, UnsubscribeState, QueueEffect } = STORE;
export { State, SendState, SubscribeState, UnsubscribeState, QueueEffect };

/// EXPORTED EVENT DISPATCHERS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  DispatchClick, // handles clicks on Wizard document
  // DEPRECATED
  // ScriptChanged, // handles change of script_page lineScript tokens
  WizardTextChanged, // handle incoming change of text
  UpdateSlotValue, // handle incoming change of slot value (input)
  UpdateSlotString, // handle incoming change of slot string (input)
  UpdateIdentifier, // handle incoming change of identifier
  UpdateSlotBoolean, // handle incoming change of slot boolean (input)
  UpdateSlotExpr,
  WizardTestLine, // handle test line for WizardTextLine tester
  DispatchEditorClick, // handle clicks on editing box
  SaveSlotLineScript, // handle slot editor save request
  CancelSlotEdit, // handle slot editor cancel edit
  DeleteSlot, // handle slot editor delete extraneous slot
  AddLine, // handle ScriptViewPane request to add a new script line
  DeleteSelectedLine, // handle ScriptViewPane request to delete currently selected script line
  GetProgramContextForLine // given a line number, returns its program context
};

/// EXPORTED VIEWMODEL INFO UTILS //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  IsTokenInMaster, // does tok exist inside the script_page? (for ref debug)
  GetAllTokenObjects, // return a flat array of all tokens (for ref debugging)
  ScrollLineIntoView,
  UIToggleRunEditMode
};
export {
  SelectedTokenId, // return current selected token identifier
  SelectedLineNum, // return line number of current selected token
  SelectedTokenInfo, // return contextual info about current selected token
  GetLineScriptText, // return string version of a scriptUnit
  ValidateLine, // return TValidationResult for passed linenum
  ValidateSelectedLine, // return TValidationResult for current select line
  ValidatePageLine, // test compile line relative to current blueprint
  ValidateScriptPage // return TValidationResult[] for script_page
};
export {
  GetSymbolNames, // return the names
  DecodeSymbolViewData, // forward utilities from symbol-utilities
  UnpackViewData, // forward convert ViewData to an hybrid format
  UnpackSymbolType // forward unpack symbol into [unit,type, ...param]
};
