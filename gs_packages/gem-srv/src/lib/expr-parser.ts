/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GEMscript Text to ScriptUnits

  Given a GEMscript source string, create a GEMscript TScriptUnit, which is an
  array of arrays of form ['keyword',...args:any]. The source array is used to
  drive the actual compilation into opcodes

  Also includes Expression Parsing through the

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TScriptUnit } from 'lib/t-script';
import GScriptTokenizer from 'lib/class-gscript-tokenizer';
import ExpressionParser from 'lib/class-expr-parser';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PARSER', 'TagRed');
/// NOTE: TOKENIZER and PARSER are not directly related to each other
/// The tokenizer converts GEMscript text source into GEMscript code, which can
/// contain expression strings. The parser creates an AST from the contents of
/// the expression which is evaluated at runtime.
const scriptConverter = new GScriptTokenizer();
const exprParser = new ExpressionParser();

/// PARSER INTERFACE //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** GEMscript Text Tokenizer */
function ConvertScript(scriptText: string) {
  return scriptConverter.tokenize(scriptText);
}
/** Expression Parser */
function ParseExpression(expr: string) {
  return exprParser.parse(expr);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** tokenizes a line of text, returning a ScriptUnit */
function LineToScriptUnit(expr): TScriptUnit {
  const line = expr.trim();
  const unit = [];
  if (!line.length) return ['dbgError', 'empty line'];
  const toks = ConvertScript(line);
  if (toks) unit.push(...toks);
  return unit;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** tokenizes the text line-by-line into ScriptUnit[]
 */
function SourcifyText(text: string): TScriptUnit[] {
  /* HACK pc line endings would screw this, need more robust check */
  const sourceStrings = text.split('\n');
  const scriptUnits = [];
  sourceStrings.forEach(str => {
    str = str.trim();
    const unit = LineToScriptUnit(str);
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
  // got this far? we need to ParseExpression the expression into an ast
  const ex = arg.substring(2, arg.length - 2).trim();
  const ast = ParseExpression(ex);
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
  ParseExpression,
  ConvertScript,
  LineToScriptUnit,
  SourcifyText,
  ExpandArg,
  ExpandScriptUnit
};
