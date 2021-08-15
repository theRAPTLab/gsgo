/* eslint-disable @typescript-eslint/dot-notation */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert ScriptUnits to Text

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TScriptUnit, IToken } from 'lib/t-script.d';
import { Blocks } from './test-data/td-tokenizer';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TEXTIFY', 'TagDebug');

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a token, return the text representation of it */
function r_TextifyToken(tok: IToken, indent: number) {
  const { directive, comment, line } = tok; // meta information
  const { token, value, string } = tok; // primitive values
  const { objref, program, block, expr } = tok; // req runtime eval
  // special case
  if (token !== undefined) {
    return token;
  }
  // regular tokens
  if (value !== undefined) return value;
  if (string !== undefined) return `"${string}"`;
  if (objref) return objref.join('.');
  if (comment !== undefined) return `// ${comment}`;
  if (block) {
    let lines = '';
    block.forEach((su, ii) => {
      lines += r_UnpackStatement(su, indent + 2);
      if (ii < block.length) lines += '\n';
    });
    return `[[\n${lines}${''.padStart(indent, ' ')}]]`;
  }
  if (expr) return `{{ ${expr} }}`; // { expr = string }
  if (program) return `[[ ${program} ]]`; // { program = string name of stored program }
  if (directive) return '#';
  if (line !== undefined) return `${line}`;
  console.warn('unknown argument type:', tok);
  throw Error('unknown argument type');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a single statement, extract text representation. Since statements can
 *  include blocks, it may return more than one line.
 */
function r_UnpackStatement(statement: TScriptUnit, indent: number): string {
  // process tokens from left to right, concat to make a line
  let line = ''.padStart(indent, ' ');
  if (!Array.isArray(statement)) {
    console.warn('not a statement:', statement);
    return JSON.stringify(statement).padStart(indent, ' ');
  }
  statement.forEach((tok, ii) => {
    const txt = r_TextifyToken(tok, indent);
    line += txt;
    if (ii !== statement.length - 1) line += ' ';
  });
  if (line.trim() !== '') return line;
  return '';
}

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a TScriptUnit[], return text version */
function ScriptToText(units: TScriptUnit[]): string {
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
  console.group(...PR('TEST: ScriptToText'));
  Object.entries(tests).forEach(kv => {
    const [testName, testArgs] = kv;
    // workaround out-of-date typescript compiler that doesn't recognize spread
    const units = JSON.parse(testArgs['expect']);
    const text = ScriptToText(units).trim();
    const expect = testArgs['text'].trim();
    const [pass, printInfo] = UR.ConsoleCompareTexts(text, expect);
    if (!pass) {
      console.group(...PR(`${testName} comparison failed`));
      printInfo(testName);
      console.groupEnd();
    } else {
      printInfo(testName);
    }
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

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { ScriptToText };
