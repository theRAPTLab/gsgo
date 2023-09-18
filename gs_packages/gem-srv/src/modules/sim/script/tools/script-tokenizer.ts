/* eslint-disable @typescript-eslint/dot-notation */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Script Token Utilities

  * Convert Text to ScriptTokens
  * Convert ScriptTokens back to Text

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import GScriptTokenizer, {
  UnpackToken
} from 'script/tools/class-gscript-tokenizer-v2';
import ERROR from 'modules/error-mgr';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const STRTOK = new GScriptTokenizer();
const CR = '\n'; // '\r\n' used by windows

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Given a single statement, extract text representation. Since statements can
 *  include blocks, it may return more than one line.
 */
function StatementToText(statement: TScriptUnit, indent: number = 0): string {
  // process tokens from left to right, concat to make a line
  let line = ''.padStart(indent, ' ');
  if (statement === undefined) return '';
  if (!Array.isArray(statement)) {
    console.warn('not a statement:', statement);
    return JSON.stringify(statement).padStart(indent, ' ');
  }
  // process each token in the statement, which can contain statements
  // of their own in nested blocks
  statement.forEach((tok, ii) => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const txt = TokenToString(tok, indent);
    line += txt;
    if (ii !== statement.length - 1) line += ' ';
  });
  if (line.trim() !== '') return line;
  return '';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given a text, return the parsed ScriptUnit[] representation */
function TextToScript(text: string = ''): TScriptUnit[] {
  // this will throw an error string of '{err} @row:col'
  if (typeof text !== 'string') return [];
  // try {
  const script = STRTOK.tokenize(text.trim());
  return script;
  // } catch (caught) {
  //   ERROR(`could not convert text to script`, {
  //     source: 'tokenizer',
  //     data: {
  //       text
  //     },
  //     where: 'script-tokenizer.TextToScript',
  //     caught
  //   });
  // }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given a string, convert to statemment. Should not be any linefeeds
 *  in the string otherwise might be surprising */
function StringToLineScript(line: string): TScriptUnit {
  const script = TextToScript(line);
  if (script.length === 1) return script[0];
  return undefined;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given a TScriptUnit[], return text version */
function ScriptToText(units: TScriptUnit[]): string {
  const text = [];
  let indent = 0;
  units.forEach((unit: TScriptUnit, idx: number) => {
    const lines = StatementToText(unit, indent);
    text.push(lines);
  });
  return text.join(CR);
}

/// SUPPORT API ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given a token, return the GEMSCRIPT text representation of it. If it
 *  encounters an array of nested tokens in a 'block' token, it converts those
 *  recursively */
function TokenToString(tok: IToken, indent: number = 0) {
  if (tok === undefined) return '';
  const { directive, comment, line } = tok; // meta information
  const { identifier, value, string } = tok; // primitive values
  const { objref, program, block, expr } = tok; // req runtime eval
  const { constant } = tok;
  // special case: this is a keyword or variable
  if (identifier !== undefined) return identifier;
  // regular tokens
  if (value !== undefined) return value.toString();
  if (string !== undefined) return `'${string}'`;
  if (objref) return objref.join('.');
  if (comment !== undefined) return `// ${comment}`;
  if (block) {
    let lines = '';
    block.forEach((su, ii) => {
      lines += StatementToText(su, indent + 2);
      if (ii < block.length) lines += CR;
    });
    return `[[${CR}${lines}${''.padStart(indent, ' ')}]]`;
  }
  if (expr === '') return '{{ ??? }}}'; // happens during live typing
  if (expr) return `{{ ${expr} }}`; // { expr = string }
  if (program === '') return '[[ ??? ]]'; // happens during live typing
  if (program) return `[[ ${program} ]]`; // { program = string name of stored program }
  if (directive) return '#';
  if (line !== undefined) return '';
  if (constant) return `'${constant}'`;
  console.warn('unknown argument type:', tok);
  throw Error('unknown argument type');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: returns an unadorned version of the stringified token */
function TokenToPlainString(tok: IToken) {
  const fn = 'TokenToPlainString:';
  const [, tokValue] = UnpackToken(tok);
  const jsType = typeof tokValue;
  // array of strings?
  if (
    Array.isArray(tokValue) &&
    tokValue.length &&
    typeof tokValue[0] === 'string'
  )
    return tokValue.join('.');
  // any kind of string?
  if (jsType === 'string') return tokValue;
  if (jsType === 'number') return String(tokValue);
  if (jsType === 'boolean') return String(tokValue);
  console.warn(`${fn} token could not be converted to string`, tok);
  return undefined;
}

/// EXPRESSION TOKENIZER //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see export

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// main api
export {
  TextToScript, // convert provided multi-line text to script of TScriptUnit[]
  ScriptToText // convert provided script to multi-line text
};
/// support
export {
  StatementToText, // convert a line of script TScriptUnit to a line of text
  StringToLineScript, // convert a single line string into TScriptUnit
  TokenToString, // convert a token to its GEMSCRIPT text representation
  TokenToPlainString, // convert a token to an unadorned string
  TokenToPlainString as TokenToUnitText // alias
};
/// forward gscript-tokenizer utilities
export * from 'script/tools/class-gscript-tokenizer-v2';
/// forward expression parser
export { ParseExpression } from './class-expr-parser-v2';
