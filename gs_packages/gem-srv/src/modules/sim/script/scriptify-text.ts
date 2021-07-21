/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert text to Script Units Tokens. It does not test the validity of then
  produced tokens.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TScriptUnit } from 'lib/t-script.d';
import GScriptTokenizerDBG from 'lib/class-gscript-tokenizer-dbg';
import GScriptTokenizer from 'lib/class-gscript-tokenizer';
import { Blocks } from './test-blockscripts';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('COMPILE', 'TagDebug');
const gstDBG = new GScriptTokenizerDBG();
const gst = new GScriptTokenizer();

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// the test format is { testName: [ scripttext, jsonscriptunits ] }
function TestTokenizeScripts(tests) {
  console.group(...PR('TEST: TokenizeScripts'));
  Object.entries(tests).forEach(kv => {
    const [testName, testArray] = kv;
    // const [text, expect] = testArray; // ts parser too old to handle spread
    const text = testArray[0].trim();
    const expect = testArray[1];
    const sourceStrings = text.split('\n');
    const su = gstDBG.tokenize(sourceStrings);
    const result = JSON.stringify(su);
    const pass = expect === result;
    const oldsu = gst.tokenize(sourceStrings);
    const status = `test ${testName}: ${pass ? 'pass' : 'fail'}`;
    if (!pass) {
      console.log(...PR(status!));
      console.log('%cexpect%c', 'color:red', 'color:inherit', expect);
      console.log('%cgotted%c', 'color:red', 'color:inherit', result);
    } else console.log(...PR(status));
    console.log(JSON.stringify(oldsu));
  });
  console.groupEnd();
}

/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('UR/APP_RUN', () => {
  TestTokenizeScripts(Blocks);
});
