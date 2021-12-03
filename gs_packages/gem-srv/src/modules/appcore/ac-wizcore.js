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
  ScriptToLines
} from '../sim/script/transpiler-v2';

import { PromiseLoadAssets } from '../asset_core/asset-mgr';
import {
  GS_ASSETS_PROJECT_ROOT,
  GS_ASSETS_PATH
} from '../../../config/gem-settings';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-MVVM', 'TagCyan');
const DBG = true;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DO_FAKE_EDIT = false;
const DEFAULT_PROJECT_ID = 'decomposition';
let DEFAULT_TEXT = `
// WILL LOAD FROM PROJECT LOADER (see debug cli)
keyword arg arg arg [[
  keyword arg arg arg
]]
`.trim();
let PROJECTS;
let SPRITES;
(async () => {
  [PROJECTS, SPRITES] = await PromiseLoadAssets(GS_ASSETS_PROJECT_ROOT);
})();

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
  script_text: DEFAULT_TEXT, // the source text
  script_tokens: scriptToks, // an array of tokenized statements
  script_page: scriptPage, // an array of statements turned into lines
  script_map: lineMap, // lookup map
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
      state.script_map = tokMap;
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
      state.script_map = tokMap;
    } catch (e) {
      // ignore TextTpScript compiler errors during live typing
    }
  }
});

/// CONSOLE TOOL INSTALL //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DBG_ListProjectIds() {
  const projects = PROJECTS.getProjectsList();
  console.log(`PROJECTS IN ${GS_ASSETS_PATH}/${GS_ASSETS_PROJECT_ROOT}`);
  projects.forEach(prj => {
    console.log('prjid:', prj.id);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DBG_ListBPIds(prjId) {
  const project = PROJECTS.getProjectByProjId(prjId);
  if (!project || project.id === undefined)
    return `no projectId '${prjId}' in ${GS_ASSETS_PROJECT_ROOT}`;
  console.log(`BLUEPRINTS FOR PROJECT '${prjId}'`);
  const { blueprints } = project;
  if (Array.isArray(blueprints))
    blueprints.forEach(bp => {
      console.log('bpId:', bp.id);
    });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DBG_LoadProjectId(prjId = DEFAULT_PROJECT_ID) {
  // concatenate all scripts
  let script_text = `SCRIPT DUMP OF '${prjId}'`;
  const { blueprints } = PROJECTS.getProjectByProjId(prjId);
  blueprints.forEach(bp => {
    const { id, label, scriptText } = bp;
    script_text += `\n\n// AUTOMATIC BLUEPRINT EXTRACTION OF: ${id} //\n${scriptText}`;
  });
  SendState({ script_text }, () => {});
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DBG_LoadProjectBlueprint(prjId, bpId) {
  const { blueprints } = PROJECTS.getProjectByProjId(prjId);
  if (!blueprints) return `no projectId '${prjId}'`;
  const found = blueprints.find(bp => bp.id === bpId);
  if (!found) return `no blueprint '${bpId}' found in '${prjId}'`;
  const { scriptText } = found;
  SendState({ script_text: scriptText }, () => {});
  console.log('list of blueprint ids for project:', prjId);
  DBG_ListBPIds(prjId);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool({
  'loadProjectBPs': (projId = DEFAULT_PROJECT_ID) => {
    return DBG_LoadProjectId(projId);
  },
  'loadProjectBP': (projId, bpId) => {
    return DBG_LoadProjectBlueprint(projId, bpId);
  },
  'listProjects': () => {
    return DBG_ListProjectIds();
  },
  'listBPs': prjId => {
    return DBG_ListBPIds(prjId);
  },
  'dumpToken': (row, col) => {
    return State('script_map').get(`${row},${col}`);
  }
});

/// EVENT DISPATCHERS (REDUCERS) //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DispatchClick(event) {
  // did a GToken get clicked? It will have token-id set
  const tokenKey = event.target.getAttribute('data-key');
  const newState = {};
  if (tokenKey !== null) {
    if (DBG) console.log(`clicked token ${JSON.stringify(tokenKey)}`);
    const [line, pos] = tokenKey.split(',');
    newState.sel_line_num = line;
    newState.sel_line_pos = pos;

    /** HACK TEST **/
    const token = State('script_map').get(tokenKey);

    // console.log('clicked id', token.identifier);
    if (DO_FAKE_EDIT) {
      if (token.identifier) {
        token.identifier = 'Edited';
        // force all tokens to update
        const script_tokens = State('script_tokens');
        const script_text = ScriptToText(script_tokens);
        newState.script_text = script_text;
      }
    }
    /** END TEST **/
    // send accumulated state updates
    SendState(newState);
    return;
  }
  // if nothing processed, then unset selection
  if (DBG) console.log('unhandled click. deselecting');
  SendState({ sel_line_num: -1, sel_line_pos: -1 });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
function SelectedToken() {
  return State('script_map').get(SelectedTokenId());
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
export { DispatchClick, WizardTextChanged };
/// utilities
export { IsTokenInMaster, GetAllTokenObjects };
export { SelectedTokenId, SelectedLineNum, SelectedToken };
/// forwarded state methods
export { State, SendState, SubscribeState, UnsubscribeState };
