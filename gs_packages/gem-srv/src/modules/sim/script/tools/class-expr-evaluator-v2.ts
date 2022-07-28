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
const DBG = false;
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
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  evaluateArray(list, context) {
    return list.map(v => this.evaluate(v, context));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  evaluateMember(node, context) {
    const object = this.evaluate(node.object, context);
    if (node.computed) {
      return [object, object[this.evaluate(node.property, context)]];
    }
    return [object, object[node.property.name]];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  evaluate(node, context) {
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
  }
}

/// STATIC METHODS  //////////////////////////////////////////////////////////'
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const exprEval = new ExpressionEvaluator();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Evaluate(exprAst, context) {
  // try {
  return exprEval.evaluate(exprAst, context);
  // } catch (caught) {
  //   const globalObjs = Object.keys(context).join(',');
  //   const err = `${caught.toString()} w/globals:{${globalObjs}}`;
  //   if (DBG)
  //     console.warn(
  //       `%cEXPR EVALUATE ${err}`,
  //       'color:black;background-color:rgba(0,0,0,0.2);padding:1em',
  //       context
  //     );
  //   // eslint-disable-next-line @typescript-eslint/no-throw-literal
  //   throw err;
  // }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ExpressionEvaluator;
export { Evaluate };
