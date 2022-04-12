/* eslint-disable @typescript-eslint/dot-notation */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert ScriptUnits to Text

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TScriptUnit, IToken } from 'lib/t-script.d';
import { Blocks } from './test-data/td-tokenizer';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('TEXTIFY', 'TagDebug');

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a token, return the text representation of it. If it encounters an
 *  array of nested tokens in a 'block' token, it converts those recursively
 */
function TokenToString(tok: IToken, indent: number = 0) {
  const { directive, comment, line } = tok; // meta information
  const { identifier, value, string } = tok; // primitive values
  const { objref, program, block, expr } = tok; // req runtime eval
  // special case: this is a keyword or variable
  if (identifier !== undefined) return identifier;
  // regular tokens
  if (value !== undefined) return value.toString();

  if (string !== undefined) return `"${string}"`;
  if (objref) return objref.join('.');
  if (comment !== undefined) return `// ${comment}`;
  if (block) {
    let lines = '';
    block.forEach((su, ii) => {
      lines += StatementToText(su, indent + 2);
      if (ii < block.length) lines += '\n';
    });
    return `[[\n${lines}${''.padStart(indent, ' ')}]]`;
  }
  if (expr === '') return '{{ ??? }}}'; // happens during live typing
  if (expr) return `{{ ${expr} }}`; // { expr = string }
  if (program === '') return '[[ ??? ]]'; // happens during live typing
  if (program) return `[[ ${program} ]]`; // { program = string name of stored program }
  if (directive) return '#';
  if (line !== undefined) return '';
  console.warn('unknown argument type:', tok);
  throw Error('unknown argument type');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a single statement, extract text representation. Since statements can
 *  include blocks, it may return more than one line.
 */
function StatementToText(statement: TScriptUnit, indent: number = 0): string {
  // process tokens from left to right, concat to make a line
  let line = ''.padStart(indent, ' ');
  if (!Array.isArray(statement)) {
    console.warn('not a statement:', statement);
    return JSON.stringify(statement).padStart(indent, ' ');
  }
  // process each token in the statement, which can contain statements
  // of their own in nested blocks
  statement.forEach((tok, ii) => {
    const txt = TokenToString(tok, indent);
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
    const lines = StatementToText(unit, indent);
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
if (DBG)
  UR.AddConsoleTool({
    'run_textify_tests': () => {
      console.clear();
      TestTextifyScript(Blocks);
    }
  });
// UR.HookPhase('UR/APP_START', () => TestTextifyScript(Blocks));

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { TokenToString, StatementToText, ScriptToText };
