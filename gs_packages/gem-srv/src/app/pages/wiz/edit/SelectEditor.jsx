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

import { EditSymbol } from './EditSymbol';
import { SelectEditorLineSlot } from './SelectEditorLineSlot';

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

  // TODO: this manipulation should all be moved to a WIZCORE method
  // as much as possible

  // ORIG use selected line validation
  // const { sel_linepos: pos, validation, scriptToken } = selection;
  // NEW use selected slot validation
  const {
    // ORIG selected line position
    // sel_linepos: pos,
    // NEW use selected slot
    sel_slotpos: pos,
    sel_slotvalidation: validation,
    scriptToken
  } = selection;
  const { validationTokens: vtoks, validationLog } = validation;

  // HACK
  // syntaxTokens for 'prop' keyword
  const syntaxTokens = [
    {
      // prop
      gsType: 'identifier',
      unitText: 'keyword' // placeholder help text
    },
    {
      // objref
      gsType: 'objref',
      unitText: 'propName'
    },
    {
      // method
      gsType: 'method',
      unitText: 'method'
    },
    {
      // value
      gsType: 'number', // or string
      unitText: 'number'
    }
  ];

  // REVIEW
  let gsType;
  let unitText;
  let methodSig;
  let methodArgs = [];
  let name;
  let info;
  // if we run out of validation tokens, we should switch to using
  // keyword syntax tokens, not yet defined.  For now, just use a blank.
  if (pos > vtoks.length) {
    // override with syntaxTokens?
    const syntaxToken = syntaxTokens[pos - 1];
    ({ gsType, unitText } = syntaxToken);
  } else {
    // const vtok = vtoks[pos - 1] || {}; // if out of tokens use blank
    // const { arg, gsType, methodSig, unitText } = vtok; // we want to SWITCH ON THIS
    // const { name, args: methodArgs, info } = methodSig || {}; // HACK FOR TESTING and not breaking other tokens
    const vtok = vtoks[pos - 1];
    ({ gsType, methodSig, unitText } = vtok);
    ({ name, args: methodArgs, info } = methodSig || {});
  }

  // end TODO
  const processNumberInput = e => {
    e.preventDefault();
    scriptToken.value = Number(e.target.value);
  };
  const processStringInput = e => {
    e.preventDefault();
    scriptToken.string = String(e.target.value);
  };
  const handleNumberKeypress = e => {
    if (e.key === 'Enter') {
      processNumberInput(e);
      WIZCORE.ScriptChanged();
      e.target.select();
    }
  };
  const handleStringKeypress = e => {
    if (e.key === 'Enter') {
      processStringInput(e);
      WIZCORE.ScriptChanged();
      e.target.select();
    }
  };

  let editor;
  switch (gsType) {
    case 'number':
      editor = (
        <div>
          <SelectEditorLineSlot selection={selection} />
          <p>
            <b>arguments for {name}</b> {methodArgs.join(',')}
            <br />
            <b>helpful</b> {info}
          </p>
          <label>enter {gsType}</label>
          <input
            defaultValue={Number(unitText)}
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
        <div>
          <SelectEditorLineSlot selection={selection} />
          <p>
            <b>arguments for {name}</b> {methodArgs.join(',')}
            <br />
            <b>helpful</b> {info}
          </p>
          <label>enter {gsType}</label>
          <input
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
          <SelectEditorLineSlot selection={selection} />
          <EditSymbol selection={selection} />
        </div>
      );
  }
  return editor;
}

/// COMPONENT EXPORT //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SelectEditor };
