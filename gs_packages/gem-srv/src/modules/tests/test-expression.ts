/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test expression engine and parser to see how it works

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { Evaluate, Compile as FauxCompile } from 'script/script-evaluator';
import { Parse, TokenizeToScriptUnit } from 'script/script-parser';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('EX-EVAL', 'TagDkOrange');
const EX_PARSE = true;
const EX_DECOMPILE = true;

/// MAIN HELPERS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Eval(expr: string, context: {}) {
  const ast = Parse(expr);
  console.log(...PR('AST', ast));
  const val = Evaluate(ast, context);
  console.log(...PR('RETVAL:', val));
  return JSON.stringify(ast);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** note: this is for expression-eval compilation, not GEMscript compilation.
 *  We don't use this except for testing our integration with jsep and the
 *  expression library we grabbed
 */
function Compile(expr: string) {
  const fn = FauxCompile(expr);
  console.log(...PR('FUNCTION', fn));
  return fn; // call with context object
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** print out the results of a parsed line */
function EmitAST(line) {
  const ast = Parse(line);
  console.groupCollapsed(`AST from '${line}'`);
  if (ast.type === 'Compound') {
    ast.body.forEach((node, index) => {
      console.log(index, node);
    });
  } else console.log('Unknown type', ast.type);
  console.groupEnd();
}

/// INTERMEDIATE TESTS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (EX_DECOMPILE) {
  let p = 'setPropValue health 1 + this.pollen; prop "string" 10';
  const source = TokenizeToScriptUnit(p);
  console.log(...PR('decompiled', source));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (EX_PARSE) {
  // this is interpreted as 3: keyword, identifier, expression
  let p = 'setPropValue health 1 + this.pollen';
  EmitAST(p);

  // this is interpreted as 3: keyword,
  p = 'setPropValue alpha 1 + ((this.pollen +1/ 10)) + 1';
  EmitAST(p);

  // this is interpreted as 2: keyword, beta(expression) + 1
  p = 'setPropValue beta ((1 + this.pollen) / 10) + 1';
  EmitAST(p);

  // this is interpreted as 2: beta + expression
  p = 'setPropValue beta +((1 + this.pollen) / 10) + 1';
  EmitAST(p);

  // this is interpreted as 3: prop.foo setTo expr
  p = 'prop foo setTo 1 + this.pollen';
  EmitAST(p);

  // this is interpreted as 3: prop.foo setTo expr
  p = 'prop "count" setTo 1';
  EmitAST(p);
}

/// WINDOW DEBUG //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the evaluated AST result */
(window as any).evalExpr = (expr: string = '', ctx: {}) => {
  return Eval(expr, ctx);
};
/** return the expression function for deferred evaluation */
(window as any).getEvalFunction = (expr: string = '') => {
  return Compile(expr);
};
/** return the AST from the line */
(window as any).getExprAST = (expr: string = '') => {
  return Parse(expr);
};
