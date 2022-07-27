/* eslint-disable no-return-await */
/* eslint-disable one-var */
/* eslint-disable eqeqeq */
/* eslint-disable func-names */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Evaluates an AST produced by JSEP for GEMSCRIPT, returning result.
  Main export is Evalute( AST, CONTEXT ), where CONTEXT is an object
  with keys corresponding to the identifiers in the AST.

  CREDITS
  based on expression-engine by York Yao https://yorkyao.com
  repo https://github.com/plantain-00/expression-engine
  - includes -
  Evaluation code from JSEP project, under MIT License.
  Copyright (c) 2013 Stephen Oney, http://jsep.from.so/

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('EVAL', 'TagDebug');
const binops = {
  '||': (a, b) => a || b,
  '&&': (a, b) => a && b,
  '|': (a, b) => a | b,
  '^': (a, b) => a ^ b,
  '&': (a, b) => a & b,
  '==': (a, b) => a == b,
  '!=': (a, b) => a != b,
  '===': (a, b) => a === b,
  '!==': (a, b) => a !== b,
  '<': (a, b) => a < b,
  '>': (a, b) => a > b,
  '<=': (a, b) => a <= b,
  '>=': (a, b) => a >= b,
  /* HACK disable because we use << >> for block delimiters */
  // '<<': (a, b) => a << b,
  // '>>': (a, b) => a >> b,
  // '>>>': (a, b) => a >>> b,
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '%': (a, b) => a % b
};
const unops = {
  '-': a => -a,
  '+': a => +a,
  '~': a => ~a,
  '!': a => !a
};

/// EVALUATOR FUNCTIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// evaluate() is the main entry point
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ExpressionEvaluator {
  evaluate(node, context) {
    try {
      switch (node.type) {
        case 'ArrayExpression':
          return this.evaluateArray(node.elements, context);
        case 'BinaryExpression':
          return binops[node.operator](
            this.evaluate(node.left, context),
            this.evaluate(node.right, context)
          );
        case 'CallExpression': {
          let caller, fn, assign;
          if (node.callee.type === 'MemberExpression') {
            assign = this.evaluateMember(node.callee, context);
            caller = assign[0];
            fn = assign[1];
          } else {
            fn = this.evaluate(node.callee, context);
          }
          if (typeof fn !== 'function') {
            return undefined;
          }
          return fn.apply(caller, this.evaluateArray(node.arguments, context));
        }
        case 'ConditionalExpression':
          return this.evaluate(node.test, context)
            ? this.evaluate(node.consequent, context)
            : this.evaluate(node.alternate, context);

        case 'Identifier':
          return context[node.name];
        case 'Literal':
          return node.value;
        case 'LogicalExpression':
          if (node.operator === '||') {
            return (
              this.evaluate(node.left, context) ||
              this.evaluate(node.right, context)
            );
          }
          if (node.operator === '&&') {
            return (
              this.evaluate(node.left, context) &&
              this.evaluate(node.right, context)
            );
          }
          return binops[node.operator](
            this.evaluate(node.left, context),
            this.evaluate(node.right, context)
          );
        case 'MemberExpression':
          return this.evaluateMember(node, context)[1];
        case 'ThisExpression':
          return context;
        case 'UnaryExpression':
          return unops[node.operator](this.evaluate(node.argument, context));
        default:
          return undefined;
      }
    } catch (e) {
      console.log(...PR('current node', node, '\ncontext', context));
      throw e;
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  evaluateArray(list, context) {
    return list.map(function (v) {
      return this.evaluate(v, context);
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  evaluateMember(node, context) {
    const object = this.evaluate(node.object, context);
    if (node.computed) {
      return [object, object[this.evaluate(node.property, context)]];
    }
    return [object, object[node.property.name]];
  }
}

/// STATIC METHODS  //////////////////////////////////////////////////////////'
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const exprEval = new ExpressionEvaluator();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Evaluate(expr, context) {
  const err = `Do not use 'class-expr-evaluator-v2' use lib/expr-evaluator instead`;
  console.warn(`%c${err}`, 'color:red;background-color:yellow;padding:1em');
  throw Error(`${fn} ${err}`);
  return exprEval.parse(expr, context);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ExpressionEvaluator;
export { Evaluate };
