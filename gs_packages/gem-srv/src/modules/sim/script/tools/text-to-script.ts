/* eslint-disable @typescript-eslint/dot-notation */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert text to Script Units Tokens. It does not test the validity of then
  produced tokens.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TScriptUnit } from 'lib/t-script.d';
import GScriptTokenizerDBG from 'script/tools/class-gscript-tokenizer-v2';
import GScriptTokenizer from 'lib/class-gscript-tokenizer';
import { Blocks } from './test-data/td-tokenizer';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TOKENIZE', 'TagDebug');
const gstDBG = new GScriptTokenizerDBG();
const gst = new GScriptTokenizer();

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** giving a text, return the parsed ScriptUnit[] representation */
function TextToScript(text: string): TScriptUnit[] {
  const sourceStrings = text.split('\n');
  return gstDBG.tokenize(sourceStrings);
}

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// the test format is { testName: [ scripttext, jsonscriptunits ] }
function TestScriptifyText(tests: { [key: string]: any }) {
  console.group(...PR('TEST: TextToScript'));
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
    const [pass, printInfo] = UR.ConsoleCompareTexts(result, expect);
    printInfo(`'${testName}'`);
  });
  console.groupEnd();
}

/// CONSOLE TOOL INSTALL //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool({
  'scriptify_test': () => {
    console.clear();
    TestScriptifyText(Blocks);
  },
  'tokenize': (text, spc = 0) => {
    const script = gstDBG.tokenize(text);
    console.log(JSON.stringify(script, null, spc));
    return script;
  }
});
// UR.HookPhase('UR/APP_START', () => TestTokenizeScripts(Blocks));

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { TextToScript };
