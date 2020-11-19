/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SourceString to ScriptObject

  Given a GEMscript source string, create a GEMscript TScriptUnit, which is an
  array of arrays of form ['keyword',...args:any]. The source array is used to
  drive the actual compilation into opcodes

  This code is ported from jsep and adapted to produce our desired output
  https://ericsmekens.github.io/jsep/

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { TScriptUnit } from 'lib/t-script';
import ScriptTokenizer from 'lib/class-script-tokenizer';
import ExpressionParser from 'lib/class-expr-parser';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const tokenizer = new ScriptTokenizer();
const parser = new ExpressionParser();

/// PARSER INTERFACE //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Parse(expr: string) {
  return parser.parse(expr);
}
function Tokenize(expr: string) {
  return tokenizer.tokenize(expr);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** uses the parse tree to emit ScriptUnit items, parsing one line */
function TokenizeToScriptUnit(expr): TScriptUnit {
  const line = expr.trim();
  const unit = [];
  if (!line.length) return ['dbgError', 'empty line'];
  const toks = Tokenize(line);
  if (toks) unit.push(...toks);
  return unit;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TokenizeToSource(text: string): TScriptUnit[] {
  /* HACK pc line endings would screw this, need more robust check */
  const sourceStrings = text.split('\n');
  const scriptUnits = [];
  sourceStrings.forEach(str => {
    str = str.trim();
    const unit = TokenizeToScriptUnit(str);
    if (unit.length && unit[0] !== undefined) scriptUnits.push(unit);
  });
  return scriptUnits;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ExpandArg(arg: any): any {
  // don't process anything other than strings
  if (typeof arg !== 'string') return arg;
  if (arg.substring(0, 2) !== '{{') return arg;
  if (arg.substring(arg.length - 2, arg.length) !== '}}') return arg;
  // got this far? we need to parse the expression into an ast
  const ex = arg.substring(2, arg.length - 2).trim();
  const ast = Parse(ex);
  return ast;
}
/** Scan argument list and convert expression to an AST. This is called for
 *  each ScriptUnit line after the keyword
 */
function ExpandScriptUnit(unit: TScriptUnit): TScriptUnit {
  const res: TScriptUnit = unit.map((arg, idx) => {
    // arg is an array of elements in the ScriptUnit
    // skip first arg, which is the keyword
    if (idx === 0) return arg;
    return ExpandArg(arg);
  });
  return res;
}

/// EXPORT ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  Parse,
  Tokenize,
  TokenizeToScriptUnit,
  TokenizeToSource,
  ExpandArg,
  ExpandScriptUnit
};
