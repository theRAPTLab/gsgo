/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GEMscript Text to ScriptUnits

  Given a GEMscript source string, create a GEMscript TScriptUnit, which is an
  array of arrays of form ['keyword',...args:any]. The source array is used to
  drive the actual compilation into opcodes

  Also includes Expression Parsing through the

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import ExpressionParser from 'lib/class-expr-parser';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PARSER', 'TagDebug');
/// NOTE: TOKENIZER and PARSER are not directly related to each other
/// The tokenizer converts GEMscript text source into GEMscript code, which can
/// contain expression strings. The parser creates an AST from the contents of
/// the expression which is evaluated at runtime.
const exprParser = new ExpressionParser();

/// EXPRESSION PARSER INTERFACE ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Expression Parser */
function ParseExpression(expr: string) {
  return exprParser.parse(expr);
}

/// EXPORT ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { ParseExpression };
