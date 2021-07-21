/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert text to Script Units Tokens. It does not test the validity of then
  produced tokens.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TScriptUnit } from 'lib/t-script.d';
import GScriptTokenizer from 'lib/class-gscript-tokenizer-dbg';
import { Blocks } from './test-blockscripts';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('COMPILE', 'TagDebug');
const scriptifier = new GScriptTokenizer();

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a text with multiline blocks, emit an array of strings corresponding
 *  to regular strings and [[ ]] demarked lines. The output nodes are processed
 *  back into a single line with m_StitchifyBlocks(). Returns an array of
 *  string arrays.
 */
// REVIEW: This is current duplicated in class-keyword
//         Should this be moved there?
export function ScriptifyText(text: string): TScriptUnit[] {
  if (text === undefined) return [];
  // (1) first get top-level tokens with possible blocks
  const sourceStrings = text.split('\n');
  const topUnits = scriptifier.tokenize(sourceStrings);
  // this is an array of arrays, corresponding to lines
  // process each line of units, replacing { block } with array of units
  function r_expand(units: TScriptUnit[]) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return units.map(unit => r_inflateToken(unit));
  }
  function r_inflateToken(rawUnit: TScriptUnit) {
    return rawUnit.map(token => {
      const { block } = token;
      if (block === undefined) {
        return token;
      }
      const units = scriptifier.tokenize(block);
      return units;
    });
  }
  return r_expand(topUnits);
}

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// the test format is { testName: [ scripttext, jsonscriptunits ] }
function TestTokenizeScripts(tests) {
  console.group(...PR('TEST: TokenizeScripts'));
  Object.entries(tests).forEach(kv => {
    const [testName, testArray] = kv;
    // const [text, expect] = testArray; // ts parser too old to handle spread
    const text = testArray[0];
    const expect = testArray[1];
    const su = ScriptifyText(text);
    const result = JSON.stringify(su);
    const pass = expect === result;
    const status = `test ${testName}: ${pass ? 'pass' : 'fail'}`;
    if (!pass) {
      console.log(...PR(status!));
      console.log('%cexpect%c', 'color:red', 'color:inherit', expect);
      console.log('%cgotted%c', 'color:red', 'color:inherit', result);
    } else console.log(...PR(status));
  });
  console.groupEnd();
}

/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('UR/APP_RUN', () => {
  TestTokenizeScripts(Blocks);
});
