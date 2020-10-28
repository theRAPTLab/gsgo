/* eslint-disable no-return-await */
/* eslint-disable one-var */
/* eslint-disable eqeqeq */
/* eslint-disable func-names */
import jsep from 'jsep';

/**
 * Evaluation code from JSEP project, under MIT License.
 * Copyright (c) 2013 Stephen Oney, http://jsep.from.so/
 *
 * Modifications to code for SMC compilation, removed async
 * versions of calls.
 * d.sri seah 2020 for gemstep script compiler
 */

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
  '<<': (a, b) => a << b,
  '>>': (a, b) => a >> b,
  '>>>': (a, b) => a >>> b,
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

function evaluateArray(list, context) {
  return list.map(function (v) {
    return evaluate(v, context);
  });
}

function evaluateMember(node, context) {
  const object = evaluate(node.object, context);
  if (node.computed) {
    return [object, object[evaluate(node.property, context)]];
  }
  return [object, object[node.property.name]];
}

function evaluate(node, context) {
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
}

function compile(expression) {
  return evaluate.bind(null, jsep(expression));
}

// Added functions to inject Custom Unary Operators (and override existing ones)
function addUnaryOp(operator, _function) {
  jsep.addUnaryOp(operator);
  unops[operator] = _function;
}

// Added functions to inject Custom Binary Operators (and override existing ones)
function addBinaryOp(operator, _function, prec?) {
  jsep.addBinaryOp(operator, prec);
  binops[operator] = _function;
}

export { jsep as parse, evaluate as eval, compile, addUnaryOp, addBinaryOp };
