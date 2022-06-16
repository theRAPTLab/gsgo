/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SCRIPT TO LINES

  Converts a program of scriptUnit statements into a line-based data structure
  suitable for rendering as an array of React elements. This is used by the
  GUI Wizard that Sri's been working on.

  The main API accepts a script

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  SHOW_EMPTY_STATEMENTS,
  SCRIPT_PAGE_INDEX_OFFSET
} from 'config/dev-settings';
import { StatementToText } from 'script/tools/script-tokenizer';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const WIP = true; // enable WIP changes
const WIPR = `WIP:${WIP}`;

/// LINE PRINTING MACHINE //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// A "token printer" that maintains a current line buffer. The line buffer is
/// pushed into a page buffer whenever a new line starts. This is used to
/// convert statements that contain nested statements in their line-by-line
/// equivalent
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ScriptLiner {
  LINE_BUF: VMToken[];
  PAGE: VMPage;
  TOKMAP: VMTokenMap;
  LSMAP: VMLineScripts;
  LINE_NUM: number;
  LINE_POS: number;
  INDENT: number;
  BLOCK_FLAG: VMLineScriptType;
  STM_STACK: TScriptUnit[];
  DBGTEXT: string;
  REFS: { bundles: TNameSet };
  constructor() {
    this.LINE_BUF = [];
    this.PAGE = [];
    this.TOKMAP = new Map<VMTokenKey, IToken>(); // reverse lookup from tokenIdstring to token
    this.LSMAP = [];
    this.LINE_NUM = SCRIPT_PAGE_INDEX_OFFSET;
    this.LINE_POS = SCRIPT_PAGE_INDEX_OFFSET;
    this.REFS = { bundles: new Set() };
    this.INDENT = 0;
    this.DBGTEXT = '';
    this.BLOCK_FLAG = null; // set to string, cleared immediately in lineOut
  }
  indent() {
    ++this.INDENT;
    if (!WIP) this.BLOCK_FLAG = 'start';
  }
  outdent() {
    --this.INDENT;
    if (!WIP) this.BLOCK_FLAG = 'end';
  }
  currentContext(): any {
    return {
      lineNum: this.LINE_NUM,
      linePos: this.LINE_POS,
      level: this.INDENT,
      globalRefs: this.REFS // set of globals to look-up (currently just blueprints)
    };
  }
  clearData() {
    this.LINE_BUF = [];
    this.LINE_POS = SCRIPT_PAGE_INDEX_OFFSET;
    this.LINE_NUM = SCRIPT_PAGE_INDEX_OFFSET;
    this.STM_STACK = [];
    this.PAGE = [];
    this.TOKMAP.clear();
    this.BLOCK_FLAG = null;
    this.LSMAP = [];
    this.DBGTEXT = '';
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** used to save the current statement array for the tokens being processed
   *  in it, so we can copy it into the PAGE array. Filters out blocks because
   *  are processed as different lines */
  pushStatementLine(stm: TScriptUnit): void {
    const copied_toks = stm.filter(tok => !tok.block);
    this.STM_STACK.push(copied_toks); // save statement on stack
    // console.log(this.STM_STACK.length, JSON.stringify(this.peekStatementLine()));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** remove the saved statement, without { block } tokens */
  popStatementLine(): TScriptUnit {
    return this.STM_STACK.pop(); // save statement on stack
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  peekStatementLine(): TScriptUnit {
    return this.STM_STACK[this.STM_STACK.length - 1];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  nextLine(): void {
    this.LINE_NUM++;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  nextPos(): void {
    this.LINE_POS++;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  tokenOut(tok: IToken): void {
    const { lineNum, linePos, level } = this.currentContext();
    const tokenKey: VMTokenKey = `${lineNum},${linePos}`;
    const tokInfo: VMToken = {
      scriptToken: tok,
      lineNum,
      linePos,
      tokenKey
    };
    this.LINE_BUF.push(tokInfo);
    this.nextPos();
    if (DBG) {
      if (this.LINE_POS === SCRIPT_PAGE_INDEX_OFFSET)
        this.DBGTEXT += `${level} {${lineNum}:${linePos}} `;
      else this.DBGTEXT += `{${lineNum}:${linePos}} `;
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  lineOut(): void {
    // Don't export zero buffer lines which happens when this.statementToLines
    // has no statement tokens...
    // ALTERNATIVELY, we can assume it is a CLOSING ]] and render that instead
    // for consistent numbering between scriptText and scriptWizard views
    if (this.LINE_BUF.length === 0 && !SHOW_EMPTY_STATEMENTS) return;
    // otherwise do the thing
    const { level, lineNum, globalRefs } = this.currentContext();
    const lineScript = this.peekStatementLine();
    const vmTokens = [...this.LINE_BUF];

    const line: VMPageLine = {
      lineScript,
      vmTokens, // a new array of vmToken refs
      globalRefs, // an object of referenced global
      level,
      lineNum
    };
    console.log(
      `${this.INDENT} %cwrote line`,
      'color:blue',
      StatementToText(lineScript)
    );

    // BLOCK_FLAG is set whenever a [[ or ]] is encountered
    // then cleared at the end of this
    if (this.BLOCK_FLAG) line.marker = this.BLOCK_FLAG;
    this.PAGE.push(line);

    // also update the VMLineScripts structure
    // this also makes use of BLOCK_FLAG
    const lso: VMLineScriptLine = { lineScript };
    if (this.BLOCK_FLAG) lso.marker = this.BLOCK_FLAG;
    this.LSMAP.push(lso);
    console.log(
      `${this.INDENT} %cwrote lso`,
      'color:magenta',
      StatementToText(lineScript)
    );
    this.BLOCK_FLAG = null; // always clear the flag

    // reset buffer and prepare for next line
    this.LINE_BUF = [];
    this.LINE_POS = SCRIPT_PAGE_INDEX_OFFSET;
    if (!WIP) this.nextLine();
    if (DBG) this.DBGTEXT += '\n';
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** given a page of lines of tokens, create the reverse lookup map */
  mapLinesToTokens(vmPage: VMPageLine[]) {
    this.TOKMAP.clear();
    vmPage.forEach(vmTokLine => {
      const { vmTokens } = vmTokLine;
      vmTokens.forEach(vmTok => {
        const { tokenKey, scriptToken } = vmTok;
        this.TOKMAP.set(tokenKey, scriptToken);
      });
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  statementToLines(statement: TScriptUnit): void {
    // process all the tokens in the statement
    if (statement.length === 0) {
      if (DBG) console.log('Empty Statement', statement);
      return;
    }
    this.pushStatementLine(statement); // set current statement context
    statement.forEach((tok: IToken) => {
      // (1) if it's a block token then nested print
      if (Array.isArray(tok.block)) {
        if (DBG) this.DBGTEXT += 'BLOCK ';
        if (WIP) this.BLOCK_FLAG = 'start';
        console.log(
          'LINEOUT %cBLOCK',
          'color:red',
          StatementToText(this.peekStatementLine())
        );
        this.lineOut(); // flush line before processing the block
        if (WIP) this.nextLine();
        // process statements in the block...
        this.indent();
        if (!WIP) {
          tok.block.forEach(bstm => this.statementToLines(bstm));
        } else {
          tok.block.forEach((bstm, index) => {
            const terminal = index === tok.block.length - 1;
            if (terminal) this.BLOCK_FLAG = 'end';
            this.statementToLines(bstm);
          });
        }
        this.outdent();
        // ...done!
        return;
      }
      // (3) "print" the token to the line buffer
      console.log('.. tokout', StatementToText([tok]), tok);
      this.tokenOut(tok);
    });
    console.log('LINEOUT', StatementToText(this.peekStatementLine()));
    this.lineOut(); // flush buffer after statement is printed, increment line
    if (WIP) this.nextLine();
    this.popStatementLine(); // remove current statement context
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Main Entry Point: Convert a tokenized script into a "page" of "lines" of
   *  tokens
   */
  programToLines(program) {
    program.forEach((stm, ii) => {
      console.group('line', ii, WIPR);
      this.statementToLines(stm);
      console.groupEnd();
    });
  }

  /// EXPORTED API METHODS //////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: given a script of ScriptUnit statements, return VMPageLine[] and
   *  a map of "line:pos" to its source scriptToken
   */
  scriptToLines(
    program: TScriptUnit[]
  ): [VMPageLine[], Map<string, IToken>, VMLineScripts] {
    this.clearData();
    this.programToLines(program); // updates this.PAGE
    this.mapLinesToTokens(this.PAGE); // updates this.TOKMAP
    if (DBG) console.log(this.DBGTEXT);
    return [this.PAGE, this.TOKMAP, this.LSMAP];
  }
} // end of ScriptLiner

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LINER = new ScriptLiner();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given a program, return a page of vmlines and line-to-token map,
 *  as well as a new line-to-linescript.
 */
function ScriptToLines(
  script: TScriptUnit[]
): [VMPageLine[], Map<string, IToken>, VMLineScripts] {
  const [script_page, key_to_token, line_to_scriptunit] =
    LINER.scriptToLines(script);
  return [script_page, key_to_token, line_to_scriptunit];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given a script of ScriptUnit statements, return an array of objects
 *  0-indexed by line. Editing the lineScript array inside  */
function ScriptToEditableTokens(script: TScriptUnit[]): VMLineScripts {
  const [, , line_to_scriptunit] = LINER.scriptToLines(script);
  return line_to_scriptunit;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given a script_page structure, return the editable line tokens */
function ScriptPageToEditableTokens(scriptPage: VMPageLine[]): VMLineScripts {
  const line_to_scriptunit = [];
  scriptPage.forEach(vmline => {
    const { lineScript, marker } = vmline;
    const lso: VMLineScriptLine = { lineScript };
    if (marker) lso.marker = marker;
    line_to_scriptunit.push(lso);
  });
  return line_to_scriptunit;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given an array of VMLineScripts, reconstruct the script and return it */
function EditableTokensToScript(lineScripts: VMLineScripts): TScriptUnit[] {
  const fn = 'EditableTokensToScript:';
  if (!Array.isArray(lineScripts)) throw Error(`${fn} arg should be array`);
  const script_tokens = [];
  const stack = [];
  let current = script_tokens;

  lineScripts.forEach(lso => {
    const { lineScript, marker } = lso;
    if (marker === 'start') {
      const arr = [];
      stack.push(arr);
      current = arr;
      current.push(lineScript);
      return;
    }
    if (marker === 'end') {
      current.push(lineScript);
      current = stack.pop();
      return;
    }
    current.push(lineScript);
  });
  return script_tokens;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function EditableTokensToScriptNew(lineScripts: VMLineScripts): TScriptUnit[] {
  const fn = 'EditableTokensToScript:';
  if (!Array.isArray(lineScripts)) throw Error(`${fn} arg should be array`);
  /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    example script to refer to in comments below:
    if {{ expr }} [[
      a b c
    ]] [[
      d e f
    ]]
  :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  let script_tokens = [];
  let stm = []; // current statement array
  let stm_stack = []; // previous statement array
  let level = 0;
  lineScripts.forEach(lso => {
    const {
      lineScript, // IToken except there are no block tokens
      marker // marks start, end, or end-start of a block or adjacent blocks
    } = lso;
    // we're going to start assembling the current statement
    // if this lso starts a block...
    // e.g { lineScript:[ {if},{expr} ], marker:'start' }
    if (marker === 'start') {
      level++;
      const block = [];
      stm.push(...lineScript);
      stm.push({ block });
      stm_stack.push(stm); // save current stm array
      stm = block;
      return;
    }
    // end of a block means we are done shoving stuff
    // into the current nested block, and we want to emit a
    // statement into script_tokens
    if (marker === 'end') {
      stm.push(...lineScript);
      if (--level === 0) script_tokens.push(...stm);
      stm = stm_stack.pop();
      return;
    }
    // hypothetical else support
    if (marker === 'end-start') {
      const block = [];
      stm = stm_stack.pop();
      stm.push({ block });
      stm = block;
      return;
    }
    stm.push(...lineScript);
    script_tokens.push(stm);
  });
  return script_tokens;
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ScriptLiner;
export {
  ScriptToLines, // script to indexed data structures for GUI
  ScriptPageToEditableTokens, // script_page to editable token list
  ScriptToEditableTokens, // script to editable token list
  EditableTokensToScript // pack editable token list back into script
};
