/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptTokenizer takes a text input and produces a TScriptUnit, which is
  an array of form ['keyword', ...args]. Arrays of TScriptUnits form our
  "script object code"

  The main entry point of the class instance is:
  tokenize(expr:string)

  All this version of the tokenizer needs to do is detect {{ }}, [[ ]],
  and [[ ... lines ]]. It returns the tokenized values in raw string or array
  format. It also detected comments // and directives #

  KNOWN BUGS
  * Inline blocks inside of a multiblock cause the tokenizer to lockup.
    The problem is in gobbleMultiBlock not handling inline blocks.
    onEvent Tick [[
      [[ ]]  <---- scanner breaks on this
    ]]

  This code is a refactored version of jsep, modified to produce
  our script unit format of [keyword, ...args] instead of an AST.
  -
  JSEP project, under MIT License.
  Copyright (c) 2013 Stephen Oney, http://jsep.from.so/
  see: https://ericsmekens.github.io/jsep/

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const string = 'class-script-tokenizer-2';
const charAtFunc = string.charAt;
const charCodeAtFunc = string.charCodeAt;
const t = true;
let DBG = false;
let DBG_SHOW = false;

/// CHAR CODES ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PERIOD_CODE = 46; // '.'
const COMMA_CODE = 44; // ','
const SQUOTE_CODE = 39; // single quote
const DQUOTE_CODE = 34; // double quotes
const OPAREN_CODE = 40; // (
const CPAREN_CODE = 41; // )
const OBRACK_CODE = 91; // [
const CBRACK_CODE = 93; // ]
const OCURLY_CODE = 123; // {
const CCURLY_CODE = 125; // }
const COMMENT_1 = '//';
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
  /* HACK disable because we use << >> for block delimiters */
  // '<<': 8,
  // '>>': 8,
  // '>>>': 8,
  '+': 9,
  '-': 9,
  '*': 10,
  '/': 10,
  '%': 10
};
const literals = {
  'true': true,
  'false': false,
  'null': null
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
const max_unop_len = getMaxKeyLen(unary_ops);
/** `ch` is a character code in the next three functions */
const isDecimalDigit = ch => {
  return ch >= 48 && ch <= 57; // 0...9
};
const isIdentifierStart = ch => {
  return (
    ch === 36 ||
    ch === 95 || // `$` and `_`
    (ch >= 65 && ch <= 90) || // A...Z
    (ch >= 97 && ch <= 122) || // a...z
    (ch >= 128 && !binary_ops[String.fromCharCode(ch)])
  ); // any non-ASCII that is not an operator
};
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
      show: DBG_SHOW // show progress
    };
    this.do = doFlags;
    this.line = '';
    this.index = 0;
    this.lastIndex = this.index;
    this.length = 0;
  }

  showCursor(prompt) {
    const s1 = this.line.substring(0, this.index);
    const s2 = this.line[this.index] || 'EOL';
    const s3 = this.line.substring(this.index + 1) || '';
    const pr = prompt === undefined ? '' : `${prompt}`;
    console.log(
      `%c${s1}%c${s2}%c${s3} %c${pr}`,
      'color:black;',
      'background-color:#FFB000',
      'color:#C0C0C0',
      'color:white;background-color:#FF0000;padding:2px 0 2px 0'
    );
  }

  throwError(err) {
    this.showCursor('ERROR');
    throw Error(err);
  }
  exprI(i) {
    return charAtFunc.call(this.line, i);
  }
  exprICode(i) {
    return charCodeAtFunc.call(this.line, i);
  }
  nextLine() {
    this.index = 0;
    while (this.linesIndex < this.linesCount) {
      this.line = this.lines[this.linesIndex++].trim();
      this.length = this.line.length;
      if (this.length > 0) return;
    }
    this.line = '';
    this.length = 0;
  }

  /////////////////////////////////////////////////////////////////////////////
  /** TOKENIZER **************************************************************/
  tokenize(lines, flag) {
    this.lines = lines; // an array of strings
    this.linesCount = this.lines.length;
    this.linesIndex = 0;
    this.line = '';
    this.index = 0;
    this.length = this.line.length;
    DBG_SHOW = flag === 'show';

    let units = [];

    while (this.linesIndex < this.linesCount) {
      const nodes = this.gobbleLine();
      units.push(nodes);
    } // end while lines<lines.length

    // return a Script array of ScriptUnit arrays
    return units;
  }
  /** END TOKENIZER **********************************************************/
  /////////////////////////////////////////////////////////////////////////////

  /* HACK ADDITION to gobble lines */
  gobbleMultiBlock() {
    // we are here because of an unbalanced [[
    // so we must scan for it
    const block = [];
    let str = '';
    let level = 1; // starting from level 1

    /*
      algorithm: this returns whole lines in a block array
      The way tokenize is called by Transpiler.CompileBlueprint() is
      to use one main pass to capture all the outer level blocks into
      an array, so the ScriptUnit is [ term, term, [ line, line ] ]
      Each term of the script unit is "Expanded", and if the unit is
      an array then CompileBlock is called on that block, which Expands
      again recursively. At the end of the recursive compile, we're
      left with a variety of TOpcode[] terms that the runtime code
      generated by keywords recognize as a PROGRAM and calls agent.exec
      on them!
    */

    while (level > 0 && this.linesIndex < this.linesCount + 1) {
      this.nextLine();
      this.gobbleSpaces();
      str = '';

      while (level > 0 && this.index < this.length) {
        let ch = this.exprICode(this.index++);
        let chn = this.exprICode(this.index);
        if (ch === OBRACK_CODE && chn === OBRACK_CODE) {
          level++;
          this.index++;
          str += '[[';
          break;
        }
        if (ch === CBRACK_CODE && chn === CBRACK_CODE) {
          level--;
          if (level > 0) str += ']]';
          if (level === 0) this.index++;
          this.index++;
          break;
        }
        // no special chars, so add to the string
        str += String.fromCharCode(ch);
      } // while index<length
      // at the end of this line, push the lines from inside
      if (str.length > 0) block.push(str);
      // capture the untokenized string for subblock processing
    }
    // either we're out of lines or level is 0
    if (level === 0) return { block }; // return block;
    return this.throwError('Unclosed [[ in text');
  }

  gobbleLine() {
    let nodes = [];
    let node;

    this.nextLine();

    /* special cases for gemscript */
    if (this.line.substring(0, 2) === COMMENT_1) return this.gobbleComment();
    if (this.line.substring(0, 1) === DIRECTIVE) return this.gobbleDirective();

    while (this.index < this.length) {
      this.gobbleSpaces();
      node = this.gobbleToken();
      nodes.push(node);
    }

    return nodes;
  }

  // grab a compiler directive
  gobbleDirective() {
    const nodes = [{ directive: '#' }];
    this.index++;
    while (this.index < this.length) {
      nodes.push(this.gobbleToken());
    }
    return nodes;
  }

  // Push `this.index` up to the next non-space character
  gobbleSpaces() {
    let ch = this.exprICode(this.index);
    // space or tab
    while (ch === 32 || ch === 9 || ch === 10 || ch === 13) {
      ch = this.exprICode(++this.index);
    }
  }

  // Return the next token (eq to gobbleExpression)
  gobbleToken() {
    this.gobbleSpaces();
    if (DBG_SHOW) this.showCursor();
    let ch = this.exprICode(this.index);
    let chn = this.exprICode(this.index + 1);
    let to_check;
    let tc_len;
    /* HACK GEMSCRIPT ADDITION FOR [[ ]] */
    if (ch === OBRACK_CODE && chn === OBRACK_CODE) {
      this.index++;
      return this.gobbleBlock(); // in gobbleParts() also
    }
    /* HACK GEMSCRIPT ADDITION FOR {{ expr }} */
    if (ch === OCURLY_CODE && chn === OCURLY_CODE) {
      this.index++;
      return this.gobbleExpressionString();
    }
    /* END HACK */

    if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
      // Char code 46 is a dot `.` which can start off a numeric literal
      return this.gobbleNumericLiteral();
    }

    if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
      // Single or double quotes
      return this.gobbleStringLiteral();
    }

    to_check = this.line.substr(this.index, max_unop_len);
    tc_len = to_check.length;
    while (tc_len > 0) {
      // Don't accept an unary op when it is an identifier.
      // Unary ops that start with a identifier-valid character must be followed
      // by a non identifier-part valid character
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

  // Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
  // keep track of everything in the numeric literal and then calling `parseFloat` on that string
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
        this.showCursor();
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
          `Expected exponent (${number + this.exprI(this.index)}) at ${
            this.index
          }`
        );
      }
    }

    chCode = this.exprICode(this.index);
    // Check to make sure this isn't a variable name that start with a number (123abc)
    if (isIdentifierStart(chCode)) {
      this.throwError(
        `Variable names cannot start with a number (${
          number + this.exprI(this.index)
        }) at ${this.index}`
      );
    } else if (chCode === PERIOD_CODE) {
      this.throwError(`Unexpected period at ${this.index}`);
    }

    return { value: parseFloat(number) }; // was: return parseFloat(number);
  }

  // Parses a string literal, staring with single or double quotes with basic support for escape codes
  // e.g. `"hello world"`, `'this is\nJSEP'`
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
      this.throwError(`Unclosed quote after "${str}" at ${this.index}`);
    return { string: str }; // was: return str;
  }
  // Gobbles only identifiers
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
      this.throwError(`Unexpected ${this.exprI(this.index)} at ${this.index}`);
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

    if (Object.prototype.hasOwnProperty.call(literals, identifier)) {
      return { identifier: literals[identifier] }; // was: return literals[identifier];
    }

    //
    return { identifier }; // was: return identifier;
  }

  // Gobble a non-literal variable name. This variable name may include properties
  // e.g. `foo`, `bar.baz`, `foo['bar'].baz`
  // It also gobbles function calls:
  // e.g. `Math.acos(obj.angle)`
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
      if (DBG_SHOW) this.showCursor();
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
    // node is the collection of variable props (dotted)
    if (node.length === 1) return { token: node[0].identifier };
    return { objref: node }; // was: return node;
  }

  // Responsible for parsing a group of things within parentheses `()`
  // This function assumes that it needs to gobble the opening parenthesis
  // and then tries to gobble everything within that parenthesis, assuming
  // that the next thing it should see is the close parenthesis. If not,
  // then the expression probably doesn't have a `)`
  gobbleGroup() {
    this.index++;
    let node = this.gobbleToken();
    this.gobbleSpaces();
    if (this.exprICode(this.index) === CPAREN_CODE) {
      this.index++;
      return node;
    }
    return this.throwError(`Unclosed ( at ${this.index}`);
  }

  /* HACK ADDITION for text script expressions */
  // in GEMscript text, a {{ }} indicates an expression, and should
  // be captured as one long string including the {{ }}
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
        return { expr: str }; // was: return `{{${str}}}`;
      }
      str += String.fromCharCode(ch);
    }
    return this.throwError(`Unclosed inline {{ at ${this.index} for ${str}`);
  }

  /* HACK ADDITION for text script tmethod names */
  // in GEMSCRIPT text, a [[ ]] on a single line designates a
  // named TMethod. There are several possible locations of the
  // TMethod such as TESTS or PROGRAMS map; it's up to the keyword
  // implementor to know which one it is
  gobbleBlock() {
    // when this is called from gobbleParts, we're already pointing
    // at the second [ in <<
    let ch;
    let cch;
    let str = '';
    let level = 1;
    this.index++;

    // start reading inside <<
    while (this.index < this.length) {
      ch = this.exprICode(this.index++);
      cch = this.exprICode(this.index);
      // check for closing bracket level 0
      if (ch === CBRACK_CODE && cch === CBRACK_CODE) {
        this.index++;
        level--;
        if (level === 0) return { program: str }; // was: return `[[${str}]]`;
        str += ']]';
      } else if (ch === OBRACK_CODE && cch === OBRACK_CODE) {
        this.index++;
        level++;
        str += '[[';
      } else {
        str += String.fromCharCode(ch);
      }
    }
    // if got this far, an unclosed [[ means we need to read lines
    return this.gobbleMultiBlock();
  }

  /* HACK ADDITION for text script comments // and -- */
  // skip the first two // and output the entire rest of the line
  gobbleComment() {
    const eol = this.line.length;
    const comment = this.line.substring(2, eol).trim();
    this.index = eol;

    return [{ comment }]; // comments comment keyword
  }
  /* END OF HACK HACKS */
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ScriptTokenizer;
