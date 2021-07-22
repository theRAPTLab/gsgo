/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Script Utility Classes - Work in Progress

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import { TScriptUnit, TOpcode, IToken } from 'lib/t-script.d';
import GScriptTokenizerDBG from 'lib/class-gscript-tokenizer-dbg';

/// CONSTANT & DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PARSER = new GScriptTokenizerDBG();

/// SUPPORT METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_ArgText(tok: IToken, indent: number) {
  if (Array.isArray(tok)) {
    // array of scriptunit arrays
    let line = '[[\n';
    tok.forEach(su => {
      line += m_UnpackUnit(su, indent + 2);
      line += '\n';
    });
    line += ']]';
    return line;
  }
  const { token, objref, directive, value, string, comment, program, expr } = tok;
  if (token !== undefined) {
    if (token === '#') return '_pragma';
    return token;
  }
  if (directive) return `# ${directive}`;
  if (value !== undefined) return value;
  if (string !== undefined) return `"${string}"`;
  if (comment) return `// ${comment}`;
  // special cases
  if (program) return `[[ ${program} ]]`; // { program = string name of stored program }
  if (objref) return objref.join('.');
  if (expr) return `{{ ${expr} }}`; // { expr = string }
  console.warn('unknown argument type:', tok);
  throw Error('unknown argument type');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a scriptunit, extract text representation */
function m_UnpackUnit(unit: TScriptUnit, indent: number): string {
  // process tokens from left to right, concat to make a line
  let line = ''.padStart(indent, ' ');
  if (!Array.isArray(unit)) console.warn('bad unit', unit);
  else
    unit.forEach((tok, idx) => {
      const rar = m_ArgText(tok, indent);
      if (Array.isArray(rar)) {
        line += '[[\n';
        rar.forEach(l => {
          line += ''.padStart(indent, '');
          line += `${l}\n`;
        });
        line += ']] ';
      } else {
        line += `${rar}`;
        if (idx !== unit.length - 1) line += ' ';
      }
    });
  return line;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GScriptToken {
  token: IToken;
  constructor(node) {
    if (typeof node === 'object') this.token = node;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GScriptUnit {
  script = []; // hold script unit, an array of ScriptToken
  constructor(units = []) {
    if (Array.isArray(units)) this.script = units.slice();
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GScript {}

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { GScript, GScriptUnit, GScriptToken };
