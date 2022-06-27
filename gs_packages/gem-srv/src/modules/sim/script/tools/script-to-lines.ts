/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SCRIPT TO LINES

  Converts a program of scriptUnit statements into a line-based data structure
  suitable for rendering as an array of React elements. This is used by the
  GUI Wizard that Sri's been working on.

  The main API accepts a script

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys';
import {
  SHOW_EMPTY_STATEMENTS,
  SCRIPT_PAGE_INDEX_OFFSET
} from 'config/dev-settings';
import { StatementToText } from 'script/tools/script-tokenizer';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const EMPTY_STATEMENT: TScriptUnit = [];
const PR = UR.PrefixUtil('TMP_TOKS', 'TagRed');

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
  TMP_TOKS: TScriptUnit[];
  DBGTEXT: string;
  REFS: { bundles: TNameSet };
  //

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
  }
  outdent() {
    --this.INDENT;
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
    this.TMP_TOKS = [];
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
  pushTokens(stm: TScriptUnit): void {
    const copied_toks: IToken[] = stm.filter(tok => !tok.block);
    this.TMP_TOKS.push(copied_toks); // save statement on stack
    // console.log(this.TMP_TOKS.length, JSON.stringify(this.peekTokens ()));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** remove the saved statement, without { block } tokens */
  popTokens(): TScriptUnit {
    return this.TMP_TOKS.pop();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  peekTokens(): TScriptUnit {
    return this.TMP_TOKS[this.TMP_TOKS.length - 1];
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
    const lineScript = this.popTokens() || EMPTY_STATEMENT;
    const vmTokens = [...this.LINE_BUF];

    const line: VMPageLine = {
      lineScript,
      vmTokens, // a new array of vmToken refs
      globalRefs, // an object of referenced global
      level,
      lineNum
    };
    if (DBG)
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
    if (DBG)
      console.log(
        `${this.INDENT} %cwrote lso`,
        'color:magenta',
        StatementToText(lineScript)
      );
    this.BLOCK_FLAG = null; // always clear the flag

    // reset buffer and prepare for next line
    this.LINE_BUF = [];
    this.LINE_POS = SCRIPT_PAGE_INDEX_OFFSET;
    this.nextLine();
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
  /** reference algorithm used by statementToLines */
  genericStatementDeblocker(stm: TScriptUnit): void {
    if (stm.length === 0) return;
    this.pushTokens(stm); // set current statement context
    stm.forEach((tok: IToken, idx) => {
      const isBlock = Array.isArray(tok.block);
      if (isBlock) {
        this.lineOut(); // uses popTokens() to retrieve lineScript
        tok.block.forEach(bstm => {
          this.genericStatementDeblocker(bstm);
        });
      } else {
        this.tokenOut(tok);
      }
    });
    this.lineOut(); // uses popTokens() flush all the tokenOut acquired
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** reference algorithm used by EditableTokensToLines, which is the
   *  opposite of the statement deblocker */
  genericBlockStatementer(lineScripts: VMLineScripts): TScriptUnit[] {
    let script_tokens = [];
    let stm0 = []; // assemble partial statements on main level
    let block_stack = [];
    let current = script_tokens; // where to output statements
    // START CODE
    let level = 0;
    lineScripts.forEach(lso => {
      const { lineScript, marker } = lso;
      if (marker === 'start') {
        level++;
        if (level === 1) {
          const block = []; // new block [[ ],[ ]]
          stm0 = [...lineScript, { block }];
          current.push(stm0);
          current = block;
        }
        if (level > 1) {
          const block = []; // new block [[ ],[ ]]
          current.push([...lineScript, { block }]);
          block_stack.push(current); // save previous
          current = block;
        }
        return;
      }

      if (marker === 'end') {
        level--;
        if (level < 0) console.warn('WHOOPS');
        if (level > 0) {
          if (lineScript.length) current.push(lineScript); // nested block
          current = block_stack.pop(); // previos block
        }
        if (level === 0) {
          if (lineScript.length) current.push(lineScript); // nested block
          current = script_tokens; // main body
          stm0 = [];
        }
        return;
      }

      if (marker === 'end-start') {
        level--;
        if (level > 0) {
          if (lineScript.length) current.push(lineScript); // nested block
          current = block_stack.pop(); // previos block
        }
        if (level === 0) {
          if (lineScript.length) current.push(lineScript); // nested block
          current = script_tokens; // main body
          // stm0 = []; // don't reset the statement
        }
        level++;
        const block = []; // new block [[ ],[ ]]
        stm0.push({ block });
        if (level === 1) current = block;
        if (level > 1) {
          block_stack.push(current); // save previous
          current = block;
        }
        return;
      }
      if (lineScript.length) current.push(lineScript);
    });
    return script_tokens;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  statementToLines(statement: TScriptUnit): void {
    // process all the tokens in the statement
    if (statement.length === 0) {
      if (DBG) console.log('Empty Statement', statement);
      return;
    }
    this.pushTokens(statement); // set current statement context
    statement.forEach((tok: IToken, sindex: number) => {
      // regular token: add to statement
      if (!Array.isArray(tok.block)) {
        this.tokenOut(tok);
        if (DBG) console.log('.. tokout', StatementToText([tok]), tok);
        return;
      }
      // block token: detect blockstart/end conditions and process recursively
      if (DBG) this.DBGTEXT += 'BLOCK ';
      if (DBG) {
        const bflag = this.BLOCK_FLAG
          ? `!!!!!!!! ${this.BLOCK_FLAG.toUpperCase()}`
          : '';
        console.log(
          'LINEOUT %cBLOCK',
          'color:red',
          StatementToText(this.peekTokens()),
          bflag
        );
      }
      // process statements in the block...
      const precedingBlock =
        sindex - 1 >= 0 ? statement[sindex - 1].block : undefined;
      if (!precedingBlock) this.BLOCK_FLAG = `start`;
      this.lineOut(); // flush line before processing the block
      tok.block.forEach((bstm, index) => {
        if (DBG) console.group(`block level ${this.INDENT}`);
        const terminal = index === tok.block.length - 1;
        const followedByBlock =
          sindex + 1 < statement.length ? statement[sindex + 1].block : undefined;
        if (terminal) this.BLOCK_FLAG = followedByBlock ? `end-start` : `end`;
        // block flag will affect recursive statement lineout
        this.indent();
        this.statementToLines(bstm);
        this.outdent();
        console.groupEnd();
      });
    });
    // finished statement processing, so now output the line
    this.lineOut(); // flush buffer after statement is printed, increment line
    if (DBG) {
      const bflag = this.BLOCK_FLAG
        ? `!!!!!!!! ${this.BLOCK_FLAG.toUpperCase()}`
        : '';
      console.log('LINEOUT', StatementToText(this.peekTokens()), bflag);
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Main Entry Point: Convert a tokenized script into a "page" of "lines" of
   *  tokens
   */
  programToLines(program: TScriptUnit[]) {
    program.forEach((stm, ii) => {
      if (DBG) console.group('line', ii);
      this.statementToLines(stm);
      if (DBG) console.groupEnd();
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
/** API: replacement version of EditableTokensToScript repacker with improved
 *  instrumentation */
function EditableTokensToScript(lineScripts: VMLineScripts): TScriptUnit[] {
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
  let stm0 = []; // assemble partial statements on main level
  let block_stack = [];
  let current = script_tokens; // where to output statements

  const js = JSON.stringify;

  function dump(script: TScriptUnit[], opt = { ignoreMatch: false }) {
    if (!opt.ignoreMatch && script === script_tokens) return ` = script_tokens`;
    if (script.length === 0) return ' = new []';
    let out: string = ' =\n';
    script.forEach((s, ii) => {
      out += `${String(ii).padStart(2, ' ')} ${js(s)}`;
      if (ii < script.length - 1) out += '\n';
    });
    return out;
  }
  function dump_status(lineScript) {
    console.log(`lineScript: ${js(lineScript)}`);
    console.log(`%ccurrent${dump(current)}`, 'color:rgb(0,0,255)');
    console.log(
      `%cscript_tokens${dump(script_tokens, { ignoreMatch: true })}`,
      'color:rgba(0,0,255,0.25)'
    );
    let stmout = js(stm0);
    let css = 'color:rgba(255,80,0,1)';
    if (stmout === '[]') css = 'color:rgba(255,128,0,0.5)';
    console.log(`%cstm0 = ${stmout}`, css);
  }

  // START CODE

  let level = 0;
  lineScripts.forEach(lso => {
    const {
      lineScript, // IToken except there are no block tokens
      marker // marks start, end, or end-start of a block or adjacent blocks
    } = lso;

    if (marker === 'start') {
      level++;
      if (level === 1) {
        const block = []; // new block [[ ],[ ]]
        stm0 = [...lineScript, { block }];
        current.push(stm0);
        current = block;
      }
      if (level > 1) {
        const block = []; // new block [[ ],[ ]]
        current.push([...lineScript, { block }]);
        block_stack.push(current); // save previous
        current = block;
      }
      if (DBG) {
        console.group(
          `%clineScript START BLOCK level=${level}`,
          'background-color:yellow'
        );
        dump_status(lineScript);
        console.groupEnd();
      }
      return;
    }

    if (marker === 'end') {
      if (DBG)
        console.group(
          `%clineScript END BLOCK level=${level}->${level - 1}`,
          'background-color:yellow'
        );
      level--;
      if (level < 0) console.warn('WHOOPS');
      if (level > 0) {
        if (lineScript.length) current.push(lineScript); // nested block
        current = block_stack.pop(); // previos block
      }
      if (level === 0) {
        if (lineScript.length) current.push(lineScript); // nested block
        current = script_tokens; // main body
        stm0 = [];
      }
      if (DBG) dump_status(lineScript);
      if (DBG) console.groupEnd();
      return;
    }

    if (marker === 'end-start') {
      if (DBG)
        console.group(
          `%clineScript END/START BLOCKS level=${level}`,
          'color:gray;background-color:yellow'
        );
      level--;
      if (level > 0) {
        if (lineScript.length) current.push(lineScript); // nested block
        current = block_stack.pop(); // previos block
      }
      if (level === 0) {
        if (lineScript.length) current.push(lineScript); // nested block
        current = script_tokens; // main body
        // stm0 = []; // don't reset the statement
      }
      level++;
      const block = []; // new block [[ ],[ ]]
      stm0.push({ block });
      if (level === 1) current = block;
      if (level > 1) {
        block_stack.push(current); // save previous
        current = block;
      }
      if (DBG) dump_status(lineScript);
      if (DBG) console.groupEnd();
      return;
    }

    if (lineScript.length) current.push(lineScript);
    if (DBG) {
      console.group(`lineScript level=${level}`);
      dump_status(lineScript);
      console.groupEnd();
    }
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
