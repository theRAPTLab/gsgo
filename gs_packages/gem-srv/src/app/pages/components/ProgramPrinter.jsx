/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptUnit to JSX Renderer - Given a source tokens for a program, return
  an array of array of JSX elements

  API METHODS
  * GetProgramJSX( program: ScriptUnit[] )

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { expect } from '@hapi/code';
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
    >
      {LINE_NUM}
    </div>
  );
}

/// PRINT CONTROLLER METHODS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PrintBlock(block) {
  block.forEach(stm => {
    // print statement array by reference
    PrintStatement(stm);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PrintStatement(stm) {
  stm.forEach((tok, idx) => {
    // if it's a block token then have to print it
    // (pass array by reference)
    if (idx === 0) m_NextLine();
    if (Array.isArray(tok.block)) {
      m_Indent();
      //
      PrintBlock(tok.block);
      //
      m_Outdent();
      return;
    }
    // check for blank lines
    if (tok.line !== undefined) return;
    // otherwise just print
    PrintToken(tok);
  });
  // flush buffer after statement is printed, increment line
  m_Flush();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PrintToken(tok) {
  // should not get block tokens
  if (Array.isArray(tok.block)) throw Error('unexpected block token');

  // QUICK AND DIRTY TOKEN TEST
  if (!WIZCORE.IsTokenInMaster(tok)) console.log('missing tok');
  // decode the token
  const dtok = DecodeTokenPrimitive(tok);
  // did token represent simple value?
  if (typeof dtok !== 'object') {
    m_Print(<GToken text={dtok} token={tok} />);
    return;
  }
  // if got this far, token is an extended type
  // get the text representation of the token and print it
  m_Print(<GToken text={TokenToString(dtok)} token={tok} />);
}

/// REACT COMPONENTS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** React component to render a token and accept props from PrintToken()
 *  generator. We want to grab the specific token reference associated with
 *  this token so we can updated it then WIZCORE.SendState() it. But how???
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let UPDATE_HANDLER = () => {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GToken(props) {
  const data = `${LINE_NUM}.${LINE_IDX}`;
  const { token, text } = props;
  return (
    <div
      className="gwiz gtoken styleOpen"
      data={data}
      onClick={() => {
        if (token.token) {
          if (DBG) console.log(`changing '${token.token}' to 'foo'`);
          token.token = 'foo';
          UPDATE_HANDLER();
        }
      }}
    >
      {text}
    </div>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** React component called from DevWizard */
export function ProgramPrinter(props) {
  const { program, updateHandler } = props;
  if (typeof updateHandler === 'function') UPDATE_HANDLER = updateHandler;
  m_Clear();
  PrintBlock(program);
  return PAGE;
}
