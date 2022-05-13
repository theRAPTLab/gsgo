/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SCRIPT TO LINES

  Converts a program of scriptUnit statements into a line-based data structure
  suitable for rendering as an array of React elements. This is used by the
  GUI Wizard that Sri's been working on.

  The main API accepts a script

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

// uses types defined in t-script.d and t-ui.d

/// CONSTANT & DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

// whether to count blank lines or not
const COUNT_ALL_LINES = true; // see WizardView RENDER_BLOCK_CLOSE
const LINE_START_NUM = 1; // set to 1 for no 0 indexes

/// LINE PRINTING MACHINE //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// A "token printer" that maintains a current line buffer. The line buffer is
/// pushed into a page buffer whenever a new line starts. This is used to
/// convert statements that contain nested statements in their line-by-line
/// equivalent
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ScriptLiner {
  LINE_BUF;
  PAGE;
  MAP;
  LINE_NUM;
  LINE_POS;
  INDENT;
  STM_STACK;
  DBGTEXT: string;
  REFS: { bundles: TNameSet };
  constructor() {
    this.LINE_BUF = [];
    this.PAGE = [];
    this.MAP = new Map<string, IToken>(); // reverse lookup from tokenIdstring to token
    this.LINE_NUM = LINE_START_NUM;
    this.LINE_POS = LINE_START_NUM;
    this.REFS = { bundles: new Set() };
    this.INDENT = 0;
    this.DBGTEXT = '';
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
    this.LINE_POS = LINE_START_NUM;
    this.LINE_NUM = LINE_START_NUM;
    this.STM_STACK = [];
    this.PAGE = [];
    this.MAP.clear();
    this.DBGTEXT = '';
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** used to save the current statement for the token, though this information
   *  can also be pulled from the this.PAGE data structure by lineNum
   */
  pushStatement(stm: TScriptUnit): void {
    this.STM_STACK.push(stm); // save statement on stack
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  popStatement(): TScriptUnit[] {
    return this.STM_STACK.pop(); // save statement on stack
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  peekStatement(): TScriptUnit[] {
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
    const tokenKey = `${lineNum},${linePos}`;

    const tokInfo: VMToken = {
      scriptToken: tok,
      lineNum,
      linePos,
      tokenKey
    };
    this.LINE_BUF.push(tokInfo);
    this.nextPos();
    if (DBG) {
      if (this.LINE_POS === LINE_START_NUM)
        this.DBGTEXT += `${level} {${lineNum}:${linePos}} `;
      else this.DBGTEXT += `{${lineNum}:${linePos}} `;
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  lineOut(): void {
    // don't export zero buffer lines which happens when this.statementToLines
    // has no statement tokens

    // ALTERNATIVELY, we can assume it is a CLOSING ]] and render that instead
    // for consistent numbering between scriptText and scriptWizard views
    if (this.LINE_BUF.length === 0 && !COUNT_ALL_LINES) return;

    // otherwise do the thing
    const { level, lineNum, globalRefs } = this.currentContext();
    const lineScript = this.LINE_BUF.map(t => {
      return t.scriptToken;
    });
    const vmTokens = [...this.LINE_BUF];
    const line: VMPageLine = {
      lineScript,
      vmTokens, // a new array of vmToken refs
      globalRefs, // an object of referenced global
      level,
      lineNum
    };
    this.PAGE.push(line);
    this.LINE_BUF = [];
    this.LINE_POS = LINE_START_NUM;
    this.nextLine();
    if (DBG) this.DBGTEXT += '\n';
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** given a page of lines of tokens, create the reverse lookup map */
  mapLinesToTokens(vmPage: VMPageLine[]) {
    this.MAP.clear();
    vmPage.forEach(vmTokLine => {
      const { vmTokens } = vmTokLine;
      vmTokens.forEach(vmTok => {
        const { tokenKey, scriptToken } = vmTok;
        this.MAP.set(tokenKey, scriptToken);
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
    this.pushStatement(statement); // set current statement context
    statement.forEach((tok: IToken) => {
      // (1) if it's a block token then nested print
      if (Array.isArray(tok.block)) {
        if (DBG) this.DBGTEXT += 'BLOCK ';
        this.lineOut();
        this.indent();
        tok.block.forEach(bstm => this.statementToLines(bstm));
        this.outdent();
        return;
      }
      // (3) "print" the token to the line buffer
      this.tokenOut(tok);
    });
    this.popStatement(); // remove current statement context
    // flush buffer after statement is printed, increment line
    this.lineOut();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Main Entry Point: Convert a tokenized script into a "page" of "lines" of
   *  tokens
   */
  programToLines(program) {
    program.forEach(stm => this.statementToLines(stm));
  }

  /// EXPORTED API METHODS //////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: given a script of ScriptUnit statements, return VMPageLine[] and
   *  a map of "line:pos" to its source scriptToken
   */
  scriptToLines(program: TScriptUnit[]): [VMPageLine[], Map<string, IToken>] {
    this.clearData();
    this.programToLines(program); // updates this.PAGE
    this.mapLinesToTokens(this.PAGE); // updates this.MAP
    if (DBG) console.log(this.DBGTEXT);
    return [this.PAGE, this.MAP];
  }
} // end of ScriptLiner

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LINER = new ScriptLiner();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given a program, return a page of vmlines and line-to-token map */
function ScriptToLines(program: TScriptUnit[]) {
  const [script_page, line_tokmap] = LINER.scriptToLines(program);
  return [script_page, line_tokmap];
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ScriptLiner;
export { LINE_START_NUM, ScriptToLines };
