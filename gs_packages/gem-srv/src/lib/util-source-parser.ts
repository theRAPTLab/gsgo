/* eslint-disable no-lonely-if */
/* eslint-disable no-cond-assign */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  the intention: parse a string and break it into strings, numbers, identifiers,
  and expressions.

  * a string begins/ends with ' or "
  * a number begins with -/+ or a digit, and can contain a
    single decimal point.
  * an identifier begins with and alphabetic character and
    is followed by alphanumeric chars until a punctuator or whitespace
  * an expression exists on either side of the assignment
  * is the = sign treated special?

  in jsep, the gobble code walks literals until

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const WS_CODES = [32, 9, 10, 13];
//
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

// Set 't' to 'true' to save space (when minified, not gzipped)
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
/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function getMaxKeyLen(obj) {
  let max_len = 0;
  let len;
  Object.keys(obj).forEach(key => {
    len = key.length;
    if (len > max_len) max_len = len;
  });
  return max_len;
}
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
// Except for `this`, which is special. This could be changed to something like
// 'self' as well
const this_str = 'this';
// Returns the precedence of a binary operator or `0` if it isn't a binary operator
function binaryPrecedence(op_val) {
  console.log('binary prec', op_val, binary_ops[op_val]);
  return binary_ops[op_val] || 0;
}
// Utility function (gets called from multiple places)
// Also note that `a && b` and `a || b` are *logical* expressions, not binary expressions
function createBinaryExpression(operator, left, right) {
  let type = operator === '||' || operator === '&&' ? LOGICAL_EXP : BINARY_EXP;
  return { type, operator, left, right };
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// `ch` is a character code in the next three functions
function isDecimalDigit(ch) {
  return ch >= 48 && ch <= 57; // 0...9
}
function isIdentifierStart(ch) {
  return (
    ch === 36 ||
    ch === 95 || // `$` and `_`
    (ch >= 65 && ch <= 90) || // A...Z
    (ch >= 97 && ch <= 122) || // a...z
    (ch >= 128 && !binary_ops[String.fromCharCode(ch)])
  ); // any non-ASCII that is not an operator
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function isIdentifierPart(ch) {
  return (
    ch === 36 ||
    ch === 95 || // `$` and `_`
    (ch >= 65 && ch <= 90) || // A...Z
    (ch >= 97 && ch <= 122) || // a...z
    (ch >= 48 && ch <= 57) || // 0...9
    (ch >= 128 && !binary_ops[String.fromCharCode(ch)])
  ); // any non-ASCII that is not an operator
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// THIS IS THE BIG CHEESE FUNCTION CONTAINING MULTIPLE FUNCTIONS
/// THE REFER TO TOP-LEVEL VARS LIKE INDEX
export function parse(expr: string) {
  // character access functions
  const charcode_at = expr.charCodeAt;
  const char_at = expr.charAt;
  const exprI = i => char_at.call(expr, i);
  const exprICode = i => charcode_at.call(expr, i);
  // counters
  let index = 0;
  let length = expr.length;

  /// UTITLITY FUNCTIONS //////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function gobbleSpaces() {
    let ch = exprICode(index);
    while (WS_CODES.includes(ch)) ch = exprICode(++index);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function gobbleExpression() {
    const test = gobbleBinaryExpression();
    let consequent;
    let alternate;
    gobbleSpaces();
    if (exprICode(index) === QUMARK_CODE) {
      // Ternary expression: test ? consequent : alternate
      index++;
      consequent = gobbleExpression();
      if (!consequent) {
        throw Error(`Expected expression at index:${index}`);
      }
      gobbleSpaces();
      if (exprICode(index) === COLON_CODE) {
        index++;
        alternate = gobbleExpression();
        if (!alternate) {
          throw Error(`Expected expression at index:${index}`);
        }
        return {
          type: CONDITIONAL_EXP,
          test,
          consequent,
          alternate
        };
      }
      throw Error(`Expected : at index:${index}`);
    } else {
      return test;
    }
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function gobbleBinaryOp() {
    gobbleSpaces();
    let biop;
    let to_check = expr.substr(index, max_binop_len);
    let tc_len = to_check.length;
    while (tc_len > 0) {
      // Don't accept a binary op when it is an identifier.
      // Binary ops that start with a identifier-valid character must be followed
      // by a non identifier-part valid character
      if (
        binary_ops[to_check] &&
        (!isIdentifierStart(exprICode(index)) ||
          (index + to_check.length < expr.length &&
            !isIdentifierPart(exprICode(index + to_check.length))))
      ) {
        index += tc_len;
        return to_check;
      }
      to_check = to_check.substr(0, --tc_len);
    }
    return false;
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function gobbleBinaryExpression() {
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
    left = gobbleToken();
    biop = gobbleBinaryOp();
    // If there wasn't a binary operator, just return the leftmost node
    if (!biop) {
      return left;
    }
    // Otherwise, we need to gobble the entire expression string
    // but we don't have to actually convert it into an AST representation
    biop_info = { value: biop, prec: binaryPrecedence(biop) };
    right = gobbleToken();
    if (!right) {
      throw Error(`Expected expression after ${biop}, char:${index}`);
    }
    stack = [left, biop_info, right];

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    while ((biop = gobbleBinaryOp())) {
      prec = binaryPrecedence(biop);

      if (prec === 0) {
        break;
      }
      biop_info = { value: biop, prec };

      cur_biop = biop;
      // Reduce: make a binary expression from the three topmost entries.
      console.log('stack', stack);
      while (stack.length > 2 && prec <= stack[stack.length - 2].prec) {
        right = stack.pop();
        biop = stack.pop().value;
        left = stack.pop();
        node = createBinaryExpression(biop, left, right);
        stack.push(node);
      }

      node = gobbleToken();
      if (!node) {
        throw Error(`Expected expression after ${cur_biop} at index:${index}`);
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

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // An individual part of a binary expression:
  // e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
  function gobbleToken() {
    let ch;
    let to_check;
    let tc_len;

    gobbleSpaces();
    ch = exprICode(index);

    if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
      // Char code 46 is a dot `.` which can start off a numeric literal
      return gobbleNumericLiteral();
    }
    if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
      // Single or double quotes
      return gobbleStringLiteral();
    }
    if (ch === OBRACK_CODE) {
      return gobbleArray();
    }
    to_check = expr.substr(index, max_unop_len);
    tc_len = to_check.length;
    while (tc_len > 0) {
      // Don't accept an unary op when it is an identifier.
      // Unary ops that start with a identifier-valid character must be followed
      // by a non identifier-part valid character
      if (
        unary_ops[to_check] &&
        (!isIdentifierStart(exprICode(index)) ||
          (index + to_check.length < expr.length &&
            !isIdentifierPart(exprICode(index + to_check.length))))
      ) {
        index += tc_len;
        return {
          type: UNARY_EXP,
          operator: to_check,
          argument: gobbleToken(),
          prefix: true
        };
      }
      to_check = to_check.substr(0, --tc_len);
    }
    if (isIdentifierStart(ch) || ch === OPAREN_CODE) {
      // open parenthesis
      // `foo`, `bar.baz`
      return gobbleVariable();
    }
    return false;
  } // gobbleToken
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string
  // to keep track of everything in the numeric literal and then calling
  // `parseFloat` on that string
  function gobbleNumericLiteral() {
    let number = '';
    let ch;
    let chCode;
    while (isDecimalDigit(exprICode(index))) {
      number += exprI(index++);
    }

    if (exprICode(index) === PERIOD_CODE) {
      // can start with a decimal marker
      number += exprI(index++);

      while (isDecimalDigit(exprICode(index))) {
        number += exprI(index++);
      }
    }

    ch = exprI(index);
    if (ch === 'e' || ch === 'E') {
      // exponent marker
      number += exprI(index++);
      ch = exprI(index);
      if (ch === '+' || ch === '-') {
        // exponent sign
        number += exprI(index++);
      }
      while (isDecimalDigit(exprICode(index))) {
        //exponent itself
        number += exprI(index++);
      }
      if (!isDecimalDigit(exprICode(index - 1))) {
        throw Error(`Expected exponent (${number}${exprI(index)})`);
      }
    }

    chCode = exprICode(index);
    // Check to make sure this isn't a variable name that start with a number (123abc)
    if (isIdentifierStart(chCode)) {
      throw Error(
        `Variable names cannot start with a number (${number}${exprI(index)})`
      );
    } else if (chCode === PERIOD_CODE) {
      throw Error(`Unexpected period at index ${index}`);
    }

    return {
      type: LITERAL,
      value: parseFloat(number),
      raw: number
    };
  } // gobbleNumericLiteral

  // Parses a string literal, staring with single or double quotes with basic
  // support for escape codes e.g. `"hello world"`, `'this is\nJSEP'`
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function gobbleStringLiteral() {
    let str = '';
    let quote = exprI(index++);
    let closed = false;
    let ch;

    while (index < length) {
      ch = exprI(index++);
      if (ch === quote) {
        closed = true;
        break;
      } else if (ch === '\\') {
        // Check for all of the common escape codes
        ch = exprI(index++);
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

    if (!closed) {
      throw Error(`Unclosed quote after "' + str + '" index:${index}`);
    }

    return {
      type: LITERAL,
      value: str,
      raw: quote + str + quote
    };
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Gobbles only identifiers
  // e.g.: `foo`, `_value`, `$x1`
  // Also, this function checks if that identifier is a literal:
  // (e.g. `true`, `false`, `null`) or `this`
  function gobbleIdentifier() {
    let ch = exprICode(index);
    let start = index;
    let identifier;

    if (isIdentifierStart(ch)) {
      index++;
    } else {
      throw Error(`Unexpected ${exprI(index)}`);
    }

    while (index < length) {
      ch = exprICode(index);
      if (isIdentifierPart(ch)) {
        index++;
      } else {
        break;
      }
    }
    identifier = expr.slice(start, index);

    if (literals[identifier]) {
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
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Gobble a non-literal variable name. This variable name may include properties
  // e.g. `foo`, `bar.baz`, `foo['bar'].baz`
  // It also gobbles function calls:
  // e.g. `Math.acos(obj.angle)`
  function gobbleVariable() {
    let ch_i;
    let node;
    ch_i = exprICode(index);

    if (ch_i === OPAREN_CODE) {
      node = gobbleGroup();
    } else {
      node = gobbleIdentifier();
    }
    gobbleSpaces();
    ch_i = exprICode(index);
    while (ch_i === PERIOD_CODE || ch_i === OBRACK_CODE || ch_i === OPAREN_CODE) {
      index++;
      if (ch_i === PERIOD_CODE) {
        gobbleSpaces();
        node = {
          type: MEMBER_EXP,
          computed: false,
          object: node,
          property: gobbleIdentifier()
        };
      } else if (ch_i === OBRACK_CODE) {
        node = {
          type: MEMBER_EXP,
          computed: true,
          object: node,
          property: gobbleExpression()
        };
        gobbleSpaces();
        ch_i = exprICode(index);
        if (ch_i !== CBRACK_CODE) {
          throw Error(`Unclosed [ at index:${index}`);
        }
        index++;
      } else if (ch_i === OPAREN_CODE) {
        // A function call is being made; gobble all the arguments
        node = {
          type: CALL_EXP,
          'arguments': gobbleArguments(CPAREN_CODE),
          callee: node
        };
      }
      gobbleSpaces();
      ch_i = exprICode(index);
    }
    return node;
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Responsible for parsing a group of things within parentheses `()`
  // This function assumes that it needs to gobble the opening parenthesis
  // and then tries to gobble everything within that parenthesis, assuming
  // that the next thing it should see is the close parenthesis. If not,
  // then the expression probably doesn't have a `)`
  function gobbleGroup() {
    index++;
    let node = gobbleExpression();
    gobbleSpaces();
    if (exprICode(index) === CPAREN_CODE) {
      index++;
      return node;
    }
    throw Error('Unclosed ( at index:{$index}');
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Responsible for parsing Array literals `[1, 2, 3]`
  // This function assumes that it needs to gobble the opening bracket
  // and then tries to gobble the expressions as arguments.
  function gobbleArray() {
    index++;
    return {
      type: ARRAY_EXP,
      elements: gobbleArguments(CBRACK_CODE)
    };
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Gobbles a list of arguments within the context of a function call
  // or array literal. This function also assumes that the opening character
  // `(` or `[` has already been gobbled, and gobbles expressions and commas
  // until the terminator character `)` or `]` is encountered.
  // e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
  function gobbleArguments(termination) {
    let ch_i;
    let args = [];
    let node;
    let closed = false;
    let separator_count = 0;
    while (index < length) {
      gobbleSpaces();
      ch_i = exprICode(index);
      if (ch_i === termination) {
        // done parsing
        closed = true;
        index++;
        if (
          termination === CPAREN_CODE &&
          separator_count &&
          separator_count >= args.length
        ) {
          throw Error(
            `Unexpected token ${String.fromCharCode(
              termination
            )} at index:${index}`
          );
        }
        break;
      } else if (ch_i === COMMA_CODE) {
        // between expressions
        index++;
        separator_count++;
        if (separator_count !== args.length) {
          // missing argument
          if (termination === CPAREN_CODE) {
            throw Error(`Unexpected token , at index:${index}`);
          } else if (termination === CBRACK_CODE) {
            for (let arg = args.length; arg < separator_count; arg++) {
              args.push(null);
            }
          }
        }
      } else {
        node = gobbleExpression();
        if (!node || node.type === COMPOUND) {
          throw Error(`Expected comma at index:${index}`);
        }
        args.push(node);
      }
    }
    if (!closed) {
      throw Error(
        `Expected ${String.fromCharCode(termination)} at index:${index}`
      );
    }
    return args;
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // JSEP PARSE continues...
  let nodes = [];
  let ch_i;
  let node;
  while (index < length) {
    ch_i = exprICode(index);

    // Expressions can be separated by semicolons, commas, or just inferred without any
    // separators
    if (ch_i === SEMCOL_CODE || ch_i === COMMA_CODE) {
      index++; // ignore separators
    } else {
      // Try to gobble each expression individually
      if ((node = gobbleExpression())) {
        nodes.push(node);
        // If we weren't able to find a binary expression and are out of room, then
        // the expression passed in probably has too much
      } else if (index < length) {
        throw Error(`Unexpected "${exprI(index)}" at index:${index}`);
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
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
} // end of jsep function

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// es6: export default MODULEorCLASS;
///      export { A, B };
/// cjs: module.exports = MODULEorCLASS;
///      module.exports = { A, B };
