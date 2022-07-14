/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SlotEditorSelect_Block

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
import * as SLOTCORE from 'modules/appcore/ac-slotcore';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';

import { ObjRefSelector_Block } from './ObjRefSelector_Block';
import { LOCKED_SYMBOLS, EditSymbol_Block } from './EditSymbol_Block';

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
/** determine what editor to show
 *  @param object props
 *  @param object props.selection
 *  // from WIZCORE.SelectedTokenId
 *  @param object props.selection.sel_linenum
 *  @param object props.selection.sel_linepos
 *  @param object props.selection.vmPageLine
 *  // from slot
 *  @param object props.selection.sel_slotpos
 *  @param object props.selection.slots_validation
 *  @param object props.selection.slots_linescript
 */
function SlotEditorSelect_Block(props) {
  const { selection } = props;
  if (selection === undefined) return null;

  const { sel_slotpos: pos, slots_validation: validation } = selection;

  if (pos < 0) return <div className="gsled input">Nothing selected</div>;

  const { validationTokens: vtoks, validationLog } = validation;

  // get the vtoken of the current slot
  const vtok = vtoks[CHECK.OffsetLineNum(pos, 'sub')];
  const { gsType, methodSig, unitText } = vtok || {}; // gracefully fail if not defined
  const { name, args: methodArgs, info } = methodSig || {}; // gracefully fail if not defined

  const processNumberInput = e => {
    e.preventDefault();
    SLOTCORE.UpdateSlotValue(Number(e.target.value));
  };
  const processStringInput = e => {
    e.preventDefault();
    SLOTCORE.UpdateSlotString(String(e.target.value));
  };
  // note this needs to have a new wizcore method for identifier input types
  // this is just a copy of processStringInput
  const processIdentifierInput = e => {
    e.preventDefault();
    const err = SLOTCORE.UpdateIdentifier(String(e.target.value));
    if (err) alert(err);
  };
  const processBooleanInput = e => {
    e.preventDefault();
    const toggled = unitText === 'true' ? false : true;
    SLOTCORE.UpdateSlotBoolean(toggled);
  };
  const processExprInput = e => {
    e.preventDefault();
    SLOTCORE.UpdateSlotExpr(String(e.target.value));
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
  const handleExprKeypress = e => {
    if (e.key === 'Enter') {
      processStringInput(e);
      e.target.select();
    }
  };
  const handleIdentifierKeydown = e => {
    if (e.code === 'Space') e.preventDefault(); // no spaces allowed in identifier
    if (e.key === 'Enter') {
      processIdentifierInput(e);
      e.target.select();
    }
  };

  let editor;

  // necessary so input form defaultValue changes with each change
  const tkey = `${selection.sel_linenum},${selection.sel_slotpos}`;

  // necessary to prevent NaN error if unitText is undefined
  let defaultNumber = Number(unitText);
  defaultNumber = Number.isNaN(defaultNumber) ? '' : defaultNumber; // make sure it's number

  // locked
  const locked = unitText && LOCKED_SYMBOLS.includes(unitText.toLowerCase());

  switch (gsType) {
    case 'identifier':
      editor = (
        <div className="gsled input">
          <label>Enter a {gsType}</label>
          <input
            key={tkey}
            defaultValue={unitText}
            type="text"
            onChange={processIdentifierInput}
            onKeyDown={handleIdentifierKeydown}
          />
          ;
        </div>
      );
      break;
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
      // UnpackToken inserts the string "undefined" for undefined tokens
      // so we need to strip it out here so the input field doesn't default
      // to "undefined"
      const defaultString = unitText === 'undefined' ? '' : unitText; // show blank rather than 'undefined' if unitText is not defined
      editor = (
        <div className="gsled input">
          <label>Enter a {gsType}</label>
          <input
            key={tkey}
            defaultValue={defaultString}
            type="text"
            onChange={processStringInput}
            onKeyPress={handleStringKeypress}
          />
          ;
        </div>
      );
      break;
    case 'boolean':
      // NOTE `unitText` is a string
      /* RATIONALE: While a checkbox is the normal UI element for booleans,
         the choice of true or false is somewhat implicit.
         A range slider makes it clearer which selection is true
         and which is false.  So we convert the true/false values
         in the token to a range value between 0 and 1.  This conversion
         is all done in SelectEditor.
      */
      editor = (
        <div
          className="gsled input"
          style={{ display: 'grid', gridTemplateColumns: '50px 50px 50px' }}
        >
          <label style={{ textAlign: 'right', paddingRight: '10px' }}>
            false
          </label>
          <input
            key={tkey}
            defaultChecked={unitText === 'true' ? 'checked' : undefined}
            type="checkbox"
            role="switch"
            onInput={processBooleanInput}
          />
          <label style={{ textAlign: 'left', paddingLeft: '10px' }}>true</label>
        </div>
      );
      break;
    case 'prop':
      editor = (
        <div className="gsled input">
          <label>Enter a propName identifier</label>
          <input
            key={tkey}
            defaultValue={unitText}
            type="text"
            onChange={processIdentifierInput}
            onKeyPress={handleStringKeypress}
          />
          ;
        </div>
      );
      break;
    case 'expr':
      editor = (
        <div className="gsled input">
          <label>Enter an expression string</label>
          <input
            key={tkey}
            defaultValue={unitText}
            type="text"
            onChange={processExprInput}
            onKeyPress={handleExprKeypress}
          />
          ;
        </div>
      );
      break;
    case 'objref':
      editor = (
        <div>
          <ObjRefSelector_Block
            selection={selection}
            expectedType={gsType}
            objRefPos={pos}
          />
        </div>
      );
      break;
    default:
      editor = (
        <div>
          <EditSymbol_Block
            selection={selection}
            expectedType={gsType}
            locked={locked}
          />
        </div>
      );
  }
  return editor;
}

/// COMPONENT EXPORT //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SlotEditorSelect_Block };
