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
  GridStack,
  FlexStack,
  StackUnit,
  GToken,
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
 *
 */
function SelectEditorLineSlot(props) {
  const lineBuffer = [];

  //
  const { sel_validation } = WIZCORE.State();
  const { validationTokens: vTokens } = sel_validation;
  console.log('vtokens', vTokens);

  // todo: redundancy of data truths?
  const { selection } = props;
  const { vmPageLine } = selection || {};
  const { vmTokens } = vmPageLine || {};
  const hasTokens = vmTokens.length > 0;
  const selTokId = WIZCORE.SelectedTokenId();
  const selLineNum = WIZCORE.SelectedLineNum();

  // iterate over vmTokens if it exists
  if (hasTokens) {
    lineBuffer.push(<>SelectEditorLineSlot</>);

    /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
       the intent here is "render a line of gtokens based on the contents
       of the validation token array vmTokens
       - vmToken is a viewModelToken, which is the scriptToken view
       - we want to go off of validationTokens...so where are they?

       - ??? I need to jam symbol data into the vmTokenModel so it's accessible
         everywhere
    :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/

    vmTokens.forEach((tokInfo, idx) => {
      const { scriptToken, tokenKey } = tokInfo;
      const dtok = TRANSPILER.DecodeTokenPrimitive(scriptToken);
      const label =
        typeof dtok !== 'object' ? dtok : TRANSPILER.TokenToString(scriptToken);
      const selected = tokenKey === selTokId;
      lineBuffer.push(
        <GToken
          key={u_Key()}
          position={idx}
          selected={selected}
          label={label}
          tokenKey={tokenKey}
          token={scriptToken}
        />
      );
    });
  }
  return lineBuffer;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SelectEditorLineSlot };
