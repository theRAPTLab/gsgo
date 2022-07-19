/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptViewWiz_Block - Given a script_page array of renderable state, emit
  a clickable wizard GUI.

  Was: ScriptViewPane.jsx

  `sel_linenum` is passed to cause ScriptViewWiz_Block to re-render the
  selected line (to show line add/delete buttons) if the user clicks on an
  existing line.

  COMPONENT USAGE

    <ScriptViewWiz_Block script_page={script_page} sel_linenum={sel_linenum} />

  where script_page is defined in ac-wizcore

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import * as TRANSPILER from 'script/transpiler-v2';
import * as EDITMGR from 'modules/appcore/ac-editmgr';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import Dialog from '../../components/Dialog';
import {
  GLine,
  GBlankLine,
  GToken,
  GValidationToken,
  sScriptView
} from '../SharedElements';
import { LOCKED_SYMBOLS } from './EditSymbol_Block';
// css -- REVIEW: Move to the top level TEMP HACK
import 'lib/vendor/pico.min.css';
import 'lib/css/gem-ui.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
// Whether to render blank lines that come from a ]] block, which has
// no visual equivalent. This will cause line numbers to be discontinuous, but
// will match the script_text line numbers
// See also SHOW_EMPTY_STATEMENTS for related behaviors
const DRAW_CLOSING_LINES = false;

/// UTILITIES /////////////////////////////////////////////////////////////////
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

/// COMPONENT EXPORTS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** React component to render a token and accept props from PrintToken()
 *  generator. We want to grab the specific token reference associated with
 *  this token so we can updated it then WIZCORE.SendState() it. But how???
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let DBGTEXT = '';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function ScriptViewWiz_Block(props) {
  // collect resources for rendering
  let { script_page, sel_linenum } = props;

  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(0);
  DBGTEXT = '';

  const script_page_Validation = WIZCORE.ValidateScriptPage();
  const pageBuffer = [];
  const selTokId = WIZCORE.SelectedTokenId();

  // UI JSX: ADD LINE
  const addLineBtn = (
    <div className="gwiz">
      <button className="outline btnAddEnd" onClick={e => WIZCORE.AddLine('end')}>
        Add Line
      </button>
    </div>
  );

  // UI JSX: DELETION MODAL
  // -- Deletion helpers
  function ConfirmDeletion(e) {
    e.preventDefault();
    e.stopPropagation();
    setDeleteDialogIsOpen(true);
  }
  function HandleConfirmDeleteLine(doDelete) {
    if (doDelete) EDITMGR.DeleteSelectedLine();
    setDeleteDialogIsOpen(false);
  }
  // -- Deletion Display Data
  const { vmPageLine } = WIZCORE.SelectedTokenInfo() || {}; // if no line is selected yet
  const { lineScript } = vmPageLine || {}; // all of these values will be empty
  const selectedLineText = lineScript
    ? WIZCORE.GetLineScriptText(lineScript)
    : '';
  const confirmDeleteDialog = (
    <Dialog
      id="ConfirmDeleteLineDialog"
      open={deleteDialogIsOpen}
      title={'Delete line?'}
      message={
        <>
          Are you sure you want to delete the line
          <br />
          <span style={{ color: 'blue' }}>{selectedLineText}</span>?
        </>
      }
      yesMessage={`Delete`}
      onClose={HandleConfirmDeleteLine}
    />
  );

  // SCRIPT PAGE
  // a page is an array of line viewmodel data
  // the line has token viewmodel data plus line metdata
  if (DBG) console.groupCollapsed('ScriptViewPane Validation');
  script_page.forEach(line => {
    const { lineNum, level, vmTokens } = line;
    const lineBuffer = [];
    const hasTokens = vmTokens.length > 0;
    let lineHasLockedSymbols = false;
    // iterate over vmTokens if it exists
    if (hasTokens) {
      // Iterate over validation tokens so we can show errors
      const css = level > 0 ? 'color:blue;background-color:yellow;' : '';
      if (DBG) console.log(`script_page ${lineNum} %cin:${level}`, css, vmTokens);
      if (DBG && script_page_Validation[lineNum] === undefined)
        console.log(
          'broken because of repacker',
          lineNum,
          script_page_Validation[lineNum]
        );
      // if a line was deleted, lineNum might exceed
      // the script_page_Validation length
      const lineValidationTokens = script_page_Validation[lineNum]
        ? script_page_Validation[lineNum].validationTokens
        : [];

      lineValidationTokens.forEach((validationToken, idx) => {
        const tokInfo = vmTokens[idx] || {};
        let { tokenKey } = tokInfo;
        const { gsType } = validationToken;
        const { scriptToken } = tokInfo;
        let label;
        let selected;
        let viewState;
        if (scriptToken) {
          label = TRANSPILER.TokenToString(scriptToken);
          viewState = validationToken.error ? validationToken.error.code : '';
        } else {
          // no scriptToken, this is an empty slot -- user has not entered any data
          label = validationToken.gsType; // show missing type
          // if the error is vague, use vague, else use empty
          // Force 'empty' because validationToken will report 'invalid' for missing tokens
          if (validationToken.error && validationToken.error.code === 'vague')
            viewState = 'vague';
          else viewState = 'empty';
          tokenKey = `${lineNum},${idx + 1}`; // generate tokenKey
        }
        // locked
        if (LOCKED_SYMBOLS.includes(String(label).toLowerCase())) {
          viewState = 'locked';
          lineHasLockedSymbols = true;
        }
        // selected
        selected = tokenKey === selTokId;
        lineBuffer.push(
          <GValidationToken
            key={u_Key()}
            tokenKey={tokenKey}
            position={idx}
            selected={selected}
            type={gsType}
            label={label}
            viewState={viewState}
          />
        );
        DBGTEXT += `{${tokenKey}} `;
      });
    } else {
      // insert a blank line into the liner buffer
      // eslint-disable-next-line no-lonely-if
      if (DRAW_CLOSING_LINES) lineBuffer.push(<GBlankLine />);
    }
    //
    const num = String(lineNum).padStart(3, '0');
    //
    if (hasTokens || DRAW_CLOSING_LINES) {
      const selected = sel_linenum === lineNum;
      let lineJSX = lineBuffer;
      if (selected) {
        lineJSX = (
          <>
            <button
              className="outline btnAddBefore"
              onClick={e => WIZCORE.AddLine('before')}
            >
              +
            </button>
            <button
              className="outline btnAddAfter"
              onClick={e => WIZCORE.AddLine('after')}
            >
              +
            </button>
            {lineBuffer}
            {!lineHasLockedSymbols && (
              <button className="outline btnDelete" onClick={ConfirmDeletion}>
                DELETE
              </button>
            )}
          </>
        );
      }
      pageBuffer.push(
        <GLine key={u_Key()} selected={selected} lineNum={num} level={level}>
          {lineJSX}
        </GLine>
      );

      DBGTEXT += '\n';
    }
    //
    if (DBG) console.groupEnd();
  });

  if (DBG) {
    console.groupCollapsed('Wizard DBG');
    console.log(DBGTEXT);
  }

  return (
    <>
      <div id="ScriptWizardView" style={sScriptView}>
        {pageBuffer}
      </div>
      {addLineBtn}
      {confirmDeleteDialog}
    </>
  );
}
