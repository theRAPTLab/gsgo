/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test expression engine to see how it works

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as EV from 'lib/util-expression';
import parse from 'lib/util-source-parser';

const PR = UR.PrefixUtil('EX-EVAL', 'TagDkOrange');

function Eval(expr: string, context: {}) {
  const ast = EV.parse(expr);
  console.log(...PR('AST', ast));
  const val = EV.eval(ast, context);
  console.log(...PR('RETVAL:', val));
  return JSON.stringify(ast);
}
function Compile(expr: string, context: {}) {
  const fn = EV.compile(expr);
  console.log(...PR('FUNCTION', fn));
  return fn(context);
}

(window as any).xpr = (expr: string = '', ctx: {}) => {
  return Eval(expr, ctx);
};
(window as any).com = (expr: string = '', ctx: {}) => {
  return Compile(expr, ctx);
};
(window as any).parse = (expr: string = '') => {
  return parse(expr);
};
