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
import * as PROJ_v2 from 'modules/datacore/dc-project-v2';
import * as WIZUTIL from 'modules/appcore/ac-wizcore-util';
import * as TEST_SYMBOLS from 'test/x-symbol-tests';
import { ENABLE_SYMBOL_TEST_BLUEPRINT } from 'config/dev-settings';
import {
  DecodeSymbolViewData,
  UnpackViewData,
  UnpackSymbolType
} from 'script/tools/symbol-utilities';
import { ASSETDIR, DEV_PRJID, DEV_BPID } from 'config/gem-settings';
import { GetTextBuffer } from 'lib/class-textbuffer';

// load state
const { StateMgr } = UR.class;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('WIZCORE', 'TagCyan');
const DBG = true;

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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// initial values of state have to be defined for constructors of components
/// that are relying on it, but these are not yet loaded
STORE._initializeState({
  // script UI interaction
  script_text: '# BLUEPRINT AWAIT LOAD', // the source text (WizardText)
  script_tokens: [], // source tokens (from text)

  script_page: [], // source tokens 'printed' as lines
  key_to_token: new Map(), // lookup map from tokenLine+Pos to original token

  sel_linenum: -1, // selected line of wizard. If < 0 it is not set, pointer to script_page
  sel_linepos: -1, // select index into line. If < 0 it is not set
  error: '', // used for displaying error messages

  // slot data
  // -- current selected slot
  sel_slotpos: -1, // selected slot currently being edited.  If < 0 it is not set
  // -- the whole line of slots
  slots_linescript: [], // lineScript being edited in slot editor -- the whole line
  slots_validation: null, // validation object for the current slot line being edited { validationTokens, validationLog }

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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// DEFERRED CALL: LOAD_ASSETS will fire after module loaded (and above code)
UR.HookPhase('UR/LOAD_ASSETS', async () => {
  // return promise to hold LOAD_ASSETS until done
  console.log(
    `%cInitializing 'assets/${ASSETDIR}' as project source...`,
    'background-color:rgba(255,0,0,0.15);color:red;padding:1em 2em'
  );
  return PROJ_v2.LoadAssetDirectory(`/assets/${ASSETDIR}/`);
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// DEFERRED CALL: APP_CONFIGURE fires after LOAD_ASSETS (above) completes
UR.HookPhase('UR/APP_CONFIGURE', () => {
  // check for override load to use built-in test script
  if (ENABLE_SYMBOL_TEST_BLUEPRINT) {
    console.log(
      `%cUsing TEST_SCRIPT because ENABLE_SYMBOL_TEST_BLUEPRINT is true...`,
      'background-color:rgba(255,255,0,0.15);color:red;padding:1em 2em'
    );
    const script_text = TEST_SYMBOLS.GetTestScriptText();
    STORE.SendState({ script_text });
    // TEST_SYMBOLS.TestValidate();
    return;
  }

  // normal load
  const cur_prjid = DEV_PRJID;
  const cur_bpid = DEV_BPID;
  let out = `%cLooking for '${DEV_PRJID}.prj' with blueprint name '${DEV_BPID}' `;
  out += `in 'assets/${ASSETDIR}'...`;
  out += '%c\n\n';
  out += `If you see an error, check that ASSETDIR, DEV_PRJID, and DEV_BPID `;
  out += `are correctly defined in local-settings.json`;
  // This retrieves the uncompiled/unbundled bpDef object {name, scriptText} from gem proj
  console.log(
    out,
    'background-color:rgba(255,0,0,0.15);color:red;padding:1em 2em',
    'color:maroon',
    '\n\n'
  );
  const bp = PROJ_v2.GetProjectBlueprint(cur_prjid, cur_bpid);
  const { scriptText: script_text } = bp;
  const vmState = { cur_prjid, cur_bpid, script_text };
  STORE.SendState(vmState);
  console.log(...PR(`loaded blueprint '${DEV_BPID}' from '${DEV_PRJID}'`));
  // TEST_SYMBOLS.TestValidate();
});

/// DERIVED STATE LOGIC ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// spy on incoming SendState events and modify/add events as needed
/// BL NOTE: `state` only contains state objects that have CHANGED, it does not include
///          ALL state objects, but it CAN be used to set other state vars?
STORE._interceptState(state => {
  const { script_text, script_tokens, sel_linenum, sel_slotpos } = state;
  // if script_text is changing, we also want to emit new script_token
  if (!script_tokens && script_text) {
    const toks = TRANSPILER.TextToScript(script_text);
    state.script_tokens = toks;
    TRANSPILER.SymbolizeBlueprint(toks);
    state.cur_bdl = TRANSPILER.CompileBlueprint(toks);
    const [vmPage, tokMap] = TRANSPILER.ScriptToLines(toks);
    // INSERT validation tokens to script_page
    state.script_page = vmPage;
    state.key_to_token = tokMap;
  }
  // if script_tokens is changing, we also want to emit new script_text
  if (!script_text && script_tokens) {
    try {
      const text = TRANSPILER.ScriptToText(state.script_tokens);
      state.script_text = text;
      const [vmPage, tokMap] = TRANSPILER.ScriptToLines(script_tokens);
      state.script_page = vmPage;
      state.key_to_token = tokMap;
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

  // if the slot linescript changes, recalculate slots_validation
  if (state.slots_linescript) {
    const { cur_bdl } = State();
    // if we're first setting sel_linenum, use state.sel_linenum becase it doesn't exist in State yet
    // otherwise fall back to the value set in State
    const line = state.sel_linenum || State().sel_linenum;
    const vmPageLine = GetVMPageLine(line);
    const { globalRefs } = vmPageLine;
    state.slots_validation = TRANSPILER.ValidateStatement(
      state.slots_linescript,
      {
        bundle: cur_bdl,
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
/** API: Called by SelectEditor when user enters a new value (e.g. for a method argument) */
function UpdateSlotBoolean(val) {
  m_UpdateSlotValueToken('value', val);
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

  /*** hacky test ***/
  WIZUTIL.ForceImportHack();

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

    const [symbolType, symbolValue] = choiceKey.split('-');
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
    newState.sel_slotpos = sel_slotpos + 1;

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
  const {
    script_text,
    slots_linescript,
    script_page,
    script_tokens,
    sel_linenum
  } = STORE.State();
  const lineIdx = CHECK.OffsetLineNum(sel_linenum, 'sub'); // 1-based
  script_tokens.splice(lineIdx, 1, slots_linescript);
  STORE.SendState({ script_tokens });
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
/** API Slot editor remove extraneous slot */
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
  if (position === 'before') {
    // If the current token is a block start, then we need to make the
    // inserted block a bock start.
    const currTok = lsos[lineIdx];
    if (currTok.block === 'start') {
      // Make the new line a block start
      newLine.block = 'start';
      // And make the current line NOT a block start
      delete currTok.block;
    }
    lsos.splice(lineIdx, 0, newLine);
  } else if (position === 'end') {
    lsos.push(newLine);
  } else {
    lsos.splice(lineIdx + 1, 0, newLine);
  }
  const nscript = TRANSPILER.EditableTokensToScript(lsos);
  const text = TRANSPILER.ScriptToText(nscript);
  STORE.SendState({ script_tokens: nscript });
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
  UpdateSlotBoolean, // handle incoming change of slot boolean (input)
  WizardTestLine, // handle test line for WizardTextLine tester
  DispatchEditorClick, // handle clicks on editing box
  SaveSlotLineScript, // handle slot editor save request
  CancelSlotEdit, // handle slot editor cancel edit
  DeleteSlot, // handle slot editor delete extraneous slot
  AddLine, // handle ScriptViewPane request to add a new script line
  DeleteSelectedLine // handle ScriptViewPane request to delete currently selected script line
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
