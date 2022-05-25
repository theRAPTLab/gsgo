/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SelectEditLineSlot

  DATA NEEDS FOR THE COMPONENT (WIP)

  scriptCopy is a duplicate of the current scriptLine that's being edited; we
  don't want to change it

  const slots = WIZCORE.GetSlotViewData(scriptCopy)

  slots looks like
  [
    { styleFlags, dataSlotKey },
    ...
  ]
  styleFlags = {
    isSelected,
    isNonEmptyAndValid,
    isNonEmptyAndInvalid,
    isEmpty
  }

  dataSlotKey is the current selection inside the editor

  scriptCopy should be updated automatically from scriptCopy itself everytime it
  changes, so WIZCORE has to handle it for us.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import * as TRANSPILER from 'script/transpiler-v2';

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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// FAKE DATA
let TEST_SLOTS = [];
let TEST_NUM = 0;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// FAKE DATA
// This is the "syntax" expected based on the current keyword
// selected (and any relevant props and methods)
// HOW TO USE IT: Uncomment just ONE of the example slots definitions
//                evaluate the selected vmTokens against the slot definition

// EXAMPLE: 'prop' - propName is empty, so method is vague
TEST_SLOTS.push([
  {
    expectedType: 'identifier',
    dataSelectKey: 1,
    viewState: VIEWSTATE.VALID,
    unitText: 'prop'
  },
  {
    expectedType: 'objref',
    dataSelectKey: 2,
    viewState: VIEWSTATE.EMPTY,
    unitText: 'propName'
  },
  {
    expectedType: 'method',
    dataSelectKey: 3,
    viewState: VIEWSTATE.VAGUE,
    unitText: 'method'
  },
  {
    expectedType: 'value',
    dataSelectKey: 4,
    viewState: VIEWSTATE.VAGUE,
    unitText: 'value'
  }
]);

// EXAMPLE: 'prop x' - method is empty, so value is vague
TEST_SLOTS.push([
  {
    expectedType: 'identifier',
    dataSelectKey: 1,
    viewState: VIEWSTATE.VALID,
    unitText: 'prop'
  },
  {
    expectedType: 'objref',
    dataSelectKey: 2,
    viewState: VIEWSTATE.VALID,
    unitText: 'propName'
  },
  {
    expectedType: 'method',
    dataSelectKey: 3,
    viewState: VIEWSTATE.EMPTY,
    unitText: 'method'
  },
  {
    expectedType: 'value',
    dataSelectKey: 4,
    viewState: VIEWSTATE.VAGUE,
    unitText: 'value'
  }
]);

// EXAMPLE: 'prop x setTo' - method is selected, but value is empty but expected to be number
TEST_SLOTS.push([
  {
    expectedType: 'identifier',
    dataSelectKey: 1,
    viewState: VIEWSTATE.VALID,
    unitText: 'prop'
  },
  {
    expectedType: 'objref',
    dataSelectKey: 2,
    viewState: VIEWSTATE.VALID,
    unitText: 'propName'
  },
  {
    expectedType: 'method',
    dataSelectKey: 3,
    viewState: VIEWSTATE.VALID,
    unitText: 'method'
  },
  {
    expectedType: 'number',
    dataSelectKey: 4,
    viewState: VIEWSTATE.EMPTY,
    unitText: 'number'
  }
]);

// END FAKE DATA

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
 *
 *
 *  BEN'S NOTES
 *  -----------
 *  There are three data sources:
 *  1. `slot` -- The slot definitions from WIZCORE
 *     based on the currently selected line (can be incomplete)
 *     e.g. propKeyword, propName, propMethod, propValue
 *  2. `vmTokens` -- The currently selected line items (can be incomplete)
 *     e.g. 'prop', 'x'
 *  3. `validationTokens` -- The validation state of each selected and expected
 *     line item.  This is not used by the SelectEditorLineSlot.
 *     e.g. for 'prop x': valid, valid, invalid (missing method)
 *
 *
 */

// CURRENT LOCAL STORE?

function SelectEditorLineSlot(props) {
  // 1. Get Slot Definitions
  // line = WIZCORE.SelectedLineNum();
  // const pageLine = WIZCORE.GetVMPageLine(line);
  // const { lineScript } = pageLine;
  // const slots = WIZCORE.GetSlotViewData(lineScript);
  const { sel_slot } = WIZCORE.State();
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// SRI HACK
  const slots = TEST_SLOTS[TEST_NUM];

  // 2. Get Current Line Item Definition

  // NOT USED CURRENTLY
  // -- Do we need these?  Is 'vmTokens' enough?
  // const { sel_validation } = WIZCORE.State();
  // const { validationTokens: vTokens } = sel_validation;
  // vTokens display the validity of the parsed line
  // e.g. vTokens for 'prop x' would have vTokens[2] = VSymError( gsType: "method" )

  // todo: redundancy of data truths?
  const { selection } = props;
  const { vmPageLine } = selection || {};
  const { vmTokens } = vmPageLine || {}; // vmTokens are

  // 3. Render Slots and Line Items
  //    Use the vmToken value if present, otherwise, use the slot value
  const count = Math.max(slots.length, vmTokens.length);
  const tokenList = [];
  for (let i = 0; i < count; i++) {
    const slot = i < slots.length ? slots[i] : undefined;
    const vmToken = i < vmTokens.length ? vmTokens[i] : undefined;

    // a. default to unexpected slot if the slot is not defined
    let dataSelectKey = i + 1; // token count starts at 1
    let type = 'unexpected';
    let label = 'unexpected';
    let viewState = VIEWSTATE.UNEXPECTED;

    // b. if the slot IS defined, first set the expected slot values...
    if (slot) {
      dataSelectKey = slot.dataSelectKey;
      label = slot.unitText;
      type = slot.expectedType;
      viewState = slot.viewState;
    }
    const selected = sel_slot === dataSelectKey;

    // c. ...OTOH if the slot item has been defined (vmToken), use the defined values
    if (vmToken) {
      const { scriptToken, tokenKey } = vmToken;
      if (scriptToken) {
        const dtok = TRANSPILER.DecodeTokenPrimitive(scriptToken);
        label =
          typeof dtok !== 'object' ? dtok : TRANSPILER.TokenToString(scriptToken);
        type = scriptToken.type;
      }
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
  return (
    <div>
      (test {TEST_NUM}) {tokenList}
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SelectEditorLineSlot };
