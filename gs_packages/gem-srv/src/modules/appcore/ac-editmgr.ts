/* eslint-disable no-alert */
/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GUI ViewModel Support

  ac-editmgr handles state management and business logic for
  the ScriptEditor and its sub components.

  ac-editmgr coordinates state between:
  * ac-wizcore
  * ac-slotcore

  ac-editorceditmgrore is the main click handler for the wizard UI,
  coordinating clicks across wizcore and slotcore.

  ---

  KEY ACTIONS

  1. Init script_text
      a. ScriptEditor.OnSelectScript    WIZCORE.SendState({ script_text })
      b. WIZCORE._interceptState        script_tokens
                                        cur_bdl
                                        script_page
      c. EDITMGR.wizUpdate           SLOTCORE.SendState({ slots_bundle })
      d. SLOTCORE._interceptState       ...
      e. EDITMGR.slotUpdate          ...

  2. Select Line
      a. User clicks script_page
      b. EDITMGR.DispatchClick       WIZCORE.SendState({     SLOTCORE.SendState({
                                          sel_linenum             sel_slotpos
                                          sel_linepos           })
                                        })
      c. WIZCORE._interceptState        ...
      d. SLOTCORE._interceptState                               ...
      e. EDITMGR.wizUpdate           SLOTCORE.SendState({ slots_linescript })
      f. SLOTCORE._interceptState       ...
      g. EDITMGR.slotUpdate                                  ...

  3. Select slot position
  4. Select Choice
  5. Input Choice

  6. Save slot
  7. Save script
  8. Delete Line

  ORDER OF OPERATIONS
    EDITMGR.DispatchClick

    WIZCORE._interceptState
    SLOTCORE._interceptState

    EDITMGR.wizUpdate
    EDITMGR.slotUpdate

    WIZCORE._interceptState
    SLOTCORE._interceptState

    EDITMGR.wizUpdate
    EDITMGR.slotUpdate


  ---

  Implement a Model-View-ViewModel style support module for GEMSCRIPT
  ScriptEditor renderer.

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
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import * as SLOTCORE from 'modules/appcore/ac-slotcore';
import * as COMPILER from 'script/tools/script-compiler';
import * as BUNDLER from 'script/tools/script-bundler';

import { TStateObject } from '@gemstep/ursys/types';
import * as TRANSPILER from 'script/transpiler-v2';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import { Tokenize as TokenizeString } from 'script/tools/class-gscript-tokenizer-v2';
import { GUI_EMPTY_TEXT } from 'modules/../types/t-script.d'; // workaround to import constant

// load state
const { StateMgr } = UR.class;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('EDITMGR', 'TagBlue');
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
const STORE = new StateMgr('EditorCore');

WIZCORE.SubscribeState(handleWizUpdate);
SLOTCORE.SubscribeState(handleSlotUpdate);

/// SUB-MODULE STATE HANDLERS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function handleWizUpdate(vmStateEvent) {
  const { sel_linenum, sel_linepos, script_text, script_tokens, cur_bdl } =
    vmStateEvent;
  const newSlotState: TStateObject = {};

  // 1. User has selected new line
  //    Coordinate wizcore with slotcore: select the new slot_linescript
  //    run validation and save result if new selected token
  if (sel_linenum && sel_linenum > 0) {
    const { script_page } = WIZCORE.State();
    const { lineScript } = script_page[CHECK.OffsetLineNum(sel_linenum, 'sub')];
    const new_slots_linescript = lineScript.map(t => ({ ...t }));
    newSlotState.slots_linescript = new_slots_linescript;
  }

  // 2. User has selected new line position
  //    Coordinate wizcore with slotcore: select the new sel_slotpos
  if (sel_linepos && sel_linepos > 0) {
    newSlotState.sel_slotpos = sel_linepos;
  }

  if (Object.keys(newSlotState).length > 0) {
    SLOTCORE.SendState(newSlotState);

    // Fire "selection" when user selects a line or position
    // so that ScriptEditor, ScriptLine_Pane will update dev validationLog dump
    STORE.SendState({ selection: 'sel_linenum or sel_linepos' });
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function handleSlotUpdate(vmStateEvent) {
  const { sel_slotpos, slots_validation, slots_linescript } = vmStateEvent;
  const newSlotState: TStateObject = {};

  // 1. if the slot linescript changes, recalculate slots_validation
  //    Need to read `globalRefs` from Wizcore
  if (slots_linescript) {
    const { cur_bdl } = WIZCORE.State();
    let { slots_bundle } = SLOTCORE.State();

    if (!slots_bundle) {
      slots_bundle = cur_bdl.carelessClone();
    }
    newSlotState.slots_bundle = slots_bundle;

    // if we're first setting sel_linenum, use state.sel_linenum becase it doesn't exist in State yet
    // otherwise fall back to the value set in State
    const { sel_linenum } = WIZCORE.State();
    const vmPageLine = WIZCORE.GetVMPageLine(sel_linenum);
    const { globalRefs } = vmPageLine || {};

    // we have to make changes to the bundle
    const newSymbols = COMPILER.SymbolizeStatement(slots_linescript);
    BUNDLER.OpenBundle(slots_bundle);
    BUNDLER.AddSymbols(newSymbols);
    BUNDLER.CloseBundle();

    newSlotState.slots_validation = TRANSPILER.ValidateStatement(
      slots_linescript,
      {
        bundle: slots_bundle,
        globals: globalRefs
      }
    );
  }

  if (Object.keys(newSlotState).length > 0) SLOTCORE.SendState(newSlotState);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// initial values of state have to be defined for constructors of components
/// that are relying on it, but these are not yet loaded
STORE._initializeState({
  selection: '' // placeholder for sel_linenum -- to be implemented in future
  // currently used to trigger state update to show validationLog dump
});

/// DERIVED STATE LOGIC ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// spy on incoming SendState events and modify/add events as needed
/// BL NOTE: `state` only contains state objects that have CHANGED, it does not include
///          ALL state objects, but it CAN be used to set other state vars?
STORE._interceptState(state => {
  // const { selection } = state;
});

/// UI-DRIVEN STATE UPDATES ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// UI EVENT DISPATCHERS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Called by the document handler set in DevWizard. There are no other
 *  click handlers. Note that event is a React synthetic event which wraps
 *  the native event. https://reactjs.org/docs/events.html
 *  List of mouse events: https://www.w3.org/TR/DOM-Level-3-Events/#events-mouseevents
 */
function DispatchClick(event) {
  const fn = 'DC:';
  const newWizState: TStateObject = {};
  const newSlotState: TStateObject = {};

  const { slots_need_saving } = SLOTCORE.State();

  /** (1) GToken was clicked? ************************************************
   *      User clicked on script page line or word
   *      a. set `sel_linenum` and `sel_linepos`
   *      b. set the slot as a secondary action
   *         --  set `sel_slotpos`
   *      c. NOTE the state update will result in `slots_linescript` and `slots_validation` updates
   */
  const tokenKey = event.target.getAttribute('data-key');
  if (tokenKey !== null) {
    // if slots need saving, don't allow click
    if (slots_need_saving) {
      SLOTCORE.SendState({ slots_save_dialog_is_open: true });
      return;
    }
    // notify subscribers of new current line and token index
    const [line, pos] = tokenKey.split(',');
    newWizState.sel_linenum = Number(line); // STATE UPDATE: selected line
    newWizState.sel_linepos = Number(pos); // STATE UPDATE: selected pos
    WIZCORE.SendState(newWizState);
    newSlotState.sel_slotpos = Number(pos); // STATE UPDATE: selected slot
    SLOTCORE.SendState(newSlotState);
    const { sel_linenum, sel_linepos } = WIZCORE.State();
    if (sel_linenum > 0 && sel_linepos >= 0) {
      // sel_linepos = 0 if user clicked on line number
      return;
    }
  }

  /** (2) GValidationToken was clicked? ***************************************
   *      User clicked on a slot in the Slot Editor
   */
  const slotKey = event.target.getAttribute('data-slotkey');
  if (slotKey !== null) {
    // If the slot was disabled, don't let it be clicked
    if (event.target.className.includes('styleFlagDisabled')) return;
    // Else, select the slot
    const [line, pos] = slotKey.split(',');
    newSlotState.sel_slotpos = Number(pos); // STATE UPDATE: selected line
    SLOTCORE.SendState(newSlotState);
    const { sel_slotpos } = SLOTCORE.State();
    if (sel_slotpos > 0) {
      return;
    }
  }

  /** (3) ChoiceToken was clicked? ********************************************
   *      User clicked on a choice item in EditSymbols
   */
  const choiceKey = event.target.getAttribute('data-choice');
  if (choiceKey !== null) {
    const { sel_slotpos, slots_linescript } = SLOTCORE.State();

    // if the token is locked, ignore the click
    const classes = event.target.getAttribute('class');
    if (classes.includes('locked')) return; // don't process click

    // here we want to map the selected symbolType/symbolValue to the
    // scriptToken which has its own type. We also need to know the
    // This is that TYPE MATCHING challenge again...

    let [symbolType, symbolValue] = choiceKey.split('-');
    // note: every keyword options can have a '' choice, so we have
    // re-encode '' as the value of GUI_EMPTY_TEXT and have to reverse
    // it as well
    if (symbolValue === GUI_EMPTY_TEXT) symbolValue = '';

    // symbolType is 'props' or 'methods'
    // symbolValue is the text label of the selected choice

    // if the scriptToken already exists, update it byRef
    const slotScriptToken =
      slots_linescript[CHECK.OffsetLineNum(sel_slotpos, 'sub')] || // existing token
      {}; // or new object if this is creating a new slot

    // Update the slotScriptToken object by modifying its keys
    // 1. get the updated script token
    const updatedTok = TokenizeString(symbolValue)[0][0];
    // 2. clear out old slotScriptToken keys
    //    e.g. need to clear 'identifier' if this is now an object
    //    e.g. need to clear 'line' if this is converted from an emtpy line
    //    e.g. need to clear 'objref' if this is converting to an identifier
    Object.keys(slotScriptToken).forEach(key => delete slotScriptToken[key]);
    // 3. copy the key
    const key = Object.keys(updatedTok)[0]; // should only be one
    slotScriptToken[key] = updatedTok[key];

    if (sel_slotpos > slots_linescript.length) {
      // it's a new token so add it
      slots_linescript.push(slotScriptToken);
    }
    // Update state to trigger validation rerun
    newSlotState.slots_linescript = slots_linescript;
    newSlotState.slots_need_saving = true;

    // also auto-advance the slot selector to the next slot
    // REVIEW: Only advance if there are more validation tokens?  Otherwise, we go past the end?
    // newState.sel_slotpos = sel_slotpos + 1;

    SLOTCORE.SendState(newSlotState);
    return;
  }

  /** (4) ScriptContextor clicks ********************************************/
  const sc = document.getElementById('ScriptContextor');
  if (m_ChildOf(event.target, sc)) {
    // console.log('click inside ScriptContextor', event.target);
    return;
  }
  /** (5) DESELECT IF NON-TOKEN *********************************************/
  const sv = document.getElementById('ScriptWizardView');
  if (m_ChildOf(event.target, sv)) {
    console.log('clearing sel_linenum and sel_linepos');
    // if nothing processed, then unset selection
    WIZCORE.SendState({ sel_linenum: -1, sel_linepos: -1 });
    return;
  }
  /** (N) unhandled click oops **********************************************/
  const err = 'unhandled click in';
  // console.log(err, event.target);
}

/// SCRIPT PAGE METHODS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API ScriptViewPane delete selected line */
function DeleteSelectedLine(event) {
  const { script_page, sel_linenum } = WIZCORE.State();
  const lineIdx = CHECK.OffsetLineNum(sel_linenum, 'sub'); // 1-based
  const lsos = TRANSPILER.ScriptPageToEditableTokens(script_page);
  lsos.splice(lineIdx, 1);
  const nscript = TRANSPILER.EditableTokensToScript(lsos);
  WIZCORE.SendState({ script_tokens: nscript });
  CancelSlotEdit();
}

/// SLOT METHODS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: saves the currently edited slot linescript into the current script_tokens
 *  Called by SelectEditorLineSlot
 */
function SaveSlotLineScript(event) {
  const fn = 'SaveSlotLineScript:';
  const { script_page, sel_linenum } = WIZCORE.State();
  const { slots_linescript } = SLOTCORE.State();
  const lineIdx = CHECK.OffsetLineNum(sel_linenum, 'sub'); // 1-based
  const lsos = TRANSPILER.ScriptPageToEditableTokens(script_page);

  // HACK ---------------------------------------------------------------------
  // Insert Block for new block keywords
  const cur_line = script_page[lineIdx];
  const isNewLine =
    cur_line &&
    cur_line.lineScript &&
    cur_line.lineScript[0] &&
    cur_line.lineScript[0].hasOwnProperty('line');
  const new_kw_tok = slots_linescript ? slots_linescript[0] : {};
  const new_kw = new_kw_tok ? new_kw_tok.identifier : '';
  if (
    isNewLine &&
    ['every', 'ifexpr', 'onevent', 'when'].includes(String(new_kw).toLowerCase())
  ) {
    // insert block!!!
    slots_linescript.push({
      block: [[{ comment: 'insert code here' }]]
    });
  }
  // END HACK -----------------------------------------------------------------

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
  lsos.splice(lineIdx, 1, updatedLine);
  const nscript = TRANSPILER.EditableTokensToScript(lsos);
  WIZCORE.SendState({ script_tokens: nscript });
  SLOTCORE.SendState({ slots_need_saving: false });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API */
function CancelSlotEdit() {
  // deselect slot
  SLOTCORE.SendState({
    sel_slotpos: -1,
    slots_linescript: [],
    slots_validation: null,
    slots_need_saving: false
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API Slot editor remove extraneous slot, e.g. if gemscript has too many parameters */
function DeleteSlot(event) {
  const { slots_linescript, sel_slotpos } = SLOTCORE.State();
  // remove the token
  const slotIdx = CHECK.OffsetLineNum(sel_slotpos, 'sub'); // 1-based
  slots_linescript.splice(slotIdx, 1);
  SLOTCORE.SendState({ slots_linescript, slots_need_saving: true });
}
/// UI SCREEN HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// DEBUG METHODS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTED STATE METHODS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { State, SendState, SubscribeState, UnsubscribeState, QueueEffect } = STORE;
export { State, SendState, SubscribeState, UnsubscribeState, QueueEffect };

/// EXPORTED EVENT DISPATCHERS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  DispatchClick // handles clicks on ScriptVIewPane and SelectEditorSlots
};
export {
  // wizcore
  DeleteSelectedLine // handle ScriptViewPane request to delete currently selected script line
};
export {
  // slotcore
  SaveSlotLineScript, // handle slot editor save request
  CancelSlotEdit, // handle slot editor cancel edit
  DeleteSlot // handle slot editor delete extraneous slot
};

/// EXPORTED VIEWMODEL INFO UTILS //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {};
