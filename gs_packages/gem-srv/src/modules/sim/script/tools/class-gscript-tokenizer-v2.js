/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The ScriptTokenizer class takes a text input, breaks it into lines, and
  processes each line character by character.

  The main entry point is tokenize(text), and resulting output is an array of
  TScriptUnit (array of token objects):

    program:TScript = [[ {token}, {token}, ... ],    // TScriptUnit [ {token},
      {token}, ... ],    // TScriptUnit
      ...
    ]

  This code is a refactored version of jsep, modified to process the GEM-SCRIPT
  ScriptText format of [keyword, ...args]. The original is a stand-alone module
  written in ES5; this was converted it into a class and modified it to add
  GEMSCRIPT script conventions:

  * process an entire block of text, not just a single line
  * produce {comment} tokens from leading //
  * produce {directive} tokens (like a pragma)
  * process blocks with [[ ]] wrappers into {block} token
  * process program names in an inline use of [[ ]] into {program} token
  * process dotted identifiers (foo.bar.bar) into {objref} token
  * process inline expressions between {{ }} wrappers into {expr} token
  * add showCursor() that will highlight the current position of the character
    index for debugging
  * added tokenizer error display in console

  The additions we've made to JSEP are marked with  ** GEMSCRIPT HACK **

  LICENSES

    JSEP project, under MIT License. Copyright (c) 2013 Stephen Oney,
    http://jsep.from.so/ see: https://ericsmekens.github.io/jsep/

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { createImportSpecifier } from 'typescript';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const string = 'class-script-tokenizer-v2';
const charAtFunc = string.charAt;
const charCodeAtFunc = string.charCodeAt;
const t = true;
let DBG = false;
const DBG_MB = false;

/// CHAR CODES ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PERIOD_CODE = 46; // '.'
const BSLASH_CODE = 47; // slash /
// const COMMA_CODE = 44; // ','
const SQUOTE_CODE = 39; // single quote
const DQUOTE_CODE = 34; // double quotes
const OPAREN_CODE = 40; // (
const CPAREN_CODE = 41; // )
const OBRACK_CODE = 91; // [
const CBRACK_CODE = 93; // ]
const OCURLY_CODE = 123; // {
const CCURLY_CODE = 125; // }
const DIRECTIVE = '#';
const unary_ops = { '-': t, '!': t, '~': t, '+': t };
const binary_ops = {
  '||': 1,
  '&&': 2,
  '|': 3,
  '^': 4,
  '&': 5,
  '==': 6,
  '!=': 6,
  '===': 6,
  '!==': 6,
  '<': 7,
  '>': 7,
  '<=': 7,
  '>=': 7,
  '<<': 8,
  '>>': 8,
  '>>>': 8,
  '+': 9,
  '-': 9,
  '*': 10,
  '/': 10,
  '%': 10
};

// convert word-based literals to value literals
const literalRemapper = {
  'true': { value: true },
  'false': { value: false },
  'null': { value: null }
};

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Get return the longest key length of any object
const getMaxKeyLen = obj => {
  let max_len = 0;
  let len;
  Object.keys(obj).forEach(key => {
    len = key.length;
    if (len > max_len) max_len = len;
  });
  return max_len;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const max_unop_len = getMaxKeyLen(unary_ops);

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// `ch` is a character code in the next three functions
const isDecimalDigit = ch => {
  return ch >= 48 && ch <= 57; // 0...9
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const isIdentifierStart = ch => {
  return (
    ch === 36 ||
    ch === 95 || // `$` and `_`
    (ch >= 65 && ch <= 90) || // A...Z
    (ch >= 97 && ch <= 122) || // a...z
    (ch >= 128 && !binary_ops[String.fromCharCode(ch)])
  ); // any non-ASCII that is not an operator
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const isIdentifierPart = ch => {
  return (
    ch === 36 ||
    ch === 95 || // `$` and `_`
    (ch >= 65 && ch <= 90) || // A...Z
    (ch >= 97 && ch <= 122) || // a...z
    (ch >= 48 && ch <= 57) || // 0...9
    (ch >= 128 && !binary_ops[String.fromCharCode(ch)])
  ); // any non-ASCII that is not an operator
};

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ScriptTokenizer {
  //
  constructor(doFlags) {
    if (doFlags)
      console.log('ScriptTokenizer initialized with showCursor tracing');
    doFlags = doFlags || {
      show: DBG // show progress
    };
    this.do = doFlags;
    this.linesIndex = 0; // line index
    this.line = '';
    this.index = 0; // char index
    this.lastIndex = this.index;
    this.length = 0; // line length
    // debug
    this.blockDepth = 0;
  }

  /** SRI NOTE: return literal character string */
  exprI(i) {
    return charAtFunc.call(this.line, i);
  }

  /** SRI NOTE: return numeric character code */
  exprICode(i) {
    return charCodeAtFunc.call(this.line, i);
  }

  /** GEMSCRIPT HACK ** Utility to highlight the current position of the
   *  character gobbler for the current line. Insert this call whenever you are
   *  trying to see where the tokenizer is. On Chrome console.warn will also
   *  give you a stack trace so you can see how deeply nested you are into the
   *  gobbler
   */
  showCursor(prompt) {
    const lnum = `${this.linesIndex}`.padStart(3, '0');
    const s1 = `${lnum}: ${this.line.substring(0, this.index)}`;
    const s2 = this.line[this.index] || 'EOL';
    const s3 = this.line.substring(this.index + 1) || '';
    const pr = prompt === undefined ? '' : `${prompt}`;
    console.log(
      `%c${s1}%c${s2}%c${s3}%c${pr}`,
      'color:black;background-color:#FFF0D0;padding:2px 4px',
      'background-color:#FFB000',
      'color:#C0C0C0;background-color:#FFF0D0;padding:2px 0 2px 0',
      'color:white;background-color:#FF0000;padding:2px 0 2px 0'
    );
  }

  /** GEMSCRIPT HACK ** Modified to also show the current character position
   *  with +/- 5 surrounding lines for context. Used to show where a parse error
   *  has occurred.
   */
  throwError(err) {
    let range = 1; // number of lines to print before/after error
    let start = Math.max(this.linesIndex - range - 1, 0);
    for (let ii = start; ii < this.linesIndex - 1; ii++) {
      const lnum = `${ii + 1}`.padStart(3, '0');
      console.log(
        `%c${lnum}: %c${this.lines[ii]}`,
        'background-color:#FFF0D0;padding:2px 4px',
        'color:#C0C0C0;background-color:#FFF0D0'
      );
    }
    this.showCursor('TOKEN ERROR');
    start = Math.min(this.linesIndex + 1, this.linesIndex);
    let end = Math.min(this.linesIndex + range, this.linesCount);
    for (let ii = start; ii < end; ii++) {
      const lnum = `${ii + 1}`.padStart(3, '0');
      console.log(
        `%c${lnum}: %c${this.lines[ii]}`,
        'background-color:#FFF0D0;padding:2px 4px',
        'color:#C0C0C0;background-color:#FFF0D0'
      );
    }
    throw Error(`${err} @${this.linesIndex}:${this.index}`);
  }

  /** GEMSCRIPT HACK ** jsep is an expression parser that works on lines.
   *  We've extended it to also load line-after-line to process full texts
   */
  loadLine() {
    this.index = 0;
    if (this.linesIndex < this.linesCount) {
      this.line = this.lines[this.linesIndex].trim();
      this.linesIndex++;
      this.length = this.line.length;
      if (DBG_MB) console.log('load', this.line);
      return;
    }
    // end of lines
    this.line = '';
    this.length = 0;
  }

  /// MAIN INSTANCE ENTRY POINT /////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** GEMSCRIPT HACK ** this is significantly modified from jsep to do line-by-
   *  line parsing.
   */
  tokenize(src, flag) {
    if (typeof src === 'string') src = src.split('\n');
    if (!Array.isArray(src)) {
      const err =
        'tokenize() receives either a linefeed-delimited text or an ARRAY of string';
      console.warn(err);
      throw Error(err);
    }
    this.lines = src; // an array of strings
    this.linesCount = this.lines.length;
    this.linesIndex = 0;
    this.line = '';
    this.index = 0;
    this.length = this.line.length;
    DBG = DBG || flag === 'show'; // override DBG status if pass 'show'
    this.blockDepth = 0;

    let units = [];
    // parse line-by-line, pushing token arrays
    while (this.linesIndex < this.linesCount) {
      const nodes = this.gobbleLine();
      if (nodes.length > 0) units.push(nodes);
      else units.push([{ line: '' }]);
    } // end while lines<lines.length

    // return a Script array of ScriptUnit arrays
    if (this.blockDepth > 0)
      this.throwError(`EOF without ${this.blockDepth} unclosed blocks`);
    return units;
  }

  /// TOKEN METHODS /////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** GEMSCRIPT HACK ** Added this to handle line-by-line parsing */
  gobbleLine() {
    let nodes = [];
    let node;

    this.loadLine();
    /* special cases for gemscript */
    if (this.line.substring(0, 1) === DIRECTIVE) return this.gobbleDirective();

    while (this.index < this.length) {
      this.gobbleSpaces();
      node = this.gobbleToken();
      nodes.push(node);
    }
    // HACK: Ben added 'blank line' support so the number of returned script units
    // in the array matches the number of lines in the text, which simplifies
    // his UI work with the JSX renderer. The `loadLine()` method is also
    // modified to not skip blank text lines.
    if (nodes.length === 0) return [{ line: '' }];
    return nodes;
  }

  // SRI NOTE: used to skip whitespace characters, setting the line cursor
  // point to the first non-whitespace character to parse
  gobbleSpaces() {
    let ch = this.exprICode(this.index);
    // space or tab
    while (ch === 32 || ch === 9 || ch === 10 || ch === 13) {
      ch = this.exprICode(++this.index);
    }
  }

  /** GEMSCRIPT HACK ** Return the next token. This is a modification of jsep's
   *  gobbleExpression() main entry point to intercept our GEMSCRIPT additions
   *  before jsep's own tokenizers attempt to scan them.
   */
  gobbleToken() {
    this.gobbleSpaces();
    if (DBG) this.showCursor();
    let ch = this.exprICode(this.index);
    let chn = this.exprICode(this.index + 1);
    let to_check;
    let tc_len;
    /** GEMSCRIPT HACK ** look for blocks [[ ]] */
    if (ch === OBRACK_CODE && chn === OBRACK_CODE) {
      this.index++;
      return this.gobbleBlock(); // in gobbleParts() also
    }
    /** GEMSCRIPT HACK ** look for expressions {{ expr }} */
    if (ch === OCURLY_CODE && chn === OCURLY_CODE) {
      this.index++;
      return this.gobbleExpressionString();
    }
    /** GEMSCRIPT HACK ** look for comment lines // */
    if (ch === BSLASH_CODE && chn === BSLASH_CODE) {
      this.index += 2;
      return this.gobbleComment();
    }

    if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
      // Char code 46 is a dot `.` which can start off a numeric literal
      return this.gobbleNumericLiteral();
    }
    if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
      // Single or double quotes
      return this.gobbleStringLiteral();
    }

    // SRI NOTE: if we've gotten this far, the possibilities remaining are
    // identifier or a unary operation. Works with gobbleParts() to check
    // for function invocations and dotted object references
    to_check = this.line.substr(this.index, max_unop_len);
    tc_len = to_check.length;
    while (tc_len > 0) {
      // SRI NOTE: Don't accept an unary op when it precedes an identifier.
      if (
        Object.prototype.hasOwnProperty.call(unary_ops, to_check) &&
        (!isIdentifierStart(this.exprICode(this.index)) ||
          (this.index + to_check.length < this.line.length &&
            !isIdentifierPart(this.exprICode(this.index + to_check.length))))
      ) {
        this.index += tc_len;
        let arg = this.gobbleToken(); // produces object
        // { '-': t, '!': t, '~': t, '+': t };
        // skip + for unary operator
        if (to_check === '-') arg.value = -arg.value;
        else if (to_check === '!') arg.value = !arg.value;
        else if (to_check === '~') arg.value = ~arg.value;
        return arg; // return arg;
      }
      to_check = to_check.substr(0, --tc_len);
    }
    return this.gobbleParts();
  }

  // SRI NOTE: Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by
  // using a string to keep track of everything in the numeric literal and then
  // calling `parseFloat` on that string
  gobbleNumericLiteral() {
    let number = '';
    let ch;
    let chCode;
    while (isDecimalDigit(this.exprICode(this.index))) {
      number += this.exprI(this.index++);
    }
    if (this.exprICode(this.index) === PERIOD_CODE) {
      // can start with a decimal marker
      number += this.exprI(this.index++);

      while (isDecimalDigit(this.exprICode(this.index))) {
        if (DBG) this.showCursor();
        number += this.exprI(this.index++);
      }
    }
    ch = this.exprI(this.index);
    if (ch === 'e' || ch === 'E') {
      // exponent marker
      number += this.exprI(this.index++);
      ch = this.exprI(this.index);
      if (ch === '+' || ch === '-') {
        // exponent sign
        number += this.exprI(this.index++);
      }
      while (isDecimalDigit(this.exprICode(this.index))) {
        //exponent itself
        number += this.exprI(this.index++);
      }
      if (!isDecimalDigit(this.exprICode(this.index - 1))) {
        this.throwError(
          `GobbleNumericLiteral: Expected exponent (${
            number + this.exprI(this.index)
          })`
        );
      }
    }
    chCode = this.exprICode(this.index);
    // Check to make sure this isn't a variable name that start with a number (123abc)
    if (isIdentifierStart(chCode)) {
      this.throwError(
        `GobbleNumericLiteral: Variable names cannot start with a number (${
          number + this.exprI(this.index)
        })`
      );
    } else if (chCode === PERIOD_CODE) {
      this.throwError(`GobbleNumericLiteral: Unexpected period`);
    }
    return { value: parseFloat(number) }; // was: return parseFloat(number);
  }

  // SRI NOTE: Parses a string literal, staring with single or double quotes
  // with basic support for escape codes e.g. `"hello world"`, `'this is\nJSEP'`
  gobbleStringLiteral() {
    let str = '';
    let quote = this.exprI(this.index++);
    let closed = false;
    let ch;

    while (this.index < this.length) {
      ch = this.exprI(this.index++);
      if (ch === quote) {
        closed = true;
        break;
      } else if (ch === '\\') {
        // Check for all of the common escape codes
        ch = this.exprI(this.index++);
        switch (ch) {
          case 'n':
            str += '\n';
            break;
          case 'r':
            str += '\r';
            break;
          case 't':
            str += '\t';
            break;
          case 'b':
            str += '\b';
            break;
          case 'f':
            str += '\f';
            break;
          case 'v':
            str += '\x0B';
            break;
          default:
            str += ch;
        }
      } else {
        str += ch;
      }
    }
    if (!closed)
      this.throwError(`GobbleStringLiteral: Unclosed quote after "${str}"`);
    return { string: str }; // was: return str;
  }

  // SRI NOTE: Gobbles only identifiers
  // e.g.: `foo`, `value`, `$x1`
  // Also, this function checks if that identifier is a literal:
  // (e.g. `true`, `false`, `null`) or `this`
  gobbleIdentifier() {
    let ch = this.exprICode(this.index);
    let start = this.index;
    let identifier;

    if (isIdentifierStart(ch)) {
      this.index++;
    } else {
      this.throwError(`GobbleIdentifier: Unexpected ${this.exprI(this.index)}`);
    }
    while (this.index < this.length) {
      ch = this.exprICode(this.index);
      if (isIdentifierPart(ch)) {
        this.index++;
      } else {
        break;
      }
    }
    identifier = this.line.slice(start, this.index);

    if (Object.prototype.hasOwnProperty.call(literalRemapper, identifier)) {
      return literalRemapper[identifier];
    }
    return { identifier }; // was: return identifier;
  }

  // SRI NOTE: When an identifier ends with a non-identifier character, check for
  // the case it's a dotted object ref, an array expression, or a function invocation.
  gobbleParts() {
    let ch_i;
    let node = []; // let node;
    ch_i = this.exprICode(this.index);
    if (ch_i === OPAREN_CODE) {
      // is group ( expression )?
      node.push(this.gobbleGroup()); // node = this.gobbleGroup();
    } else {
      node.push(this.gobbleIdentifier()); // node = this.gobbleIdentifier(); // otherwise it's an identifier
    }
    // note: check for subsequent identifier variations
    // note: identifier check for dot property, array
    this.gobbleSpaces();
    ch_i = this.exprICode(this.index);
    // allow dotted variables. removed checks for OPAREN_CODE and OBRACK_CODE
    while (ch_i === PERIOD_CODE) {
      this.index++;
      if (DBG) this.showCursor();
      // handle conversion of initial identifier object into string
      node[0] = node[0].identifier ? node[0].identifier : node[0];
      if (ch_i === PERIOD_CODE) {
        // dot propertties
        // node += '.';
        const part = this.gobbleIdentifier();
        node.push(part.identifier); // node += this.gobbleIdentifier();
      }
      this.gobbleSpaces();
      ch_i = this.exprICode(this.index);
    }
    /** GEMSCRIPT HACK ** In GEMSCRIPT an "objref" is something like 'foo.bar',
     *  and we want to return the parts so keyword compilers can invoke those
     *  objects at runtime. This requires a new token { objref } which is an
     *  array of { string } tokens that are converted into a plain array of
     *  strings. E.g. foo.bar. is parsed into { objref: [ {string:'foo'},
     *  {string:'bar'}]. At compile time this is converted to an argument {
     *  objref: ['foo','bar'])
     */
    if (node.length === 1) return node[0];
    return { objref: node }; // was: return node;
  }

  // SRI NOTE: Responsible for parsing a group of things within parentheses `()`
  // This function assumes that it needs to gobble the opening parenthesis and
  // then tries to gobble everything within that parenthesis, assuming that the
  // next thing it should see is the close parenthesis. If not, then the
  // expression probably doesn't have a `)`
  gobbleGroup() {
    this.index++;
    let node = this.gobbleToken();
    this.gobbleSpaces();
    if (this.exprICode(this.index) === CPAREN_CODE) {
      this.index++;
      return node;
    }
    return this.throwError(`GobbleGroup: Unclosed (`);
  }

  /** GEMSCRIPT HACK ** In GEMSCRIPT, a {{ }} designates an expression, and the
   *  contents will be captured as a string. At compile time, the string is
   *  parsed through jsep to create the parse tree that is stored in code
   *  so it can be evaluated at runtime
   */
  gobbleExpressionString() {
    let ch;
    let cch;
    let str = '';
    this.index++;
    while (this.index < this.length) {
      ch = this.exprICode(this.index++);
      cch = this.exprICode(this.index);
      if (ch === CCURLY_CODE && cch === CCURLY_CODE) {
        this.index += 2;
        this.gobbleSpaces();
        return { expr: str.trim() }; // was: return `{{${str}}}`;
      }
      str += String.fromCharCode(ch);
    }
    return this.throwError(
      `GobbleExpressionString: Unclosed inline {{ for ${str}`
    );
  }

  /** GEMSCRIPT HACK ** In GEMSCRIPT text, a [[ ]] on a single line designates a
   *  'named TMethod' which is invoked like a co-routine. The name is used to
   *  look-up a TMethod (either an SMC program or regular Javascript function)
   *  from a Map<string,TMethod>. It is up to the keyword implementor that is
   *  using inline blocks to know which dictionary to grab the method (e.g.
   *  the TESTS dictionary or PROGRAMS dictionary)
   */
  gobbleBlock() {
    let ch;
    let cch;
    let str = ''; // this
    let level = 1;
    // when called by gobbleParts or gobbleToken, already pointing at the
    // second [ of [[ so increment to point to next char
    this.index++;

    // start reading inside [[
    while (this.index < this.length) {
      ch = this.exprICode(this.index++);
      cch = this.exprICode(this.index);
      // check for closing bracket ]] level 0
      if (ch === CBRACK_CODE && cch === CBRACK_CODE) {
        this.index++; // point to char after ]]
        level--;
        if (level === 0) return { program: str.trim() }; // return token
        str += ']]'; // otherwise, save the string
      } else if (ch === OBRACK_CODE && cch === OBRACK_CODE) {
        this.index++; // point to char after [[
        level++;
        // next pass will add character
      } else {
        str += String.fromCharCode(ch);
      }
    }
    // if got this far, the form [[ program ]] was not found, and we
    // have an unclosed block [[ delimiter, so we need to parse the
    // subsequent lines for a { block: line[] } until the end of block
    return this.gobbleMultiBlock();
  }

  /** GEMSCRIPT HACK ** A multiblock spans several lines, but is part of
   *  a single statement. Usually each line compiles into a single statement
   *  of type TScriptUnit, but in the case of a multiblock we have to
   *  recursively tokenize its content into a single { block: } token
   */
  gobbleMultiBlock() {
    // we are here because of an unbalanced [[ so we must scan for closing ]]
    this.blockDepth++; // debug nesting levels

    let unit = []; // an array of nodes
    const statements = []; // an array of arrays of nodes
    // PROCESS LINE by LINE
    while (this.linesIndex < this.linesCount) {
      this.loadLine();
      if (this.line.substring(0, 1) === DIRECTIVE) return this.gobbleDirective();
      unit = [];
      // scan line character-by-character to end-of-line
      while (this.index < this.length) {
        let ch = this.exprICode(this.index);
        let chn = this.exprICode(this.index + 1);
        // EXIT CONDITION: closing ]] return
        if (ch === CBRACK_CODE && chn === CBRACK_CODE) {
          this.index += 2;
          // return statement in block token
          if (DBG_MB)
            console.warn(`GM[${this.blockDepth}] statement rtn`, statements);
          this.blockDepth--;
          return { block: statements };
        }
        // collect tokens
        const tok = this.gobbleToken();
        if (DBG_MB) console.warn(`GM[${this.blockDepth}] unit addtok`, tok);
        unit.push(tok);
      }
      // the entire line is processed, so push unit as a statement
      if (DBG_MB) console.warn(`GM[${this.blockDepth}] statement add`, unit);
      statements.push(unit);
    } // while line...
    // if got this far, then there was no closing bracket
    // that was triggered by EXIT CONDITION above
    return this.throwError('GobbleMultiBlock: unclosed [[ in text');
  }

  /** GEMSCRIPT HACK ** A directive is a line that starts with #. We use it for
   *  our 'pragma' system (e.g. # BLUEPRINT AgentName ParentAgent, # PROGRAM DEFINE)
   */
  gobbleDirective() {
    const nodes = [{ directive: '#' }];
    this.index++;
    while (this.index < this.length) {
      nodes.push(this.gobbleToken());
    }
    return nodes;
  }

  /** GEMSCRIPT HACK ** comments begin with // */
  gobbleComment() {
    const eol = this.line.length;
    const comment = this.line.substring(this.index, eol).trim();
    this.index = eol;
    return { comment }; // comments comment keyword
  }
}

/// STATIC METHODS  //////////////////////////////////////////////////////////'
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const scriptifier = new ScriptTokenizer();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// public instance
function Tokenize(text) {
  return scriptifier.tokenize(text);
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ScriptTokenizer;
export { Tokenize };
