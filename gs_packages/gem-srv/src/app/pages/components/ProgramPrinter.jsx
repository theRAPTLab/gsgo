/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptUnit to JSX Renderer - Given a source tokens for a program, return
  an array of array of JSX elements

  COMPONENT USAGE

    <PrintProgram program={scriptUnits} />

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import {
  TokenToString,
  DecodeTokenPrimitive
} from '../../../modules/sim/script/transpiler-v2';
import * as WIZCORE from '../../../modules/appcore/ac-gui-mvvm';

/// DEBUG CONSTANTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// LINE PRINTING MACHINE //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TABSIZE = 1.5; // in em
//
let INDENT = TABSIZE;
let LINE_NUM = 0;
let LINE_IDX = 0;
let LINE_BUF = [];
let PAGE = [];
//
let CHEESE_KEY = 0;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function u_Key(prefix = '') {
  const key = `${prefix}${CHEESE_KEY}`;
  CHEESE_KEY++;
  return key;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Indent() {
  ++INDENT;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Outdent() {
  --INDENT;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Clear() {
  LINE_BUF = [];
  LINE_IDX = 0;
  LINE_NUM = 0;
  PAGE = [];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Print(element) {
  LINE_BUF.push(element);
  LINE_IDX++;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Flush() {
  PAGE.push(LINE_BUF);
  LINE_BUF = [];
  LINE_IDX = 0;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_NextLine() {
  LINE_NUM++;
  const ww = INDENT * TABSIZE;
  LINE_BUF.push(
    <div
      className="gwiz lineLead newline"
      style={{ width: `${ww}em`, paddingTop: '5px' }}
      key={u_Key('nl')}
    >
      {LINE_NUM}
    </div>
  );
}

/// PRINT CONTROLLER METHODS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PrintBlock(props) {
  const { block } = props;
  block.forEach(statement => {
    // print statement array by reference
    PrintStatement({ statement });
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PrintStatement(props) {
  const { statement } = props;
  statement.forEach((tok, idx) => {
    // if it's a block token then have to print it
    // (pass array by reference)
    if (idx === 0) m_NextLine();
    if (Array.isArray(tok.block)) {
      m_Indent();
      //
      PrintBlock({ block: tok.block });
      //
      m_Outdent();
      return;
    }
    // check for blank lines
    if (tok.line !== undefined) return;
    // otherwise just print
    PrintToken({ token: tok });
  });
  // flush buffer after statement is printed, increment line
  m_Flush();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PrintToken(props) {
  const { token } = props;
  // should not get block tokens
  if (Array.isArray(token.block)) throw Error('unexpected block token');
  // create objects to capture current values
  const data = { type: 'token', token, line: LINE_NUM, index: LINE_IDX };
  const dispatcher = event => WIZCORE.DispatchClick(event, data);
  // decode the token
  const dtok = DecodeTokenPrimitive(token);
  // is token a SIMPLE VALUE?
  if (typeof dtok !== 'object') {
    m_Print(
      <GToken
        label={dtok}
        token={token}
        dispatcher={dispatcher}
        key={u_Key('tok')}
      />
    );
    return;
  }
  // token must be NON-SIMPLE VALUE
  // placeholder: just print the text representation of the token
  m_Print(
    <GToken
      label={TokenToString(dtok)}
      token={token}
      dispatcher={dispatcher}
      key={u_Key('tok')}
    />
  );
}

/// REACT COMPONENTS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** React component to render a token and accept props from PrintToken()
 *  generator. We want to grab the specific token reference associated with
 *  this token so we can updated it then WIZCORE.SendState() it. But how???
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GToken(props) {
  const { label, dispatcher } = props;
  return (
    <div className="gwiz gtoken styleOpen" onClick={dispatcher}>
      {label}
    </div>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** React component called from DevWizard */
export function ProgramPrinter(props) {
  const { program } = props;
  m_Clear();
  PrintBlock({ block: program });
  return PAGE;
}
