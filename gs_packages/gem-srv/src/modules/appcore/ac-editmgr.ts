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
  processing clicks and setting WIZCORE and SLOTCORE states directly as
  needed.

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

  2. Select Line / Position
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

  3. Select Slot Position
      a. User clicks slot

  4. Select Choice
      a. User clicks item in
         - EditSymbol
         - ObjRefSelector

  5. Input Choice
      a. User enters a value into input field

  6. Save slot
  7. Save script
  8. Add Line
  9. Delete Line

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
import ERROR from 'modules/error-mgr';

import { TStateObject } from '@gemstep/ursys/types';
import * as TRANSPILER from 'script/transpiler-v2';
import * as TOKENIZER from 'script/tools/script-tokenizer';
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

/// SUB MODULE STATE HANLDERS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
WIZCORE.SubscribeState(handleWizUpdate);
function handleWizUpdate(vmStateEvent) {
  const { cur_bpid } = vmStateEvent;
  if (cur_bpid) {
    STORE.SendState({ bpname: cur_bpid });
  }
}
/// Current not used
///
/// /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// SLOTCORE.SubscribeState(handleSlotUpdate);
/// function handleSlotUpdate(vmStateEvent) {
///   // const { sel_slotpos, slots_validation, slots_linescript } = vmStateEvent;
///   // Do something with state changes, but don't nest state updates!
/// }

/// HELPERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Adds 'slots_validation' and 'slots_bundle' to newSlotState object by reference
 */
function m_AddSlotsValidation(newSlotState) {
  const { slots_linescript } = newSlotState;
  const { cur_bdl, sel_linenum } = WIZCORE.State();

  // Set slots_bundle
  const slots_bundle = cur_bdl ? cur_bdl.carelessClone() : [];
  newSlotState.slots_bundle = slots_bundle; // modify by reference

  // Prep for slots_validation
  const vmPageLine = WIZCORE.GetVMPageLine(sel_linenum);
  const { globalRefs } = vmPageLine || {};

  // Update bundle symbols
  const newSymbols = COMPILER.SymbolizeStatement(slots_linescript);
  BUNDLER.OpenBundle(slots_bundle);
  BUNDLER.AddSymbols(newSymbols);
  BUNDLER.CloseBundle();

  //  try {
  // Set slots_validation
  newSlotState.slots_validation = TRANSPILER.ValidateStatement(slots_linescript, {
    bundle: slots_bundle,
    globals: globalRefs
  }); // modify by reference
  //  } catch (caught) {
  //     ERROR(`could not validate slots_linescript`, {
  //       source: 'validator',
  //       where: 'ac-editmgr.handleSlotUpdate',
  //       caught
  //     });
  //   }
}
/** sel_linenum or sel_linepos has changed, so select a new slot */
function SelectSlot(sel_linenum, sel_linepos) {
  const newSlotState: TStateObject = {};

  // 1. User has selected new line
  //    Coordinate wizcore with slotcore: select the new slot_linescript
  //    run validation and save result if new selected token
  if (sel_linenum && sel_linenum > 0) {
    // ORIG script_page call
    // const { script_page } = WIZCORE.State();
    // const { lineScript } = script_page[CHECK.OffsetLineNum(sel_linenum, 'sub')];
    //
    // REVISED version that can handle both script_page and init_script_page
    const { script_page, init_script_page } = WIZCORE.State();
    const page = init_script_page.length > 0 ? init_script_page : script_page;
    const { lineScript } = page[CHECK.OffsetLineNum(sel_linenum, 'sub')];
    const new_slots_linescript = lineScript.map(t => ({ ...t }));
    newSlotState.slots_linescript = new_slots_linescript;
  }
  // 2. User has selected new line position
  //    Coordinate wizcore with slotcore: select the new sel_slotpos
  if (sel_linepos && sel_linepos > 0) {
    newSlotState.sel_slotpos = sel_linepos;
  }
  // 3. if slots_linescript has changed, we ALWAYS need to
  //    update slots_bundle
  m_AddSlotsValidation(newSlotState);
  SLOTCORE.SendState(newSlotState);
}

/// SUB-MODULE STATE HANDLERS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// initial values of state have to be defined for constructors of components
/// that are relying on it, but these are not yet loaded
STORE._initializeState({
  selection: '', // placeholder for sel_linenum
  // sel_linenum should be handled by editMgr in the future
  // currently used to trigger state update to show validationLog dump
  bpname: '' // mirrors wizcore cur_bpid
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

  /** (1a) "BookmarkSelector" was clicked, or... *****************************/
  let tokenKey, line, pos;
  if (event.target.id === 'BookmarkSelector') {
    line = Number(event.target.value);
    pos = 0;
  }
  /** (1b) ...GToken was clicked? *********************************************
   *      User clicked on script page line or word
   *      a. set `sel_linenum` and `sel_linepos`
   *      b. set the slot as a secondary action
   *         --  set `sel_slotpos`
   *      c. NOTE the state update will result in `slots_linescript` and `slots_validation` updates
   */
  tokenKey = event.target.getAttribute('data-key');
  if (tokenKey !== null) {
    [line, pos] = tokenKey.split(',');
  }
  /** (1c) Process Click ************************************************======
   *       Either...
   *       * BookmarkSelect was selected, or
   *       * User clicked on a GToken
   *       ...so process the click and select the line
   */
  if (line !== undefined && pos !== undefined) {
    // if slots need saving, don't allow click
    if (slots_need_saving) {
      SLOTCORE.SendState({ slots_save_dialog_is_open: true });
      return;
    }
    // WIZCORE: notify subscribers of new current line and token index
    const sel_linenum = Number(line);
    const sel_linepos = Number(pos) || 1; // if click on line number, default to keyword
    newWizState.sel_linenum = sel_linenum; // STATE UPDATE: selected line
    newWizState.sel_linepos = sel_linepos; // STATE UPDATE: selected pos
    WIZCORE.SendState(newWizState);
    // SLOTCORE: notify slotcore
    SelectSlot(sel_linenum, sel_linepos);
    // EDITMGR
    STORE.SendState({ selection: 'force ScriptEditor props update' });
    if (sel_linenum > 0 && sel_linepos >= 0) {
      // Successful click, stop processing.
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
    // const [line, pos] = slotKey.split(',');
    [line, pos] = slotKey.split(',');
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

    // 4. if slots_linescript has changed, we ALWAYS need to
    //    update slots_bundle
    m_AddSlotsValidation(newSlotState);

    SLOTCORE.SendState(newSlotState);

    UR.LogEvent('ScriptEdit', ['Select Choice', symbolValue]);
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
    // console.log('clearing sel_linenum and sel_linepos');
    // if nothing processed, then unset selection
    WIZCORE.SendState({ sel_linenum: -1, sel_linepos: -1 });
    CancelSlotEdit();
    return;
  }

  /** (N) unhandled click oops **********************************************/
  const err = 'unhandled click in';
  // console.log(err, event.target);
}

/// SCRIPT PAGE METHODS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API User clicked "Add Line" on ScriptViewWiz_Block */
function AddLine(position: VMLineScriptInsertionPosition) {
  const newLine = WIZCORE.AddLine(position);
  STORE.QueueEffect(() => SelectSlot(newLine, 1));
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API ScriptViewWiz_Block delete selected line */
function DeleteSelectedLine(event) {
  const { script_page, init_script_page, sel_linenum } = WIZCORE.State();
  const lineIdx = CHECK.OffsetLineNum(sel_linenum, 'sub'); // 1-based
  const isInitScript = init_script_page.length > 0;
  const page = isInitScript ? init_script_page : script_page;
  const lsos = TRANSPILER.ScriptPageToEditableTokens(page);
  lsos.splice(lineIdx, 1);
  const nscript = TRANSPILER.EditableTokensToScript(lsos);
  if (isInitScript) WIZCORE.SendState({ init_script_tokens: nscript });
  else WIZCORE.SendState({ script_tokens: nscript });
  CancelSlotEdit();
}

/// SLOT METHODS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** API: Handles form input from SlotEditorSelect_Block */
function UpdateSlot(data) {
  const { value, type: key } = data;
  if (key === 'identifier') {
    // don't allow leading numbers
    // spaces are filtered out at the input level
    if (value === '') return 'identifiers may not be blank';
    const ch = value.charAt(0);
    const isDigit = !isNaN(ch) && !isNaN(parseFloat(ch));
    if (isDigit) return 'identifiers can not start with a number';
  }
  const slots_linescript = SLOTCORE.UpdateSlotValueToken(key, value);
  const newSlotState: TStateObject = {};
  newSlotState.slots_linescript = slots_linescript;
  m_AddSlotsValidation(newSlotState);
  SLOTCORE.SendState(newSlotState);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: saves the currently edited slot linescript into the current script_tokens
 *  Called by SlotEditor_Block
 */
function SaveSlotLineScript(event) {
  const fn = 'SaveSlotLineScript:';
  const { script_page, init_script_page, sel_linenum } = WIZCORE.State();
  const { slots_linescript } = SLOTCORE.State();
  const lineIdx = CHECK.OffsetLineNum(sel_linenum, 'sub'); // 1-based
  const isInitScript = init_script_page.length > 0;
  const page = isInitScript ? init_script_page : script_page; // if initscript is present, use that
  const lsos = TRANSPILER.ScriptPageToEditableTokens(page);
  const lineToUpdate = lsos[lineIdx]; // clone existing line to retain block info

  // HACK Block Support -------------------------------------------------------
  // When adding a new line, insert a block if the it's required
  const new_kw_tok = slots_linescript ? slots_linescript[0] : {};
  const new_kw = new_kw_tok ? new_kw_tok.identifier : '';
  let isBlockCommand = false;
  // 1. Is a block command? e.g. 'every','ifexpr', 'onevent', 'when'?
  if (
    ['every', 'ifexpr', 'ifprop', 'iffeatprop', 'onevent', 'when'].includes(
      String(new_kw).toLowerCase()
    )
  )
    isBlockCommand = true;
  // 2. Is featCall block command? e.g. 'createAgent' or 'spawnChild'
  if (String(new_kw).toLowerCase() === 'featcall') {
    slots_linescript.forEach(tok => {
      if (
        [
          'createAgent',
          'spawnChild',
          'charactersForEach',
          'charactersForEachActive',
          'handleClick',
          'tellCharacterByName',
          'tellAllCharacters',
          'setupFunction'
        ].includes(tok.identifier)
      )
        isBlockCommand = true;
    });
  }
  // 3. Already has a block?
  const hasBlock = lineToUpdate.marker === 'start';
  // 4. Add a block if needed!
  if (isBlockCommand && !hasBlock) {
    slots_linescript.push({
      block: [[{ comment: 'insert code here' }]]
    });
  }
  // END HACK Block Support ---------------------------------------------------

  lineToUpdate.lineScript = slots_linescript.filter(({ identifier }) => {
    // SelectEditorLineSlot() treats lineScript tokens as "view data" and
    // stores { identifier:'' } as part of its GUI operation, but this is an
    // illegal script token so we can't just send it as a real token...filtering
    // it out here
    if (identifier === undefined) return true;
    if (identifier === '') return false;
    return true;
  }); // just update the lineScript
  lsos.splice(lineIdx, 1, lineToUpdate);
  const nscript = TRANSPILER.EditableTokensToScript(lsos);
  if (isInitScript) WIZCORE.SendState({ init_script_tokens: nscript });
  else WIZCORE.SendState({ script_tokens: nscript });
  SLOTCORE.SendState({ slots_need_saving: false });
  UR.LogEvent('ScriptEdit', [
    'Save Slot',
    TOKENIZER.StatementToText(slots_linescript)
  ]);
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
  UR.LogEvent('ScriptEdit', ['Cancel Save Slot']);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API Slot editor remove extraneous slot, e.g. if gemscript has too many parameters */
function DeleteSlot(event) {
  const { slots_linescript, sel_slotpos } = SLOTCORE.State();
  // remove the token
  const slotIdx = CHECK.OffsetLineNum(sel_slotpos, 'sub'); // 1-based
  slots_linescript.splice(slotIdx, 1);
  SLOTCORE.SendState({ slots_linescript, slots_need_saving: true });
  UR.LogEvent('ScriptEdit', [
    'Delete Slot',
    TOKENIZER.StatementToText(slots_linescript)
  ]);
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
  DispatchClick // handles clicks on ScriptViewWiz_Block and SelectEditorSlots
};
export {
  // wizcore
  AddLine, // handle ScriptViewWiz_Block request to add new line
  DeleteSelectedLine // handle ScriptViewWiz_Block request to delete currently selected script line
};
export {
  // slotcore
  UpdateSlot, // handle slot editor key input
  SaveSlotLineScript, // handle slot editor save request
  CancelSlotEdit, // handle slot editor cancel edit
  DeleteSlot // handle slot editor delete extraneous slot
};

/// EXPORTED VIEWMODEL INFO UTILS //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {};
