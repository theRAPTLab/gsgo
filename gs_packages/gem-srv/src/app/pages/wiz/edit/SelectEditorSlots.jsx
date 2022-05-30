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
  VIEWSTATE,
  GridStack,
  FlexStack,
  StackUnit,
  GToken,
  GSlotToken,
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
  const { slots_validation, sel_slotpos } = WIZCORE.State();

  // 2. Process each validation token
  const { validationTokens } = slots_validation;
  const tokenList = [];
  const validationTokenCount = validationTokens.length;
  for (let i = 0; i < validationTokenCount; i++) {
    let label;
    let type;
    let viewState;
    const dataSelectKey = CHECK.OffsetLineNum(i);
    const selected = sel_slotpos === dataSelectKey;

    const t = validationTokens[i];
    if (t.error) {
      // if there's an error in the token, show the current unitText value
      // if there is not current value, show the expected gsType, else show syntax label
      // REVIEW VSymError doesn't return the original text, just
      // {error: {code, info}}.  Might be nice to have the orig text?
      label = t.unitText || t.gsType || label;
      type = t.gsType;
      viewState = t.error.code;
    } else {
      // No error, just show token
      label = t.unitText;
      type = t.gsType;
      viewState = t.viewState;
    }

    tokenList.push(
      <GSlotToken
        key={dataSelectKey}
        dataSelectKey={dataSelectKey}
        selected={selected}
        type={type}
        label={label}
        viewState={viewState}
      />
    );
  }

  function SaveSlot(e) {
    WIZCORE.SaveSlotLineScript(e);
  }
  function CancelSlotEdit(e) {
    WIZCORE.ScriptChanged(e);
  }

  return (
    <div>
      <div style={{ backgroundColor: '#eee', padding: '10px' }}>{tokenList}</div>
      <div
        style={{
          display: 'grid',
          padding: '10px',
          backgroundColor: '#666',
          gridTemplateColumns: '45% 10% 45%'
        }}
      >
        <button type="button" onClick={CancelSlotEdit}>
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
