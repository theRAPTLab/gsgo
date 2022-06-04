/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SelectEditor

  ~~given the current selection which is a token on the left side,~~
  given the current selection which is a slot token on the RIGHT side,
  determine what kind of token it is, and what the appropriator
  editor is for it. It looks at the validation token array to infer
  what it is from the simple token types

  note:
  the script being rendered is using RAW scriptTokens that are being
  interpreted very simply. However, validationTokens are intepetreted using
  the richer GEMSTEP types, so a weakness of thecurrent system is having to
  constantly reconcile scriptTokens to validationTokens to figure out
  what to draw and what is the "context" of a current token in GEMSTEP terms;
  the scriptToken by itself is not sufficient. This is what the validation
  subsystem is trying to help with, but it's awkward to keep looking things
  up.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';

import { EditSymbol } from './EditSymbol';

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
/** determine what editor to show  */
function SelectEditor(props) {
  const { selection } = props;
  if (selection === undefined) return null;

  const { sel_slotpos: pos, slots_validation: validation } = selection;

  if (pos < 0) return 'Nothing selected';

  const { validationTokens: vtoks, validationLog } = validation;

  const vtok = vtoks[CHECK.UnOffsetLineNum(pos)];
  const { gsType, methodSig, unitText } = vtok || {}; // gracefully fail if not defined
  const { name, args: methodArgs, info } = methodSig || {}; // gracefully fail if not defined

  const processNumberInput = e => {
    e.preventDefault();
    WIZCORE.UpdateSlotValue(Number(e.target.value));
  };
  const processStringInput = e => {
    e.preventDefault();
    WIZCORE.UpdateSlotString(String(e.target.value));
  };
  const handleNumberKeypress = e => {
    if (e.key === 'Enter') {
      processNumberInput(e);
      e.target.select();
    }
  };
  const handleStringKeypress = e => {
    if (e.key === 'Enter') {
      processStringInput(e);
      e.target.select();
    }
  };

  let editor;

  // necessary so input form defaultValue changes with each change
  const tkey = `${selection.sel_linenum},${selection.sel_slotpos}`;

  // necessary to prevent NaN error if unitText is undefined
  let defaultNumber = Number(unitText);
  defaultNumber = Number.isNaN(defaultNumber) ? '' : defaultNumber; // make sure it's number

  switch (gsType) {
    case 'number':
      editor = (
        <div className="gsled input">
          <label>Enter a {gsType}</label>
          <input
            key={tkey}
            defaultValue={defaultNumber}
            type="number"
            onChange={processNumberInput}
            onKeyPress={handleNumberKeypress}
          />
          ;
        </div>
      );
      break;
    case 'string':
      editor = (
        <div className="gsled input">
          <label>Enter a {gsType}</label>
          <input
            key={tkey}
            defaultValue={unitText}
            type="text"
            onChange={processStringInput}
            onKeyPress={handleStringKeypress}
          />
          ;
        </div>
      );
      break;
    default:
      editor = (
        <div>
          <EditSymbol selection={selection} />
        </div>
      );
  }
  return editor;
}

/// COMPONENT EXPORT //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SelectEditor };
