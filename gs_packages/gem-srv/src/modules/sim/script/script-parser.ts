/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SourceString to ScriptObject

  Given a GEMscript source string, create a GEMscript ScriptUnit, which is an
  array of arrays of form ['keyword',...args:any]. The source array is used to
  drive the actual compilation into opcodes

  This code is ported from jsep and adapted to produce our desired output
  https://ericsmekens.github.io/jsep/

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/* eslint-disable func-names */
/* eslint-disable no-lonely-if */
/* eslint-disable no-prototype-builtins */
/* eslint-disable prefer-template */
/* eslint-disable vars-on-top */
/* eslint-disable no-else-return */
/* eslint-disable object-shorthand */
/* eslint-disable no-cond-assign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable one-var */
/* eslint-disable no-var */

import { ScriptUnit } from 'lib/t-script';

const COMPOUND = 'Compound';
const IDENTIFIER = 'Identifier';
const MEMBER_EXP = 'MemberExpression';
const LITERAL = 'Literal';
const THIS_EXP = 'ThisExpression';
// const CALL_EXP = 'CallExpression'; /* HACK we don't need these */
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
// Get return the longest key length of any object
const getMaxKeyLen = function (obj) {
  var max_len = 0,
    len;
  for (var key in obj) {
    if ((len = key.length) > max_len && obj.hasOwnProperty(key)) {
      max_len = len;
    }
  }
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
  var type = operator === '||' || operator === '&&' ? LOGICAL_EXP : BINARY_EXP;
  return {
    type: type,
    operator: operator,
    left: left,
    right: right
  };
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
// Parsing
// -------
// `expr` is a string with the passed in expression
function Parse(expr) {
  // `index` stores the character number we are currently at while `length` is a constant
  // All of the gobbles below will modify `index` as we move along
  let index = 0;
  let lastIndex = index; /* HACK add our own range thing */
  const charAtFunc = expr.charAt;
  const charCodeAtFunc = expr.charCodeAt;
  const exprI = function (i) {
    return charAtFunc.call(expr, i);
  };
  const exprICode = function (i) {
    return charCodeAtFunc.call(expr, i);
  };
  const length = expr.length;
  // Push `index` up to the next non-space character
  const gobbleSpaces = function () {
    var ch = exprICode(index);
    // space or tab
    while (ch === 32 || ch === 9 || ch === 10 || ch === 13) {
      ch = exprICode(++index);
    }
  };
  // The main parsing function. Much of this code is dedicated to ternary expressions
  const gobbleExpression = function () {
    var test = gobbleBinaryExpression(),
      consequent,
      alternate;
    gobbleSpaces();
    if (exprICode(index) === QUMARK_CODE) {
      // Ternary expression: test ? consequent : alternate
      index++;
      consequent = gobbleExpression();
      if (!consequent) {
        throw Error(`Expected expression at ${index}`);
      }
      gobbleSpaces();
      if (exprICode(index) === COLON_CODE) {
        index++;
        alternate = gobbleExpression();
        if (!alternate) {
          throw Error(`Expected expression at ${index}`);
        }
        return {
          type: CONDITIONAL_EXP,
          test: test,
          consequent: consequent,
          alternate: alternate
        };
      } else {
        throw Error(`Expected : ${index}`);
      }
    } else {
      return test;
    }
  };
  // Search for the operation portion of the string (e.g. `+`, `===`)
  // Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
  // and move down from 3 to 2 to 1 character until a matching binary operation is found
  // then, return that binary operation
  const gobbleBinaryOp = function () {
    gobbleSpaces();
    var biop,
      to_check = expr.substr(index, max_binop_len),
      tc_len = to_check.length;
    while (tc_len > 0) {
      // Don't accept a binary op when it is an identifier.
      // Binary ops that start with a identifier-valid character must be followed
      // by a non identifier-part valid character
      if (
        binary_ops.hasOwnProperty(to_check) &&
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
  };
  // This function is responsible for gobbling an individual expression,
  // e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
  const gobbleBinaryExpression = function () {
    var ch_i, node, biop, prec, stack, biop_info, left, right, i, cur_biop;

    // First, try to get the leftmost thing
    // Then, check to see if there's a binary operator operating on that leftmost thing
    left = gobbleToken();
    biop = gobbleBinaryOp();

    // If there wasn't a binary operator, just return the leftmost node
    if (!biop) {
      return left;
    }

    // Otherwise, we need to start a stack to properly place the binary operations in their
    // precedence structure
    biop_info = { value: biop, prec: binaryPrecedence(biop) };

    right = gobbleToken();
    if (!right) {
      throw Error(`Expected expression after ${biop} at ${index}`);
    }
    stack = [left, biop_info, right];

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    while ((biop = gobbleBinaryOp())) {
      prec = binaryPrecedence(biop);

      if (prec === 0) {
        break;
      }
      biop_info = { value: biop, prec: prec };

      cur_biop = biop;
      // Reduce: make a binary expression from the three topmost entries.
      while (stack.length > 2 && prec <= stack[stack.length - 2].prec) {
        right = stack.pop();
        biop = stack.pop().value;
        left = stack.pop();
        node = createBinaryExpression(biop, left, right);
        stack.push(node);
      }

      node = gobbleToken();
      if (!node) {
        throw Error(`Expected expression after ${cur_biop} at ${index}`);
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
  };
  // An individual part of a binary expression:
  // e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
  const gobbleToken = function () {
    var ch, to_check, tc_len;

    gobbleSpaces();
    ch = exprICode(index);

    if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
      // Char code 46 is a dot `.` which can start off a numeric literal
      return gobbleNumericLiteral();
    } else if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
      // Single or double quotes
      return gobbleStringLiteral();
    } else if (ch === OBRACK_CODE) {
      return gobbleArray();
    } else {
      to_check = expr.substr(index, max_unop_len);
      tc_len = to_check.length;
      while (tc_len > 0) {
        // Don't accept an unary op when it is an identifier.
        // Unary ops that start with a identifier-valid character must be followed
        // by a non identifier-part valid character
        if (
          unary_ops.hasOwnProperty(to_check) &&
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
    }

    return false;
  };
  // Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
  // keep track of everything in the numeric literal and then calling `parseFloat` on that string
  const gobbleNumericLiteral = function () {
    var number = '',
      ch,
      chCode;
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
        throw Error(`Expected exponent (${number + exprI(index)}) at ${index}`);
      }
    }

    chCode = exprICode(index);
    // Check to make sure this isn't a variable name that start with a number (123abc)
    if (isIdentifierStart(chCode)) {
      throw Error(
        `Variable names cannot start with a number (${
          number + exprI(index)
        }) at ${index}`
      );
    } else if (chCode === PERIOD_CODE) {
      throw Error(`Unexpected period at ${index}`);
    }

    return {
      type: LITERAL,
      value: parseFloat(number),
      raw: number
    };
  };
  // Parses a string literal, staring with single or double quotes with basic support for escape codes
  // e.g. `"hello world"`, `'this is\nJSEP'`
  const gobbleStringLiteral = function () {
    var str = '',
      quote = exprI(index++),
      closed = false,
      ch;

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

    if (!closed) throw Error(`Unclosed quote after "${str}" at ${index}`);

    return {
      type: LITERAL,
      value: str,
      raw: quote + str + quote
    };
  };
  // Gobbles only identifiers
  // e.g.: `foo`, `_value`, `$x1`
  // Also, this function checks if that identifier is a literal:
  // (e.g. `true`, `false`, `null`) or `this`
  const gobbleIdentifier = function () {
    var ch = exprICode(index),
      start = index,
      identifier;

    if (isIdentifierStart(ch)) {
      index++;
    } else {
      throw Error(`Unexpected ${exprI(index)} at ${index}`);
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

    if (literals.hasOwnProperty(identifier)) {
      return {
        type: LITERAL,
        value: literals[identifier],
        raw: identifier
      };
    } else if (identifier === this_str) {
      return { type: THIS_EXP };
    } else {
      return {
        type: IDENTIFIER,
        name: identifier
      };
    }
  };
  // Gobbles a list of arguments within the context of a function call
  // or array literal. This function also assumes that the opening character
  // `(` or `[` has already been gobbled, and gobbles expressions and commas
  // until the terminator character `)` or `]` is encountered.
  // e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
  const gobbleArguments = function (termination) {
    var ch_i,
      args = [],
      node,
      closed = false;
    var separator_count = 0;
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
            `Unexpected token ${String.fromCharCode(termination)} at ${index}`
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
            throw Error(`Unexpected token at ${index}`);
          } else if (termination === CBRACK_CODE) {
            for (var arg = args.length; arg < separator_count; arg++) {
              args.push(null);
            }
          }
        }
      } else {
        node = gobbleExpression();
        if (!node || node.type === COMPOUND) {
          throw Error(`Expected comma at ${index}`);
        }
        args.push(node);
      }
    }
    if (!closed) {
      throw Error(`Expected ${String.fromCharCode(termination)} at ${index}`);
    }
    return args;
  };
  // Gobble a non-literal variable name. This variable name may include properties
  // e.g. `foo`, `bar.baz`, `foo['bar'].baz`
  // It also gobbles function calls:
  // e.g. `Math.acos(obj.angle)`
  const gobbleVariable = function () {
    var ch_i, node;
    ch_i = exprICode(index);

    if (ch_i === OPAREN_CODE) {
      node = gobbleGroup();
    } else {
      node = gobbleIdentifier();
    }
    gobbleSpaces();
    ch_i = exprICode(index);
    /* HACK we don't want to process call expressions
    while (ch_i === PERIOD_CODE || ch_i === OBRACK_CODE || ch_i === OPAREN_CODE) {
    END HACK */
    while (ch_i === PERIOD_CODE || ch_i === OBRACK_CODE) {
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
          throw Error(`Unclosed [ at ${index}`);
        }
        index++;
      } /* HACK - remove processing of call expressions!
        else if (ch_i === OPAREN_CODE) {
        // A function call is being made; gobble all the arguments
        node = {
          type: CALL_EXP,
          'arguments': gobbleArguments(CPAREN_CODE),
          callee: node
        };
      } END HACK */
      gobbleSpaces();
      ch_i = exprICode(index);
    }
    return node;
  };
  // Responsible for parsing a group of things within parentheses `()`
  // This function assumes that it needs to gobble the opening parenthesis
  // and then tries to gobble everything within that parenthesis, assuming
  // that the next thing it should see is the close parenthesis. If not,
  // then the expression probably doesn't have a `)`
  const gobbleGroup = function () {
    index++;
    var node = gobbleExpression();
    gobbleSpaces();
    if (exprICode(index) === CPAREN_CODE) {
      index++;
      return node;
    } else {
      throw Error(`Unclosed ( at ${index}`);
    }
  };
  // Responsible for parsing Array literals `[1, 2, 3]`
  // This function assumes that it needs to gobble the opening bracket
  // and then tries to gobble the expressions as arguments.
  const gobbleArray = function () {
    index++;
    return {
      type: ARRAY_EXP,
      elements: gobbleArguments(CBRACK_CODE)
    };
  };

  /** START OF TOKENIZING ****************************************************/

  const nodes = [];
  let ch_i;
  let node;

  while (index < length) {
    /* HACK initialize lastIndex */
    lastIndex = index;
    /* END HACK */
    ch_i = exprICode(index);

    // Expressions can be separated by semicolons, commas, or just inferred
    // without any separators
    if (ch_i === SEMCOL_CODE || ch_i === COMMA_CODE) {
      index++; // ignore separators
    } else {
      /* HACK save starting index position */
      lastIndex = index;
      // Try to gobble each expression individually
      if ((node = gobbleExpression())) {
        /* HACK add our range calculation */
        const excerpt = expr.substring(lastIndex, index);
        node.range = [lastIndex, index];
        node.raw = excerpt;
        lastIndex = index;
        /* END HACK */
        nodes.push(node);
        // If we weren't able to find a binary expression and are out of room, then
        // the expression passed in probably has too much
      } else if (index < length) {
        throw Error(`Unexpected "${exprI(index)}" at ${index}`);
      }
    }
  }

  // If there's only one expression just try returning the expression
  if (nodes.length === 1) {
    return nodes[0];
  } else {
    return {
      type: COMPOUND,
      body: nodes
    };
  }
}

// To be filled in by the template
Parse.version = '<%= version %>';
Parse.toString = function () {
  return 'JavaScript Expression Parser (JSEP) v' + Parse.version;
};

/** HACKED ON EXTENSION *****************************************************/
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TokenizeToScriptUnit(expr): ScriptUnit {
  const line = expr.trim();
  const unit = [];
  const typeHandlers = {
    'Compound': node => node.body,
    'Literal': node => node.value,
    'Identifier': node => node.name,
    'BinaryExpression': node => `expr{${node.raw}}`,
    'UnaryExpression': node => node.raw
  };

  function processNode(n) {
    const type = n.type;
    const func = typeHandlers[type];
    if (!func) {
      console.warn(`unknown node type '${type}'`, n);
    }
    unit.push(func(n));
  }

  if (!line.length) return unit;
  const cnode = Parse(line);
  // if it's a compound node, body contains an array of expressions
  if (cnode.type === 'Compound') {
    if (!cnode.body) throw Error(`missing 'body' prop in ${cnode.type} node`);
    if (!Array.isArray(cnode.body)) throw Error("'body' prop is not an array");
    cnode.body.forEach((node, index) => processNode(node));
  } else processNode(cnode);

  return unit;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TokenizeToSource(text: string): ScriptUnit[] {
  /* HACK pc line endings would screw this, need more robust check */
  const sourceStrings = text.split('\n');
  const scriptUnits = [];
  sourceStrings.forEach(str => {
    str = str.trim();
    if (str.length) scriptUnits.push(TokenizeToScriptUnit(str));
  });
  return scriptUnits;
}

/// EXPORT ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { Parse, TokenizeToScriptUnit, TokenizeToSource };
