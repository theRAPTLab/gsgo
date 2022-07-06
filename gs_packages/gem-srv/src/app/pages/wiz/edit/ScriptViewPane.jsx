/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptView - Given a script_page array of renderable state, emit
  a clickable wizard GUI.

  COMPONENT USAGE

    <ScriptView vmPage={this.state.script_page} />
    where script_page is defined in ac-wizcore

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useEffect } from 'react';
import * as TRANSPILER from 'script/transpiler-v2';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import {
  GLine,
  GBlankLine,
  GToken,
  GValidationToken,
  sScriptView
} from '../SharedElements';
import { LOCKED_SYMBOLS } from './EditSymbol';
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
export function ScriptViewPane(props) {
  // collect resources for rendering
  DBGTEXT = '';
  let { script_page, script_text } = props;

  if (script_text && !script_page) {
    // WIZCORE.SendState({ script_text });
    const toks = TRANSPILER.TextToScript(script_text);
    TRANSPILER.SymbolizeBlueprint(toks);
    const [vmPage, tokMap] = TRANSPILER.ScriptToLines(toks);
    // INSERT validation tokens to script_page
    script_page = vmPage;

    // return <p>loading...</p>;
  }
  const script_page_Validation = WIZCORE.ValidateScriptPage();
  const pageBuffer = [];
  const selTokId = WIZCORE.SelectedTokenId();
  const selLineNum = WIZCORE.SelectedLineNum();

  // DELETION HELPERS
  const isOpenClass = 'modal-is-open';
  const openingClass = 'modal-is-opening';
  const closingClass = 'modal-is-closing';
  function OpenConfirmDeletionModal() {
    document.documentElement.classList.add(isOpenClass, openingClass);
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    confirmDeleteModal.setAttribute('open', true);
  }
  function CloseConfirmDeletionModal() {
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    confirmDeleteModal.setAttribute('open', false);
    document.documentElement.classList.remove(isOpenClass, openingClass);
  }
  function DeleteLine() {
    CloseConfirmDeletionModal();
    WIZCORE.DeleteSelectedLine();
  }
  function ConfirmDeletion(e) {
    e.preventDefault();
    e.stopPropagation();
    OpenConfirmDeletionModal();
  }

  // DELETION MODAL
  const { vmPageLine } = WIZCORE.SelectedTokenInfo() || {}; // if no line is selected yet
  const { lineScript } = vmPageLine || {}; // all of these values will be empty
  const selectedLineText = lineScript
    ? WIZCORE.GetLineScriptText(lineScript)
    : '';
  const confirmDeleteDialog = (
    <dialog id="confirmDeleteModal">
      <article>
        <h3>Delete line?</h3>
        <p>
          Are you sure you want to delete the line
          <br />
          <span style={{ color: 'blue' }}>{selectedLineText}</span>?
        </p>
        <footer>
          <button className="secondary" onClick={CloseConfirmDeletionModal}>
            Cancel
          </button>
          <button onClick={DeleteLine}>Delete</button>
        </footer>
      </article>
    </dialog>
  );

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
      const selected = selLineNum === lineNum;
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

  const addLineBtn = (
    <div className="gwiz">
      <button className="outline btnAddEnd" onClick={e => WIZCORE.AddLine('end')}>
        Add Line
      </button>
    </div>
  );

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
