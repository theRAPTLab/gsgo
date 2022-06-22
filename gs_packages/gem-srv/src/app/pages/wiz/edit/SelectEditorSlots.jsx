/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SelectEditorSlots

  DATA

  SelectEditorSlotLine basically displays `slots_validation`.

  Even though `slots_validation` is the main data that SelectEditorSlotLine
  displays, the key slot edit data is actually the `slots_linescript` state.
  `slots_validation` is directly derived from `slots_linescript` every time
  `slots_linescript` changes.

  Any changes to the slot are:
  1. Handled by WIZCORE.DispatchClick
  2. WIZCORE.DispatchClick updates the `slots_linescript` state.
  3. The state update triggers _interceptState,
    ...which validates 'slots_linescript'
    ...and creates a new `slots_validation` state.

  Any changes in selection are:
  1. Handled by WIZCORE.DispatchClick
    ...which updates the various sel_* states
  2. The state update triggers _interceptState,


  UI

  Key User Input Triggers
  User clicks are all handled by WIZCORE.DispatchClick, which in turn sets:
  * script page click => `sel_linenum`/`sel_linepos` -- Any clicks in the script page will result in
    1.  `sel_slotpos` -- the currently selected slot is updated
    2.  `slots_linescript` and `slots_validation` -- _interceptState will also update

  * slot click => 'sel_slotpos'
    1. `sel_slotpos` change
    2.  `slots_linescript` and `slots_validation` -- _interceptState will also update

  * choice click => 'slots_linescript`
    1.  `slots_linescript` is updated with the clicked choice
    2.  Secondary: `sel_slotpos` is advanced to the next slot

  * value data input => 'slots_linescript'
    1.  WIZCORE.UpdateSlotValue handles the inputs directly from SelectEditor.
        ...which updates `slots_linescript`

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import { SelectEditor } from './SelectEditor';
import {
  GridStack,
  FlexStack,
  StackUnit,
  GToken,
  GValidationToken,
  StackText
} from '../SharedElements';
import { GUI_EMPTY_TEXT } from 'modules/../types/t-script.d'; // workaround to import constant

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const KEY_BITS = -1 + 2 ** 16;
let KEY_COUNTER = 0;

/// LOCALIZATION
const L10N = {};
L10N.TOKEN = 'word'; // script word on script_page
L10N.LINE = 'line'; // script line
L10N.MSG_SELECT_TOKEN = `Click on a ${L10N.LINE} on the left to edit it.`;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Generates a sequential key index for React lists that increments and wraps
 *  back to 0 after 16 bits exceeded. The output is a 4-digit hex string.
 *  This assumes that no more than 65536 elements are rendered at a time,
 *  which is pretty safe bet :-) We have to do this because our script_page
 *  elements do not have unique ids.
 */
function u_Key(prefix = '') {
  const hex = KEY_COUNTER.toString(16).padStart(4, '0');
  if (++KEY_COUNTER > KEY_BITS) KEY_COUNTER = 0;
  return `${prefix}${hex}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The intent: display the current selected line as a buffered version of the
 *  actual scriptLine so we can select parts of it and edit it separately
 *  from the main display on the left...
 *
 *  There will have to be some wizcore support for the notion of a
 *  "line being edited" buffer]
 *
 *  A line of slots!
 *  a slot can be selected, and designates which editor should be shown
 *  (1) if a slot is empty, it's automatically invalid, and following slots
 *  are also invalid
 *  (2) if a slot is not empty, but it is incorrect, it is also invalid
 *  (3) if a slot is not empty with a correct value, it's "normal"
 *
 *  visual modes:
 *    valid/invalid
 *    selected/notselected
 *    hover/
 */

function SelectEditorSlots(props) {
  const { selection } = props; // sel_linenum, sel_linepos

  if (!selection)
    return <div className="gsled panel panelhelp">{L10N.MSG_SELECT_TOKEN}</div>;

  let selectedError = '';
  let selectedHelp = '';

  // 1. Get Slot Definitions
  /* REVIEW
              When should we use SelectedTokenInfo vs reading State directly?
              NOTE that `selection` above comes from props and only contains
              sel_linenum and sel_linepos, not the whole SelectedTokenInfo
              object.
              * We should probably remove use of the var `selection` elsewhere
                if is not the selected token info.
              * Is passing selection via props even necessary if everyone is
                just reading it directly from wizcore anyway?
  */
  const { slots_linescript, slots_validation, sel_slotpos, sel_linenum } =
    WIZCORE.State();

  // 2. Process each validation token
  const { validationTokens } = slots_validation;
  const tokenList = [];
  const validationTokenCount = validationTokens.length;
  let extraTokenName;
  for (let i = 0; i < validationTokenCount; i++) {
    let label;
    let type;
    let viewState;
    let error;
    let help;
    const position = CHECK.OffsetLineNum(i, 'add');
    const tokenKey = `${sel_linenum},${position}`;
    const selected = sel_slotpos === position;
    const scriptToken = slots_linescript[i];

    /*
        Slot Help
        RATIONALE: This should be a secondary help system, the primary one being for the
                   main "Keyword Help".  But in addition to the general keyword help,
                   as studenters data for individual slots, they'll need help understanding
                   what each individual slot piece is.

                   This should show either:
                   a. The choice token being hovered over (e.g. x or energyType)
                   b. If no hover, then it should show the currently selected choice

        REVIEW: Retreive from validation token?
    */
    // const { gsType, methodSig, unitText } = scriptToken || {}; // gracefully fail if not defined
    // const { name, args: methodArgs, info } = methodSig || {}; // gracefully fail if not defined
    help = `HELP: xxx`;

    const t = validationTokens[i];
    if (t.error && scriptToken) {
      // 1. Error with an entered value
      //    if there's an error in the token, show the current unitText value,
      //    but fall back to gsType if there's no value
      label = t.unitText || t.gsType || label;
      viewState = t.error.code;
      error = t.error.info;
    } else if (t.error) {
      // 2. Error because no value
      //    if there is not current value, show the expected gsType, else show syntax label
      label = t.gsType || label;
      // if the error is vague, use vague, else use empty
      if (t.error.code === 'vague') viewState = 'vague';
      else viewState = 'empty-editing';
      error = t.error.info;
    } else {
      // 3. No error, just show token
      label = t.unitText || GUI_EMPTY_TEXT;
      viewState = t.viewState;
    }
    type = t.gsType;

    selectedError = selected ? error : selectedError;
    selectedHelp = selected ? help : selectedHelp;

    // show Delete button if this is the currently selected token
    if (selected && t.error && t.error.code === 'extra')
      extraTokenName = t.unitText;

    tokenList.push(
      <GValidationToken
        key={tokenKey}
        tokenKey={tokenKey}
        position={position}
        selected={selected}
        type={type}
        label={label}
        error={error}
        help={help}
        viewState={viewState}
        isSlot
      />
    );
  }

  function SaveSlot(e) {
    WIZCORE.SaveSlotLineScript(e);
  }
  function CancelSlotEdit(e) {
    WIZCORE.CancelSlotEdit(e);
  }
  function DeleteSlot(e) {
    WIZCORE.DeleteSlot(e);
  }

  /*
      Keyword Help

      RATIONALE: Provide general guidelines for the purpose of the keyword.
      DESIGN: This should:
      * always be visible while the student is working on the line
      * be loaded from a dictionary

      HACK for now.
  */
  const keywordHelp =
    'Use the "prop" keyword to set properties to specific values and do simple arithmetic.';

  const num = String(sel_linenum).padStart(3, '0');

  /*
      GENERAL DESIGN CONSIDERATIONS

      * Animate changes -- when selecting choices, the abrupt change of elements and
                        shifting of the whole slot editor is confusing.  Is it possible
                        to transition the sizes at least?
      * Choices display -- where should the EditSymbol choices be displayed?
                        Keeping the editted line at top makes sense because it's stable
                        and anchors the editing.  But should the choices (e.g. prop name
                        selection) be displayed above or below the "Save" button"
                        In the mockups we "connected" the choices to the currently
                        selected slot by proximity and color.  The current use of
                        the error and help displays conflicts with this though.
      * Errors on select -- Only show error message on the currently selected slot?
                        That would allow the choices display to move up next to the
                        slot.  And reduces the clutter of seeing too many error
                        messages.  The invalid slots will still be marked red
                        so you need to take care of it.
      * Choice collapse -- research team wants to hide less-common choices.  How
                        do we mark that?  How do we display that?  Especially if
                        it means splitting the choices in one particular category
                        (e.g. some Costume props are collapsed, others are highlighted)
      * "Save" location -- Should "Save" always appear bottom justified?
                        How do we handle short displays?  What should stay fixed
                        and what should scroll?
      * CLickaway       -- Should the current slot line be saved as soon as you click away?
                        *  Add a "[ ] Save when I click away" option?
                        *  Test modeless edit and turn "Cancel" button into "REVERT"?
  */
  return (
    <div className="gsled panel">
      {/* RATIONALE: Title bar to let you know you're editing and show which line you're editing */}
      <div className="gsled panelhelp">EDIT LINE: {num}</div>
      <div
        className="gsled tokenList"
        style={{
          gridTemplateColumns: `repeat(${validationTokenCount},auto)`
        }}
      >
        {tokenList}
      </div>
      <div className="gsled choices">
        <div className="gsled choicesline gwiz styleError">{selectedError}</div>
        {extraTokenName && (
          <div className="gsled choicesline gwiz styleError">
            <button onClick={DeleteSlot}>DELETE {extraTokenName}</button>
          </div>
        )}
        <SelectEditor selection={selection} />
        <div className="gsled choicesline choiceshelp">{selectedHelp}</div>
      </div>
      <div className="gsled button-bar">
        <button type="button" className="secondary" onClick={CancelSlotEdit}>
          Cancel
        </button>
        &nbsp;
        <button type="button" onClick={SaveSlot}>
          Save
        </button>
      </div>
      <div className="gsled panelhelp">{keywordHelp}</div>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SelectEditorSlots };
