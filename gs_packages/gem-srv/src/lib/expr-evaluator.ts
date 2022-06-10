/* eslint-disable @typescript-eslint/no-use-before-define */
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

function evaluateArray(list, context) {
  return list.map(function (v) {
    return evaluate(v, context);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function evaluateMember(node, context) {
  const object = evaluate(node.object, context);
  if (node.computed) {
    return [object, object[evaluate(node.property, context)]];
  }
  return [object, object[node.property.name]];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function evaluate(node, context) {
  try {
    switch (node.type) {
      case 'ArrayExpression':
        return evaluateArray(node.elements, context);
      case 'BinaryExpression':
        return binops[node.operator](
          evaluate(node.left, context),
          evaluate(node.right, context)
        );
      case 'CallExpression': {
        let caller, fn, assign;
        if (node.callee.type === 'MemberExpression') {
          assign = evaluateMember(node.callee, context);
          caller = assign[0];
          fn = assign[1];
        } else {
          fn = evaluate(node.callee, context);
        }
        if (typeof fn !== 'function') {
          return undefined;
        }
        return fn.apply(caller, evaluateArray(node.arguments, context));
      }
      case 'ConditionalExpression':
        return evaluate(node.test, context)
          ? evaluate(node.consequent, context)
          : evaluate(node.alternate, context);

      case 'Identifier':
        return context[node.name];
      case 'Literal':
        return node.value;
      case 'LogicalExpression':
        if (node.operator === '||') {
          return evaluate(node.left, context) || evaluate(node.right, context);
        }
        if (node.operator === '&&') {
          return evaluate(node.left, context) && evaluate(node.right, context);
        }
        return binops[node.operator](
          evaluate(node.left, context),
          evaluate(node.right, context)
        );
      case 'MemberExpression':
        return evaluateMember(node, context)[1];
      case 'ThisExpression':
        return context;
      case 'UnaryExpression':
        return unops[node.operator](evaluate(node.argument, context));
      default:
        return undefined;
    }
  } catch (e) {
    console.log(...PR('current node', node, '\ncontext', context));
    throw e;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { evaluate as Evaluate };
