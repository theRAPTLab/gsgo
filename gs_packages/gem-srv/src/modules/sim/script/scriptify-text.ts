/* eslint-disable @typescript-eslint/dot-notation */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert text to Script Units Tokens. It does not test the validity of then
  produced tokens.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TScriptUnit } from 'lib/t-script.d';
import GScriptTokenizerDBG from 'lib/class-gscript-tokenizer-dbg';
import GScriptTokenizer from 'lib/class-gscript-tokenizer';
import { Blocks } from './gsrc-block-tokenize';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TOKENIZE', 'TagDebug');
const gstDBG = new GScriptTokenizerDBG();
const gst = new GScriptTokenizer();

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** giving a text, return the parsed ScriptUnit[] representation */
export function ScriptifyText(text: string): TScriptUnit[] {
  const sourceStrings = text.split('\n');
  return gstDBG.tokenize(sourceStrings);
}

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// the test format is { testName: [ scripttext, jsonscriptunits ] }
function TestTokenizeScripts(tests: { [key: string]: any }) {
  console.group(...PR('TEST: TokenizeScripts'));
  Object.entries(tests).forEach(kv => {
    const [testName, testArgs] = kv;
    // workaround out-of-date typescript compiler that doesn't recognize spread
    const text = testArgs['text'];
    const expect = testArgs['expect'];
    // const { text, expect } = testArgs;
    //
    const sourceStrings = text.trim().split('\n');
    const su = gstDBG.tokenize(sourceStrings);
    const result = JSON.stringify(su);
    const pass = expect === result;
    const status = `test ${testName}: ${pass ? 'pass' : 'fail'}`;
    if (!pass) {
      console.log(...PR(status!));
      console.log('%cexpect%c', 'color:red', 'color:inherit', expect);
      console.log('%cgotted%c', 'color:red', 'color:inherit', result);
    } else {
      console.log(...PR(status));
      // console.log('%cgotted%c', 'color:red', 'color:inherit', result);
    }
    // const oldstr = JSON.stringify(gst.tokenize(sourceStrings));
    // console.log('%coldscr%c', 'color:brown', 'color:inherit', oldstr);
  });
  console.groupEnd();
}

/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TEST = true;
if (TEST)
  UR.HookPhase('UR/APP_RUN', () => {
    TestTokenizeScripts(Blocks);
  });
