/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tests the ScriptText Parser, which is based on jsep and expression parser.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import ScriptTokenizer from 'script/tools/class-gscript-tokenizer-v2';
import TESTS from './jsdata/script-parser-data';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const tokenizer = new ScriptTokenizer({ show: true });

/// TOKENIZER TRIALS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The tokenizer accepts lines of text, and then parses each line character-
 *  by-character to produce tokens. The result are a bunch of arrays of
 *  js primitizes that would be fed to TRANSPILER
 */
function TokenizeTest(testName, test) {
  const cssFail = 'color:white;padding:2px 4px;background-color:Red';
  const cssOK = 'padding:2px 4px;background-color:PaleGreen';
  const cssExpect =
    'color:DarkBlue;font-weight:bold;padding:2px 4px;background-color:LightSkyBlue';

  const { text, expect } = test;
  const lines = text.split('\n');

  const script = tokenizer.tokenize(text);
  const passed = JSON.stringify(expect) === JSON.stringify(script);
  if (passed) console.groupCollapsed(`%cTEST PASSED: '${testName}'`, cssOK);
  else console.groupCollapsed(`%cTEST FAILED: '${testName}'`, cssFail);

  if (passed) {
    console.log('PASSED script===expected');
    console.log('output', JSON.stringify(script, null, 2));
    console.log('expect', JSON.stringify(expect, null, 2));
  } else {
    lines.forEach((line, idx) => {
      const lnum = `${idx + 1}`.padStart(3, '0');
      if (line.trim().length > 0) console.log(`${lnum}: ${line}`);
    });
    console.log('%cFAILED script!==expected', cssFail);
    console.log('%coutput', cssFail, JSON.stringify(script, null, 2));
    console.log('%cexpect', cssExpect, JSON.stringify(expect, null, 2));
  }
  console.groupCollapsed('script source');
  lines.forEach((line, idx) => {
    const lnum = `${idx + 1}`.padStart(3, '0');
    if (line.trim().length > 0) console.log(`${lnum}: ${line}`);
  });
  console.groupEnd();
  console.group('script tokenize');
  tokenizer.tokenize(text, 'show');
  console.groupEnd();
  console.groupEnd();
}

/// RUN TESTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// RUN ALL TESTS
UR.HookPhase('UR/APP_CONFIGURE', () => {
  Object.keys(TESTS).forEach(testName => {
    const test = TESTS[testName];
    TokenizeTest(testName, test);
  });
  /// RUN ONE TEST
  // const testName = 'if-then-else';
  // TokenizeTest(testName, TESTS[testName]);
});

/// CONSOLE TESTS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
