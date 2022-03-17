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
import * as ASSETS from 'modules/asset_core/asset-mgr';
import * as TRANSPILER from 'script/transpiler-v2';
import * as SENGINE from 'modules/datacore/dc-script-engine';
import { ScriptLiner } from 'script/tools/script-helpers';
import { SymbolToViewData, UnpackViewData } from 'script/tools/symbol-helpers';
import { GS_ASSETS_PROJECT_ROOT } from 'config/gem-settings';
import { TValidatedScriptUnit, TSymbolData, ISMCBundle } from 'lib/t-script';
import { GetTextBuffer } from 'lib/class-textbuffer';

// load state
const { StateMgr } = UR.class;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('WIZCORE', 'TagCyan');
const DBG = true;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let PROJECTS; // current project class-asset-loader
const DEF_ASSETS = GS_ASSETS_PROJECT_ROOT; // gs_assets is root
const DEF_PRJID = 'AEP2';
const DEF_BPID = 'Fish';

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
/// extract methods we want to use interrnally or export
const {
  _initializeState, // special state initializer method
  _interceptState, // special state interceptor method
  _setState, // special state set without notifier
  State, // return state
  SendState, // send { type, ...data } action to save
  SubscribeState, // provide listener for { type, ...data } on change
  UnsubscribeState, // remove listener
  QueueEffect // defer fx until after all state updates have run
} = STORE;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// initial values of state have to be defined for constructors of components
/// that are relying on it, but these are not yet loaded
_initializeState({
  // script UI interaction
  script_text: '# BLUEPRINT AWAIT LOAD', // the source text (WizardText)
  script_tokens: [], // source tokens (from text)
  script_page: [], // source tokens 'printed' as lines
  line_tokmap: new Map(), // lookup map from tokenLine+Pos to original token
  sel_linenum: -1, // selected line of wizard. If < 0 it is not set
  sel_linepos: -1, // select index into line. If < 0 it is not set
  error: '', // used for displaying error messages
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
  [PROJECTS] = await ASSETS.PromiseLoadAssets(DEF_ASSETS);
  console.log(...PR(`loaded assets from '${DEF_ASSETS}'`));
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// DEFERRED CALL: APP_CONFIGURE fires after LOAD_ASSETS (above) completes
UR.HookPhase('UR/APP_CONFIGURE', () => {
  const cur_prjid = DEF_PRJID;
  const cur_bpid = DEF_BPID;
  console.log(
    `%cFORCE LOADING ${DEF_PRJID}:${DEF_BPID} into GUI TESTBED`,
    'background-color:red;color:white;padding:2px 4px'
  );
  console.log(
    '%cvalues are hardcoded as DEF_PRJID and DEF_BPID in ac-wizcore',
    'color:gray'
  );
  const bp = GetProjectBlueprint(cur_prjid, cur_bpid);
  const { scriptText: script_text } = bp;
  const vmState = { cur_prjid, cur_bpid, script_text };
  SendState(vmState);
  console.log(...PR(`loaded blueprint '${DEF_BPID}' from '${DEF_PRJID}'`));
});

/// DERIVED STATE LOGIC ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// spy on incoming SendState events and modify/add events as needed
_interceptState(state => {
  const { script_text, script_tokens, sel_linenum } = state;
  // if script_text is changing, we also want to emit new script_token
  if (!script_tokens && script_text) {
    const toks = TRANSPILER.TextToScript(script_text);
    state.script_tokens = toks;
    state.cur_bdl = TRANSPILER.CompileBlueprint(toks);
    const [vmPage, tokMap] = TRANSPILER.ScriptToLines(toks);
    state.script_page = vmPage;
    state.line_tokmap = tokMap;
  }
  // if script_tokens is changing, we also want to emit new script_text
  if (!script_text && script_tokens) {
    try {
      const text = TRANSPILER.ScriptToText(state.script_tokens);
      state.script_text = text;
      const [vmPage, tokMap] = TRANSPILER.ScriptToLines(script_tokens);
      state.script_page = vmPage;
      state.line_tokmap = tokMap;
    } catch (e) {
      // ignore TextTpScript compiler errors during live typing
      console.error(`wizcore_interceptState tokens: ${e.toString()}`);
    }
  }

  // run validation and save result if new selected token
  if (sel_linenum) {
    if (sel_linenum > 0) {
      state.sel_validation = ValidateLine(sel_linenum);
    } else {
      state.sel_validation = null;
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
  const fn = 'DispatchClick:';
  const newState: TStateObject = {};

  /** (1) GToken was clicked? ************************************************/
  const tokenKey = event.target.getAttribute('data-key');
  if (tokenKey !== null) {
    // if (DBG) console.log(...PR(`${fn} clicked ${JSON.stringify(tokenKey)}`));

    // notify subscribers of new current line and token index
    const [line, pos] = tokenKey.split(',');
    newState.sel_linenum = Number(line); // STATE UPDATE: selected line
    newState.sel_linepos = Number(pos); // STATE UPDATE: selected pos
    SendState(newState);

    const { sel_linenum, sel_linepos } = State();
    if (sel_linenum > 0 && sel_linepos > 0) {
      return;
    }
  }

  /** (2) ChoiceToken was clicked? ******************************************/
  const choiceKey = event.target.getAttribute('data-choice');
  if (choiceKey !== null) {
    PrintDBGConsole(`${fn} clicked ${JSON.stringify(choiceKey)}`);
    const {
      scriptToken, // the actual script token (not vmToken)
      sel_linenum, // line number in VMPage
      sel_linepos, // line position in VMPage[lineNum]
      context, // the memory context for this token
      validation,
      vmPageLine // all the VMTokens in this line
    } = SelectedTokenInfo();
    // here we want to map the selected symbolType/symbolValue to the
    // scriptToken which has its own type. We also need to know the
    // This is that TYPE MATCHING challenge again...
    const [symbolType, symbolValue] = choiceKey.split('-');
    /** hack test **/
    if (scriptToken.identifier) {
      scriptToken.identifier = symbolValue;
      const script_tokens = State('script_tokens');
      const script_text = TRANSPILER.ScriptToText(script_tokens);
      SendState({ script_text });
      QueueEffect(() => {
        SendState({ sel_linenum, sel_linepos });
      });
    }
    PrintDBGConsole(`${fn} scriptToken ${JSON.stringify(scriptToken)}`);
    return;
  }

  /** (3) ScriptContextor clicks ********************************************/
  const sc = document.getElementById('ScriptContextor');
  if (m_ChildOf(event.target, sc)) {
    console.log('click inside ScriptContextor', event.target);
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
  console.log('unhandled click in', event.target);
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Called after text editing in CodeJar has stopped and there has been no
 *  input for a few hundred milliseconds. Updates the script_page (token)
 *  display and also updates the text/script privately without sending the
 *  changes bak out
 */
function WizardTextChanged(text) {
  let script_tokens;
  let cur_bdl;
  try {
    // compile the next text from the scriptText editor
    // and update the state WITHOUT broadcasting the changes
    // to avoid retriggering the scriptText editor
    script_tokens = TRANSPILER.TextToScript(text); // can throw error
    cur_bdl = TRANSPILER.CompileBlueprint(script_tokens); // can throw error
    _setState({ script_text: text, script_tokens, cur_bdl });
    // since the script tokens have changed, need to redo the viewmodels for
    // the scriptWizard and tell it to update
    const [script_page, line_tokmap] = TRANSPILER.ScriptToLines(script_tokens);
    SendState({ script_page, line_tokmap });
  } catch (e) {
    SendState({ error: e.toString() });
    // eslint-disable-next-line no-useless-return
    return;
  }
  // if there was no error above, then everything was ok
  // so erase the error state!
  SendState({ error: '' });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a scriptText consiting of a single line, return the validation
 *  data for testing. Note that this will nuke the PAGE and MAP structures
 *  for the rest of the script because script-helpers doesn't handle multiple
 *  instances
 */
function WizardTestLine(text) {
  const SPRINTER = new ScriptLiner();
  //  try {
  const script = TRANSPILER.TextToScript(text);
  const [vmPage] = SPRINTER.scriptToLines(script); // note: use different instance
  const [vmPageLine] = vmPage;
  const { validationTokens: vtoks, validationLog } = ValidatePageLine(vmPageLine);
  const { vmTokens, lineScript } = vmPageLine;
  return { validTokens: vtoks, vmTokens, lineScript };
  //  } catch (e) {
  // const error = e.toString();
  // const re = /(.*)@(\d+):(\d+).*/;
  // let matches = re.exec(error);
  // if (matches) {
  //   const [, errMsg, line, pos] = matches;
  //   const col = Number(pos);
  //   const errLine = `${text.slice(0, col)}***ERROR***`;
  //   // eslint-disable-next-line no-alert
  //   alert(
  //     `LineTester Error in position ${col}:\n\n${errLine}\n${text}\n\n${errMsg}`
  //   );
  // } else console.log(error);
  // } // try-catch
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function PrintDBGConsole(str: string) {
  const buf = GetTextBuffer(State().dbg_console);
  buf.printLine(str);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function UpdateDBGConsole(validationLog: string[]) {
  const buf = GetTextBuffer(State().dbg_console);
  buf.set(validationLog);
}
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
    QueueEffect(() =>
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    );
  }
}

/// WIZCORE HELPER METHODS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return a flat array of all token objects for refence comparison purposes */
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
/** Return the string of form '1,2', which is the line number and line position
 *  with 1 being the first element. This string is used as a hash.
 */
function SelectedTokenId() {
  const { sel_linenum, sel_linepos } = State();
  if (sel_linenum < 1) return undefined; // START_COUNT=1 in script-helpers
  if (sel_linepos < 1) return `${sel_linenum}`;
  return `${sel_linenum},${sel_linepos}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return the current line number */
function SelectedLineNum() {
  const { sel_linenum } = State();
  return Number(sel_linenum);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the token by tokenKey 'line,pos'
 */
function GetTokenById(key) {
  const scriptToken = State('line_tokmap').get(key);
  // this can happen if script-helpers ScriptToLines() is called on another body
  // of text that isn't what you're clicking on
  return scriptToken;
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
    sel_validation: validation
  } = State();
  if (sel_linenum > 0 && sel_linepos > 0) {
    const vmPageLine = script_page[sel_linenum - TRANSPILER.LINE_START_NUM];
    return {
      scriptToken, // the actual script token (not vmToken)
      sel_linenum, // line number in VMPage
      sel_linepos, // line position in VMPage[lineNum]
      context, // the memory context for this token
      validation,
      vmPageLine // all the VMTokens in this line
    };
  }
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return a string version of a ScriptUnit */
function GetLineScriptText(lineScript) {
  return TRANSPILER.StatementToText(lineScript);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a lineVM, ensure that the scriptUnit is (1) valid and (2) return
 *  TValidationToken objects
 *  @param {VMPageLine} vmPageLine - entry from VMPage[linenum]
 */
function ValidateLine(lineNum: number): TValidatedScriptUnit {
  // ERRORS AND DEBUG STUFF
  const fn = 'ValidateLine:';
  const { script_page } = State();
  const vmPageLine = script_page[lineNum - TRANSPILER.LINE_START_NUM];
  const { lineScript, globalRefs } = vmPageLine;
  const { cur_bdl } = State();
  return TRANSPILER.ValidateStatement(lineScript, {
    bundle: cur_bdl,
    globals: globalRefs
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** if you don't want to rely on sel_validation, use this call, but you probably
 *  don't need to worry as it's updated everytime something is clicked
 */
function ValidateSelectedLine(): TValidatedScriptUnit {
  const { sel_linepos } = State();
  return ValidateLine(sel_linepos);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** if you have a stand-alone vmPageLine structure that isn't related to the
 *  current script or selected line, use this! It will validate it in context
 *  of the current bundle
 */
function ValidatePageLine(pageLine): TValidatedScriptUnit {
  const { lineScript, globalRefs } = pageLine;
  const { cur_bdl } = State();
  return TRANSPILER.ValidateStatement(lineScript, {
    bundle: cur_bdl,
    globals: globalRefs
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** PLACEHOLDER: retrieve bundle information. prob should be in dc-bundle */
function GetBundleSymbol(symbolType: keyof TSymbolData) {
  if (symbolType === 'keywords') {
    return SENGINE.GetAllKeywords() || {};
  }
  const bdl: ISMCBundle = State().cur_bdl; // returns null
  if (!bdl) return {};
  if (!bdl.symbols === undefined) return {};
  return bdl.symbols[symbolType];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** PLACEHOLDER: retrieve bundle information. prob should be in dc-bundle */
function GetBundleSymbolNames(symbolType: keyof TSymbolData): string[] {
  const symbols = GetBundleSymbol(symbolType);
  if (Array.isArray(symbols)) return symbols;
  if (typeof symbols !== 'object') return [`error retrieving ${symbolType}`];
  const keys = [...Object.keys(symbols)];
  if (keys.length === 0) return [];
  return keys;
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

/// ASSET UTILITIES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function LoadAssetDirectory(dir = GS_ASSETS_PROJECT_ROOT) {
  [PROJECTS] = await ASSETS.DBG_ForceLoadAsset(dir);
  console.log(...PR(`loaded assets from '${dir}'`));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return array of string project ids (.gemprj files) using the
 *  current PROJECTS asset loader instance
 */
function GetProjectList() {
  if (PROJECTS === undefined) throw Error('GetProjectList: no projects loaded');
  return PROJECTS.getProjectsList(); // Array{ id, label }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return { id, metadata, blueprints, instances, rounds, label }
 *  for the given project id (.gemprj files)
 */
function GetProject(prjId = DEF_PRJID) {
  if (PROJECTS === undefined) throw Error('GetProject: no projects loaded');
  try {
    const project = PROJECTS.getProjectByProjId(prjId);
    return project;
  } catch (e) {
    const root = GS_ASSETS_PROJECT_ROOT;
    const assetUrl = 'http://localhost/assets';
    const isDefault = prjId === DEF_PRJID;
    let out = `
ASSET ERROR: Project "${prjId}" not found!

1. Browse to '${assetUrl}' in Chrome.
    Does '${prjId}' appear in folder listing?
2. Check the gsgo/gs_assets/${root} drive directory.
    Does the ${prjId} dir exist?`;
    if (isDefault)
      out += `
3. You are loading the default project path.
    is GS_ASSETS_PROJECT_ROOT set in local-settings.json?`;
    alert(out);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return the blueprint object { id, label, scriptText } for the
 *  given projectId and blueprintId
 */
function GetProjectBlueprint(prjId = DEF_PRJID, bpId = DEF_BPID) {
  const fn = 'GetProjectBlueprint:';
  const project = GetProject(prjId);
  if (project === undefined) throw Error(`no asset project with id ${prjId}`);
  const { blueprints } = project;
  const match = blueprints.find(bp => bp.id === bpId);
  if (match === undefined)
    throw Error(`${fn} no blueprint ${bpId} in project ${prjId}`);
  return match;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return the blueprint of the given project,
 *  { id, label, scriptText, ... }
 *  object or undefined if no exist
 */
function LoadProjectBlueprint(prjId, bpId) {
  const { blueprints } = PROJECTS.getProjectByProjId(prjId);
  if (!blueprints) return `no projectId '${prjId}'`;
  const found = blueprints.find(bp => bp.id === bpId);
  if (!found) return `no blueprint '${bpId}' found in '${bpId}'`;
  const { scriptText } = found;
  const scriptToks = TRANSPILER.TextToScript(scriptText);
  let cur_bdl = TRANSPILER.CompileBlueprint(scriptToks);
  SendState({ script_text: scriptText, cur_bdl }, () => {});
}

/// UI-to-APP STATE AND MODES /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function UIToggleRunEditMode() {
  SendState({ dev_or_user: 1 - State().dev_or_user });
}

/// DEBUGGING METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool({
  load_proj: dir => LoadAssetDirectory(dir),
  list_proj: () => {
    const list = PROJECTS.getProjectsList();
    let out = '';
    list.forEach(project => {
      const { id, label } = project;
      if (!id.startsWith('_template_')) out += `  '${id}'\n`;
    });
    console.log(out);
  },
  list_proj_bps: projId => {
    if (typeof projId !== 'string') {
      console.log('ERROR: you must provide a projId string from this list:');
      (window as any).list_proj();
      return;
    }
    try {
      const project = GetProject(projId);
      const { blueprints } = project;
      let out = '';
      blueprints.forEach(bp => {
        const { id, label } = bp;
        out += `  '${id}'\n`;
      });
      console.log(out);
      console.log('to load new blueprint, use:');
      console.log(`    load_proj_bp('${projId}', 'Blueprint')`);
      console.log(' and the editor will refresh');
    } catch (e) {
      console.log(`error loading blueprint '${projId}' does it exist?`);
      (window as any).list_proj_bps();
    }
  },
  load_proj_bp: (projId, bpId) => {
    if (typeof projId !== 'string') {
      console.log('must provide a projId string from this list:');
      (window as any).list_projects();
      return;
    }
    if (typeof bpId !== 'string') {
      console.log('must provide a blueprint string from this list:');
      (window as any).list_bps(projId);
    }
    LoadProjectBlueprint(projId, bpId);
    console.log('*** RELOADING STATE');
  }
});

/// EXPORTED BLUEPRINT UTILS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  LoadAssetDirectory, // force load asset directory (for debugging)
  GetProjectList, // return projectIds in current assets (.gemprj)
  GetProject, // return project data by projectId or undefined
  GetProjectBlueprint // return prjId's bpId or undefined
};
export {
  LoadProjectBlueprint // load scriptText, trigger Wizard redraw
};

/// EXPORTED STATE METHODS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { State, SendState, SubscribeState, UnsubscribeState, QueueEffect };

/// EXPORTED EVENT DISPATCHERS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  DispatchClick, // handles clicks on Wizard document
  WizardTextChanged, // handle incoming change of text
  WizardTestLine, // handle test line for WizardTextLine tester
  DispatchEditorClick // handle clicks on editing box
};

/// EXPORTED VIEWMODEL INFO UTILS //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  IsTokenInMaster, // does tok exist inside the script_page? (for ref debug)
  GetAllTokenObjects, // return a flat array of all tokens (for ref debugging)
  ScrollLineIntoView
};
export {
  SelectedTokenId, // return current selected token identifier
  SelectedLineNum, // return line number of current selected token
  SelectedTokenInfo, // return contextual info about current selected token
  GetLineScriptText, // return string version of a scriptUnit
  ValidateLine, // return TValidationResult for passed linenum
  ValidateSelectedLine, // return TValidationResult for current select line
  ValidatePageLine // test compile line relative to current blueprint
};
export {
  GetBundleSymbol, // return symbolType from bundle
  GetBundleSymbolNames, // return the names
  SymbolToViewData, // forward utilities from symbol-helpers
  UnpackViewData // forward conver ViewData to an array format
};
