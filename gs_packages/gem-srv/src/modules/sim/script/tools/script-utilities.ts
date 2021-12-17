/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptUnit Utilities

  * ScriptToLines converts a program of scriptUnit statements into
    a line-based data structure suitable for rendering as an array of
    React elements

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { TScriptUnit, IToken } from 'lib/t-script.d';
import { VMToken, VMTokenLine } from 'lib/t-ui.d';

/// CONSTANT & DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
let DBGTEXT = '';

// whether to count blank lines or not
const COUNT_ALL_LINES = true; // see WizardView RENDER_BLOCK_CLOSE

/// LINE PRINTING MACHINE //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// A "token printer" that maintains a current line buffer. The line buffer is
/// pushed into a page buffer whenever a new line starts. This is used to
/// convert statements that contain nested statements in their line-by-line
/// equivalent
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LINE_START_NUM = 1; // set to 1 for no 0 indexes
let INDENT = 0;
let STM_STACK = [];
let LINE_NUM = LINE_START_NUM;
let LINE_POS = LINE_START_NUM;
let LINE_BUF = [];
let PAGE = [];
let MAP = new Map<string, IToken>(); // reverse lookup from tokenIdstring to token
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Indent(): void {
  ++INDENT;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Outdent(): void {
  --INDENT;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Info() {
  return { lineNum: LINE_NUM, linePos: LINE_POS, level: INDENT };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Clear(): void {
  LINE_BUF = [];
  LINE_POS = LINE_START_NUM;
  LINE_NUM = LINE_START_NUM;
  STM_STACK = [];
  PAGE = [];
  MAP.clear();
  DBGTEXT = '';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** used to save the current statement for the token, though this information
 *  can also be pulled from the PAGE data structure by lineNum
 */
function m_PushStatement(stm: TScriptUnit): void {
  STM_STACK.push(stm); // save statement on stack
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_PopStatement(): TScriptUnit[] {
  return STM_STACK.pop(); // save statement on stack
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_PeekStatement(): TScriptUnit[] {
  return STM_STACK[STM_STACK.length - 1];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_NextLine(): void {
  LINE_NUM++;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_NextPos(): void {
  LINE_POS++;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_TokenOut(tok: IToken): void {
  const { lineNum, linePos, level } = m_Info();
  const tokenKey = `${lineNum},${linePos}`;

  const tokInfo: VMToken = {
    scriptToken: tok,
    lineNum,
    level,
    linePos,
    tokenKey
  };
  LINE_BUF.push(tokInfo);
  m_NextPos();
  if (DBG) {
    if (LINE_POS === LINE_START_NUM)
      DBGTEXT += `${level} {${lineNum}:${linePos}} `;
    else DBGTEXT += `{${lineNum}:${linePos}} `;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_LineOut(): void {
  // don't export zero buffer lines which happens when m_StatementToLines
  // has no statement tokens

  // ALTERNATIVELY, we can assume it is a CLOSING ]] and render that instead
  // for consistent numbering between scriptText and scriptWizard views
  if (LINE_BUF.length === 0 && !COUNT_ALL_LINES) return;

  // otherwise do the thing
  const { level, lineNum } = m_Info();
  const lineStatement = LINE_BUF.map(t => {
    return t.scriptToken;
  });
  const vmTokens = [...LINE_BUF];
  const line: VMTokenLine = {
    lineStatement,
    vmTokens,
    level,
    lineNum
  };
  PAGE.push(line);
  LINE_BUF = [];
  LINE_POS = LINE_START_NUM;
  m_NextLine();
  if (DBG) DBGTEXT += '\n';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a page of lines of tokens, create the reverse lookup map */
function m_MapLinesToTokens(vmPage: VMTokenLine[]) {
  MAP.clear();
  vmPage.forEach(vmTokLine => {
    const { vmTokens } = vmTokLine;
    vmTokens.forEach(vmTok => {
      const { tokenKey, scriptToken } = vmTok;
      MAP.set(tokenKey, scriptToken);
    });
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_StatementToLines(statement: TScriptUnit): void {
  // process all the tokens in the statement
  if (statement.length === 0) {
    if (DBG) console.log('Empty Statement', statement);
    return;
  }
  m_PushStatement(statement); // set current statement context
  statement.forEach((tok: IToken) => {
    // (1) if it's a block token then nested print
    if (Array.isArray(tok.block)) {
      if (DBG) DBGTEXT += 'BLOCK ';
      m_LineOut();
      m_Indent();
      tok.block.forEach(bstm => m_StatementToLines(bstm));
      m_Outdent();
      return;
    }
    // (3) "print" the token to the line buffer
    m_TokenOut(tok);
  });
  m_PopStatement(); // remove current statement context
  // flush buffer after statement is printed, increment line
  m_LineOut();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Main Entry Point: Convert a tokenized script into a "page" of "lines" of
 *  tokens
 */
function m_ProgramToLines(program) {
  program.forEach(stm => m_StatementToLines(stm));
}

/// EXPORTED API METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a script of ScriptUnit statements, return a PAGE of VMTokenLine and
 *  VMToken
 */
export function ScriptToLines(
  program: TScriptUnit[]
): [VMTokenLine[], Map<string, IToken>] {
  m_Clear();
  m_ProgramToLines(program); // updates PAGE
  m_MapLinesToTokens(PAGE); // updates MAP
  if (DBG) console.log(DBGTEXT);
  return [PAGE, MAP];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this has to be taken into account by modules indexing into State()
 *  line and script maps (see ac-wizcore)
 */
export { LINE_START_NUM };
