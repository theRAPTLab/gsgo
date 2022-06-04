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

import {
  GridStack,
  FlexStack,
  StackUnit,
  GToken,
  GValidationToken,
  StackText
} from '../SharedElements';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const KEY_BITS = -1 + 2 ** 16;
let KEY_COUNTER = 0;

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
  // 1. Get Slot Definitions
  const { slots_linescript, slots_validation, sel_slotpos, sel_linenum } =
    WIZCORE.State();

  // 2. Process each validation token
  const { validationTokens } = slots_validation;
  const tokenList = [];
  const validationTokenCount = validationTokens.length;
  for (let i = 0; i < validationTokenCount; i++) {
    let label;
    let type;
    let viewState;
    let error;
    let help;
    const position = CHECK.OffsetLineNum(i);
    const tokenKey = `${sel_linenum},${position}`;
    const selected = sel_slotpos === position;
    const scriptToken = slots_linescript[i];

    /*
        Slot Help
        RATIONALE: This should be a secondary help system, the primary one being for the
                   main "Keyword Help".  But in addition to the general keyword help,
                   as studenters data for individual slots, they'll need help understanding
                   what each individual slot piece is.
        REVIEW: Retrive from validation token?
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
      label = t.unitText;
      viewState = t.viewState;
    }
    type = t.gsType;

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


  const num = String(sel_linenum).padStart(3, '0');
  return (
    <div className="gslot-ed">
      <div className="gslot-ed help">EDIT LINE {num}</div>
      <div
        className="gslot-ed tokenList"
        style={{
          gridTemplateColumns: `repeat(${validationTokenCount},auto)`
        }}
      >
        {tokenList}
      </div>
      <div className="gslot-ed button-bar">
        <button type="button" className="secondary" onClick={CancelSlotEdit}>
          Cancel
        </button>
        &nbsp;
        <button type="button" onClick={SaveSlot}>
          Save
        </button>
      </div>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SelectEditorSlots };
