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

import UR from '@gemstep/ursys/client';
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
let TEST_NUM = 2;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// FAKE DATA
// This is the "syntax" expected based on the current keyword
// selected (and any relevant props and methods)
// HOW TO USE IT: Uncomment just ONE of the example slots definitions
//                evaluate the selected vmTokens against the slot definition

// EXAMPLE 0: 'prop' - propName is empty, so method is vague
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

// EXAMPLE 1: 'prop x' - method is empty, so value is vague
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

// EXAMPLE 2: 'prop x setTo' - method is selected, but value is empty but expected to be number
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
  const { sel_slotpos, sel_slotlinescript, cur_bdl } = WIZCORE.State();
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// SRI HACK
  const slots = TEST_SLOTS[TEST_NUM];

  // FAKE DATA
  const SYNTAX_TOKENS = [
    {
      expectedType: 'identifier',
      dataSelectKey: 1,
      label: 'keyword',
      viewState: VIEWSTATE.EMPTY
    },
    {
      expectedType: 'objref',
      dataSelectKey: 2,
      label: 'propName',
      viewState: VIEWSTATE.EMPTY
    },
    {
      expectedType: 'method',
      dataSelectKey: 3,
      label: 'method',
      viewState: VIEWSTATE.VAGUE
    },
    {
      expectedType: 'value',
      dataSelectKey: 4,
      label: 'value',
      viewState: VIEWSTATE.VAGUE
    }
  ];

  /// TEST syntax slots
  // `validationTokens` are {gsType, unitText, error, ...symbols}
  const { validationTokens } = TRANSPILER.ValidateStatement(sel_slotlinescript, {
    bundle: cur_bdl,
    globals: [] // REVIEW where should this come from?
  });
  const tokenList = [];
  const syntaxTokenCount = SYNTAX_TOKENS.length;
  const validationTokenCount = validationTokens.length;
  // if validationTokens exceed the expected syntax, make sure we show the overflow
  const slotCount = Math.max(syntaxTokenCount, validationTokenCount);
  for (let i = 0; i < slotCount; i++) {
    let label;
    let type;
    let viewState;
    const dataSelectKey = i + TRANSPILER.SCRIPT_PAGE_INDEX_OFFSET;
    const selected = sel_slotpos === dataSelectKey;
    // HACK Read Syntax -- SYNTAX TOKENS should be generated by wizcore
    // based on the currently selected keyword, property type, and
    // method.
    // Get syntax token if it exists
    if (i < syntaxTokenCount) {
      const syntax = SYNTAX_TOKENS[i];
      ({ label, gsType: type, viewState } = syntax);
    } else {
      // validationToken count exceeds syntaxTokenCount, so return overflow
      label = VIEWSTATE.UNEXPECTED;
      viewState = VIEWSTATE.UNEXPECTED;
    }

    // Get validation token, if it exists
    if (i < validationTokenCount) {
      // validationToken exists, so show the token value
      const t = validationTokens[i];
      if (t.error) {
        // if there's an error in the token, show the current unitText value
        // if there is not current value, show the expected gsType, else show syntax label
        // REVIEW VSymError doesn't return the original text, just
        // {error: {code, info}}.  Might be nice to have the orig text
        label = t.unitText || t.gsType || label;
        type = t.gsType;
        // can we use the error code for the viewstate?
        viewState = t.error.code;
        // and force type
      } else {
        // Show token
        label = t.unitText;
        type = t.gsType;
        viewState = t.viewState;
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
      <button type="button" onClick={WIZCORE.ScriptChanged}>
        Cancel (not implemented)
      </button>
      <button type="button" onClick={WIZCORE.SaveSlotLineScript}>
        Save
      </button>
    </div>
  );
}

/// DEBUG COMMANDS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool('test_slot', test => {
  // increment
  if (typeof test !== 'number') {
    TEST_NUM = TEST_NUM++ >= TEST_SLOTS.length - 1 ? 0 : TEST_NUM;
  } else if (test >= 0 && test < TEST_SLOTS.length) TEST_NUM = test;
  return `setting slot test data to ${TEST_NUM}`;
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SelectEditorLineSlot };
