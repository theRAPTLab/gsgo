/* eslint-disable func-names */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-cond-assign */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This code is ported from jsep and adapted to produce our desired output
  https://ericsmekens.github.io/jsep/

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const string = 'class-expr-parser';
const charAtFunc = string.charAt;
const charCodeAtFunc = string.charCodeAt;

const COMPOUND = 'Compound';
const IDENTIFIER = 'Identifier';
const MEMBER_EXP = 'MemberExpression';
const LITERAL = 'Literal';
const THIS_EXP = 'ThisExpression';
const CALL_EXP = 'CallExpression';
const UNARY_EXP = 'UnaryExpression';
const BINARY_EXP = 'BinaryExpression';
const LOGICAL_EXP = 'LogicalExpression';
const CONDITIONAL_EXP = 'ConditionalExpression';
const ARRAY_EXP = 'ArrayExpression';
const COMMENT = 'Comment'; /* HACK add comment type */
//
const PERIOD_CODE = 46; // '.'
const COMMA_CODE = 44; // ','
const SQUOTE_CODE = 39; // single quote
const DQUOTE_CODE = 34; // double quotes
const OPAREN_CODE = 40; // (
const CPAREN_CODE = 41; // )
const OBRACK_CODE = 91; // [
const CBRACK_CODE = 93; // ]
const QUMARK_CODE = 63; // ?
const SEMCOL_CODE = 59; // ;
const COLON_CODE = 58; // :

// Operations
// ----------
// Set `t` to `true` to save space (when minified, not gzipped)
const t = true;
// Use a quickly-accessible map to store all of the unary operators
// Values are set to `true` (it really doesn't matter)
const unary_ops = { '-': t, '!': t, '~': t, '+': t };
// Also use a map for the binary operations but set their values to their
// binary precedence for quick reference:
// see [Order of operations](http://en.wikipedia.org/wiki/Order_of_operations#Programming_language)
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
const max_binop_len = getMaxKeyLen(binary_ops);
// Literals
// ----------
// Store the values to return for the various literals we may encounter
const literals = {
  'true': true,
  'false': false,
  'null': null
};
// Except for `this`, which is special. This could be changed to something like `'self'` as well
const this_str = 'this';
// Returns the precedence of a binary operator or `0` if it isn't a binary operator
const binaryPrecedence = function (op_val) {
  return binary_ops[op_val] || 0;
};
// Utility function (gets called from multiple places)
// Also note that `a && b` and `a || b` are *logical* expressions, not binary expressions
const createBinaryExpression = function (operator, left, right) {
  let type = operator === '||' || operator === '&&' ? LOGICAL_EXP : BINARY_EXP;
  return { type, operator, left, right };
};
// `ch` is a character code in the next three functions
const isDecimalDigit = function (ch) {
  return ch >= 48 && ch <= 57; // 0...9
};
const isIdentifierStart = function (ch) {
  return (
    ch === 36 ||
    ch === 95 || // `$` and `_`
    (ch >= 65 && ch <= 90) || // A...Z
    (ch >= 97 && ch <= 122) || // a...z
    (ch >= 128 && !binary_ops[String.fromCharCode(ch)])
  ); // any non-ASCII that is not an operator
};
const isIdentifierPart = function (ch) {
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
class ExpressionParser {
  constructor() {
    this.expr = '';
    this.index = 0;
    this.lastIndex = this.index;
    this.length = 0;
  }
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  /** PARSER *****************************************************************/
  parse(expr) {
    this.expr = expr;
    this.length = this.expr.length;
    this.index = 0;
    this.lastIndex = this.index;

    let nodes = [];
    let ch_i;
    let node;

    /* HACK IN COMMENT DETECTION */
    if (expr.substring(0, 2) === '//' || expr.charAt(0) === '#') {
      return {
        type: COMMENT,
        raw: expr
      };
    }
    /* END HACK */

    while (this.index < this.length) {
      /* HACK initialize lastIndex */
      this.lastIndex = this.index;
      /* END HACK */
      ch_i = this.exprICode(this.index);
      // Expressions can be separated by semicolons, commas, or just inferred
      // without any separators
      if (ch_i === SEMCOL_CODE || ch_i === COMMA_CODE) {
        this.index++; // ignore separators
      } else {
        /* HACK save starting index position */
        this.lastIndex = this.index;
        // Try to gobble each expression individually
        if ((node = this.gobbleExpression())) {
          /* HACK add our range calculation */
          const excerpt = expr.substring(this.lastIndex, this.index);
          node.range = [this.lastIndex, this.index];
          node.raw = excerpt;
          this.lastIndex = this.index;
          /* END HACK */
          nodes.push(node);
          // If we weren't able to find a binary expression and are out of room, then
          // the expression passed in probably has too much
        } else if (this.index < this.length) {
          throw Error(`Unexpected "${this.exprI(this.index)}" at ${this.index}`);
        }
      }
    }
    // If there's only one expression just try returning the expression
    if (nodes.length === 1) {
      return nodes[0];
    }
    return {
      type: COMPOUND,
      body: nodes
    };
  }
  /** END PARSER *************************************************************/
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  exprI(i) {
    return charAtFunc.call(this.expr, i);
  }
  exprICode(i) {
    return charCodeAtFunc.call(this.expr, i);
  }
  // Push `this.index` up to the next non-space character
  gobbleSpaces() {
    let ch = this.exprICode(this.index);
    // space or tab
    while (ch === 32 || ch === 9 || ch === 10 || ch === 13) {
      ch = this.exprICode(++this.index);
    }
  }
  // The main parsing function. Much of this code is dedicated to ternary expressions
  gobbleExpression() {
    let test = this.gobbleBinaryExpression();
    let consequent;
    let alternate;
    this.gobbleSpaces();
    if (this.exprICode(this.index) === QUMARK_CODE) {
      // Ternary expression: test ? consequent : alternate
      this.index++;
      consequent = this.gobbleExpression();
      if (!consequent) {
        throw Error(`Expected expression at ${this.index}`);
      }
      this.gobbleSpaces();
      if (this.exprICode(this.index) === COLON_CODE) {
        this.index++;
        alternate = this.gobbleExpression();
        if (!alternate) {
          throw Error(`Expected expression at ${this.index}`);
        }
        return {
          type: CONDITIONAL_EXP,
          test,
          consequent,
          alternate
        };
      }
      throw Error(`Expected : ${this.index}`);
    } else {
      return test;
    }
  }
  // Search for the operation portion of the string (e.g. `+`, `===`)
  // Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
  // and move down from 3 to 2 to 1 character until a matching binary operation is found
  // then, return that binary operation
  gobbleBinaryOp() {
    this.gobbleSpaces();
    let biop;
    let to_check = this.expr.substr(this.index, max_binop_len);
    let tc_len = to_check.length;
    while (tc_len > 0) {
      // Don't accept a binary op when it is an identifier.
      // Binary ops that start with a identifier-valid character must be followed
      // by a non identifier-part valid character
      if (
        binary_ops.hasOwnProperty(to_check) &&
        (!isIdentifierStart(this.exprICode(this.index)) ||
          (this.index + to_check.length < this.expr.length &&
            !isIdentifierPart(this.exprICode(this.index + to_check.length))))
      ) {
        this.index += tc_len;
        return to_check;
      }
      to_check = to_check.substr(0, --tc_len);
    }
    return false;
  }
  // This function is responsible for gobbling an individual expression,
  // e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
  gobbleBinaryExpression() {
    let ch_i;
    let node;
    let biop;
    let prec;
    let stack;
    let biop_info;
    let left;
    let right;
    let i;
    let cur_biop;

    // First, try to get the leftmost thing
    // Then, check to see if there's a binary operator operating on that leftmost thing
    left = this.gobbleToken();
    biop = this.gobbleBinaryOp();

    // If there wasn't a binary operator, just return the leftmost node
    if (!biop) {
      return left;
    }

    // Otherwise, we need to start a stack to properly place the binary operations in their
    // precedence structure
    biop_info = { value: biop, prec: binaryPrecedence(biop) };

    right = this.gobbleToken();
    if (!right) {
      throw Error(`Expected expression after ${biop} at ${this.index}`);
    }
    stack = [left, biop_info, right];

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    while ((biop = this.gobbleBinaryOp())) {
      prec = binaryPrecedence(biop);

      if (prec === 0) {
        break;
      }
      biop_info = { value: biop, prec };

      cur_biop = biop;
      // Reduce: make a binary expression from the three topmost entries.
      while (stack.length > 2 && prec <= stack[stack.length - 2].prec) {
        right = stack.pop();
        biop = stack.pop().value;
        left = stack.pop();
        node = createBinaryExpression(biop, left, right);
        stack.push(node);
      }

      node = this.gobbleToken();
      if (!node) {
        throw Error(`Expected expression after ${cur_biop} at ${this.index}`);
      }
      stack.push(biop_info, node);
    }

    i = stack.length - 1;
    node = stack[i];
    while (i > 1) {
      node = createBinaryExpression(stack[i - 1].value, stack[i - 2], node);
      i -= 2;
    }
    return node;
  }
  // An individual part of a binary expression:
  // e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
  gobbleToken() {
    let ch;
    let to_check;
    let tc_len;

    this.gobbleSpaces();
    ch = this.exprICode(this.index);

    if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
      // Char code 46 is a dot `.` which can start off a numeric literal
      return this.gobbleNumericLiteral();
    }
    if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
      // Single or double quotes
      return this.gobbleStringLiteral();
    }
    if (ch === OBRACK_CODE) {
      return this.gobbleArray();
    }
    to_check = this.expr.substr(this.index, max_unop_len);
    tc_len = to_check.length;
    while (tc_len > 0) {
      // Don't accept an unary op when it is an identifier.
      // Unary ops that start with a identifier-valid character must be followed
      // by a non identifier-part valid character
      if (
        unary_ops.hasOwnProperty(to_check) &&
        (!isIdentifierStart(this.exprICode(this.index)) ||
          (this.index + to_check.length < this.expr.length &&
            !isIdentifierPart(this.exprICode(this.index + to_check.length))))
      ) {
        this.index += tc_len;
        return {
          type: UNARY_EXP,
          operator: to_check,
          argument: this.gobbleToken(),
          prefix: true
        };
      }
      to_check = to_check.substr(0, --tc_len);
    }

    if (isIdentifierStart(ch) || ch === OPAREN_CODE) {
      // open parenthesis
      // `foo`, `bar.baz`
      return this.gobbleVariable();
    }

    return false;
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
        throw Error(
          `Expected exponent (${number + this.exprI(this.index)}) at ${
            this.index
          }`
        );
      }
    }

    chCode = this.exprICode(this.index);
    // Check to make sure this isn't a variable name that start with a number (123abc)
    if (isIdentifierStart(chCode)) {
      throw Error(
        `Variable names cannot start with a number (${
          number + this.exprI(this.index)
        }) at ${this.index}`
      );
    } else if (chCode === PERIOD_CODE) {
      throw Error(`Unexpected period at ${this.index}`);
    }

    return {
      type: LITERAL,
      value: parseFloat(number),
      raw: number
    };
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

    if (!closed) throw Error(`Unclosed quote after "${str}" at ${this.index}`);

    return {
      type: LITERAL,
      value: str,
      raw: quote + str + quote
    };
  }
  // Gobbles only identifiers
  // e.g.: `foo`, `_value`, `$x1`
  // Also, this function checks if that identifier is a literal:
  // (e.g. `true`, `false`, `null`) or `this`
  gobbleIdentifier() {
    let ch = this.exprICode(this.index);
    let start = this.index;
    let identifier;

    if (isIdentifierStart(ch)) {
      this.index++;
    } else {
      throw Error(`Unexpected ${this.exprI(this.index)} at ${this.index}`);
    }

    while (this.index < this.length) {
      ch = this.exprICode(this.index);
      if (isIdentifierPart(ch)) {
        this.index++;
      } else {
        break;
      }
    }
    identifier = this.expr.slice(start, this.index);

    if (literals.hasOwnProperty(identifier)) {
      return {
        type: LITERAL,
        value: literals[identifier],
        raw: identifier
      };
    }
    if (identifier === this_str) {
      return { type: THIS_EXP };
    }
    return {
      type: IDENTIFIER,
      name: identifier
    };
  }
  // Gobbles a list of arguments within the context of a function call
  // or array literal. This function also assumes that the opening character
  // `(` or `[` has already been gobbled, and gobbles expressions and commas
  // until the terminator character `)` or `]` is encountered.
  // e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
  gobbleArguments(termination) {
    let ch_i;
    let args = [];
    let node;
    let closed = false;
    let separator_count = 0;
    while (this.index < this.length) {
      this.gobbleSpaces();
      ch_i = this.exprICode(this.index);
      if (ch_i === termination) {
        // done parsing
        closed = true;
        this.index++;
        if (
          termination === CPAREN_CODE &&
          separator_count &&
          separator_count >= args.length
        ) {
          throw Error(
            `Unexpected token ${String.fromCharCode(termination)} at ${
              this.index
            }`
          );
        }
        break;
      } else if (ch_i === COMMA_CODE) {
        // between expressions
        this.index++;
        separator_count++;
        if (separator_count !== args.length) {
          // missing argument
          if (termination === CPAREN_CODE) {
            throw Error(`Unexpected token at ${this.index}`);
          } else if (termination === CBRACK_CODE) {
            for (let arg = args.length; arg < separator_count; arg++) {
              args.push(null);
            }
          }
        }
      } else {
        node = this.gobbleExpression();
        if (!node || node.type === COMPOUND) {
          throw Error(`Expected comma at ${this.index}`);
        }
        args.push(node);
      }
    }
    if (!closed) {
      throw Error(
        `Expected ${String.fromCharCode(termination)} at ${this.index}`
      );
    }
    return args;
  }
  // Gobble a non-literal variable name. This variable name may include properties
  // e.g. `foo`, `bar.baz`, `foo['bar'].baz`
  // It also gobbles function calls:
  // e.g. `Math.acos(obj.angle)`
  gobbleVariable() {
    let ch_i;
    let node;
    ch_i = this.exprICode(this.index);

    if (ch_i === OPAREN_CODE) {
      node = this.gobbleGroup();
    } else {
      node = this.gobbleIdentifier();
    }
    this.gobbleSpaces();
    ch_i = this.exprICode(this.index);
    while (ch_i === PERIOD_CODE || ch_i === OBRACK_CODE || ch_i === OPAREN_CODE) {
      this.index++;
      if (ch_i === PERIOD_CODE) {
        this.gobbleSpaces();
        node = {
          type: MEMBER_EXP,
          computed: false,
          object: node,
          property: this.gobbleIdentifier()
        };
      } else if (ch_i === OBRACK_CODE) {
        node = {
          type: MEMBER_EXP,
          computed: true,
          object: node,
          property: this.gobbleExpression()
        };
        this.gobbleSpaces();
        ch_i = this.exprICode(this.index);
        if (ch_i !== CBRACK_CODE) {
          throw Error(`Unclosed [ at ${this.index}`);
        }
        this.index++;
      } else if (ch_i === OPAREN_CODE) {
        // A function call is being made; gobble all the arguments
        node = {
          type: CALL_EXP,
          'arguments': this.gobbleArguments(CPAREN_CODE),
          callee: node
        };
      }
      this.gobbleSpaces();
      ch_i = this.exprICode(this.index);
    }
    return node;
  }
  // Responsible for parsing a group of things within parentheses `()`
  // This function assumes that it needs to gobble the opening parenthesis
  // and then tries to gobble everything within that parenthesis, assuming
  // that the next thing it should see is the close parenthesis. If not,
  // then the expression probably doesn't have a `)`
  gobbleGroup() {
    this.index++;
    let node = this.gobbleExpression();
    this.gobbleSpaces();
    if (this.exprICode(this.index) === CPAREN_CODE) {
      this.index++;
      return node;
    }
    throw Error(`Unclosed ( at ${this.index}`);
  }
  // Responsible for parsing Array literals `[1, 2, 3]`
  // This function assumes that it needs to gobble the opening bracket
  // and then tries to gobble the expressions as arguments.
  gobbleArray() {
    this.index++;
    return {
      type: ARRAY_EXP,
      elements: this.gobbleArguments(CBRACK_CODE)
    };
  }
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ExpressionParser;
export { isIdentifierPart, isIdentifierStart, isDecimalDigit };
export {
  unary_ops,
  binary_ops,
  PERIOD_CODE,
  COMMA_CODE,
  SQUOTE_CODE,
  DQUOTE_CODE,
  OPAREN_CODE,
  CPAREN_CODE,
  OBRACK_CODE,
  CBRACK_CODE,
  QUMARK_CODE,
  SEMCOL_CODE,
  COLON_CODE
};
