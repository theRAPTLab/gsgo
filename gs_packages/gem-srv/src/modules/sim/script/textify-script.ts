/* eslint-disable @typescript-eslint/dot-notation */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert ScriptUnits to Text

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TScriptUnit, IToken } from 'lib/t-script.d';
import { Blocks } from './gsrc-block-tokenize';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TEXTIFY', 'TagDebug');

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a token, return the text representation of it */
function r_TextifyToken(tok: IToken, indent: number) {
  if (Array.isArray(tok)) {
    // start with
    let text;
    tok.forEach(su => {
      text += r_UnpackStatement(su, indent);
    });
    return text;
  }
  const { token, objref, directive, value, string, comment, program, expr } = tok;
  if (token !== undefined) {
    if (token === '#') return '_pragma';
    return token;
  }
  if (directive) return `${directive}`;
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
/** Given a single statement, extract text representation. Since statements can
 *  include blocks, it may return more than one line.
 */
function r_UnpackStatement(statement: TScriptUnit, indent: number): string {
  // process tokens from left to right, concat to make a line
  const spc = ''.padStart(indent, ' ');
  const nl = `\n${spc}`;
  let line = ''.padStart(indent, ' ');
  if (!Array.isArray(statement)) {
    console.warn('not a statement:', statement);
    return JSON.stringify(statement).padStart(indent, ' ');
  }
  statement.forEach((tok, ii) => {
    // handle nested blocks
    if (Array.isArray(tok)) {
      let block = '';
      tok.forEach((su, jj) => {
        block += r_UnpackStatement(su, indent + 2);
        if (jj < tok.length - 1) block += '\n';
      });
      // put the block with proper indent
      line += `[[\n${block}${nl}]] `;
      return;
    }
    // normal token
    const txt = r_TextifyToken(tok, indent);
    line += txt;
    if (ii !== statement.length - 1) line += ' ';
  });
  return line;
}

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a TScriptUnit[], return text version */
export function TextifyScript(units: TScriptUnit[]): string {
  const text = [];
  let indent = 0;
  units.forEach((unit: TScriptUnit, idx: number) => {
    const lines = r_UnpackStatement(unit, indent);
    text.push(lines);
  });
  return text.join('\n');
}

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestTextifyScript(tests: { [key: string]: any }) {
  console.group(...PR('TEST: TextifyScript'));
  Object.entries(tests).forEach(kv => {
    const [testName, testArgs] = kv;
    // workaround out-of-date typescript compiler that doesn't recognize spread
    const units = JSON.parse(testArgs['expect']);
    const text = TextifyScript(units);
    const expect = testArgs['text'].trim();
    console.log(`%c${text}`, 'padding:4px 6px;background-color:LightYellow');
    console.log(`%c${expect}`, 'padding:4px 6px;background-color:LightCyan');
  });
  console.groupEnd();
}

/// CONSOLE TOOL INSTALL //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool({
  'textify_test': () => {
    console.clear();
    TestTextifyScript(Blocks);
  }
});
// UR.HookPhase('UR/APP_START', () => TestTextifyScript(Blocks));
