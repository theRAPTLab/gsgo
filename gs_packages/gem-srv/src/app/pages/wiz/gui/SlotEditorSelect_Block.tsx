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
  the richer GEMSTEP types, so a weakness of the current system is having to
  constantly reconcile scriptTokens to validationTokens to figure out
  what to draw and what is the "context" of a current token in GEMSTEP terms;
  the scriptToken by itself is not sufficient. This is what the validation
  subsystem is trying to help with, but it's awkward to keep looking things
  up.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as PIXI from 'pixi.js';
import * as EDITMGR from 'modules/appcore/ac-editmgr';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import * as HELP from 'app/help/codex';

import { ObjRefSelector_Block } from './ObjRefSelector_Block';
import { LOCKED_SYMBOLS, EditSymbol_Block } from './EditSymbol_Block';
import { HelpLabel } from '../SharedElements';

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

  // Value Change Handlers
  const processNumberInput = e => {
    e.preventDefault();
    EDITMGR.UpdateSlot({
      value: Number(e.target.value),
      type: 'value'
    });
  };
  const processStringInput = e => {
    e.preventDefault();
    EDITMGR.UpdateSlot({
      value: String(e.target.value),
      type: 'string'
    });
  };
  const processBooleanInput = e => {
    e.preventDefault();
    const toggled = unitText === 'true' ? false : true;
    EDITMGR.UpdateSlot({
      value: toggled,
      type: 'value' // validTokenTypes = value with arg=boolean
    });
  };
  const processIdentifierInput = e => {
    e.preventDefault();
    EDITMGR.UpdateSlot({
      value: String(e.target.value),
      type: 'identifier'
    });
  };
  const processExprInput = e => {
    e.preventDefault();
    EDITMGR.UpdateSlot({
      value: String(e.target.value),
      type: 'expr'
    });
  };
  const processColorInput = e => {
    e.preventDefault();
    let colorstr = PIXI.utils.string2hex(e.target.value);
    EDITMGR.UpdateSlot({
      value: colorstr,
      type: 'value'
    });
  };

  // Keypress Handlers
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
      processExprInput(e);
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
  let defaultNumber: any = Number(unitText);
  defaultNumber = Number.isNaN(defaultNumber) ? '' : defaultNumber; // make sure it's number

  // locked
  const locked = unitText && LOCKED_SYMBOLS.includes(unitText.toLowerCase());

  let { name: helpPrompt, info: helpInfo } = HELP.ForTypeInfo(gsType);
  helpPrompt = `ENTER ${helpPrompt}`.toUpperCase();

  switch (gsType) {
    case 'identifier':
      editor = (
        <div id="SES_ident" className="gsled input">
          <HelpLabel prompt={helpPrompt} info={helpInfo} open pad="5px" />
          <input
            key={tkey}
            defaultValue={unitText}
            type="text"
            onChange={processIdentifierInput}
            onKeyDown={handleIdentifierKeydown}
          />
        </div>
      );
      break;
    case 'number':
      editor = (
        <div id="SES_num" className="gsled input">
          <HelpLabel prompt={helpPrompt} info={helpInfo} open pad="5px" />
          <input
            key={tkey}
            defaultValue={defaultNumber}
            type="number"
            onChange={processNumberInput}
            onKeyPress={handleNumberKeypress}
          />
        </div>
      );
      break;
    case 'color':
      const colorstr = PIXI.utils.hex2string(defaultNumber);
      editor = (
        <div id="SES_color" className="gsled input">
          <HelpLabel prompt={helpPrompt} info={helpInfo} open pad="5px" />
          <input
            key={tkey}
            defaultValue={colorstr}
            type="color"
            onChange={processColorInput}
          />
        </div>
      );
      break;
    case 'string':
      // UnpackToken inserts the string "undefined" for undefined tokens
      // so we need to strip it out here so the input field doesn't default
      // to "undefined"
      const defaultString = unitText === 'undefined' ? '' : unitText; // show blank rather than 'undefined' if unitText is not defined
      editor = (
        <div id="SES_str" className="gsled input">
          <HelpLabel prompt={helpPrompt} info={helpInfo} open pad="5px" />
          <input
            key={tkey}
            defaultValue={defaultString}
            type="text"
            onChange={processStringInput}
            onKeyPress={handleStringKeypress}
          />
        </div>
      );
      break;
    case 'boolean':
      /* RATIONALE: While a checkbox is the normal UI element for booleans,
         the choice of true or false is somewhat implicit.
         A range slider makes it clearer which selection is true
         and which is false.  So we convert the true/false values
         in the token to a range value between 0 and 1.  This conversion
         is all done in SelectEditor.
      */
      // When first defining a boolean, set it to False by default
      if (unitText === 'undefined')
        EDITMGR.UpdateSlot({
          value: false,
          type: 'value' // validTokenTypes = value with arg=boolean
        });
      editor = (
        <div id="SES_bool">
          <HelpLabel prompt={helpPrompt} info={helpInfo} open pad="10px" />
          <div
            className="gsled input"
            style={{ display: 'grid', gridTemplateColumns: '50px 50px 50px' }}
          >
            <label style={{ textAlign: 'right', paddingRight: '10px' }}>
              false
            </label>
            <input
              key={tkey}
              checked={unitText === 'true'} // 'unitText' is a string
              type="checkbox"
              role="switch"
              onChange={processBooleanInput}
            />
            <label style={{ textAlign: 'left', paddingLeft: '10px' }}>true</label>
          </div>
        </div>
      );
      break;
    case 'prop':
      editor = (
        <div id="SES_prop" className="gsled input">
          <HelpLabel prompt={helpPrompt} info={helpInfo} pad="5px" />
          <input
            key={tkey}
            defaultValue={unitText}
            type="text"
            onChange={processIdentifierInput}
            onKeyPress={handleIdentifierKeydown}
          />
        </div>
      );
      break;
    case 'expr':
      const defaultExpr = unitText.replace(/^{{\s/, '').replace(/\s}}$/, '');
      editor = (
        <div id="SES_expr" className="gsled input">
          <HelpLabel prompt={helpPrompt} info={helpInfo} open pad="5px" />
          <input
            key={tkey}
            defaultValue={defaultExpr}
            type="text"
            onChange={processExprInput}
            onKeyPress={handleExprKeypress}
          />
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
    case 'block':
      editor = (
        <div id="SES_block" className="gsled input">
          <HelpLabel prompt={helpPrompt} info={helpInfo} open pad="5px" />
          <label>
            Click here to ensure that a block exists right after this, right here
            in SlotEditorSelect_Block line case:block
          </label>
        </div>
      );
      break;
    default:
      editor = (
        <div id="SES_default">
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
