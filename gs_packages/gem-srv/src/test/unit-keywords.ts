/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test keywords - this test doesn't really work

  *** NEEDS UPDATING ***

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import TESTS from 'test/jsdata/keyword-data';
import { TextToScript, CompileBlueprint } from 'script/transpiler-v2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('KWTEST', 'TagTest');
const TESTNUM = undefined; // undefined for all tests

/// FUNCTIONS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestKeywords(index?: number) {
  const singleTest = typeof index === 'number';
  if (singleTest) console.log(...PR('running test #', index));
  else console.log(...PR('running', TESTS.length, 'tests'));
  TESTS.forEach((test, idx) => {
    console.log('test', test);
    if (!singleTest || index === idx) {
      const { desc, text } = test;
      const script = TextToScript(text);
      const bundle = CompileBlueprint(script);

      const lead = `${idx}`.padStart(2, '0');
      if (singleTest) console.group('test', lead, '-', desc);
      else console.groupCollapsed('test', lead, '-', desc);
      console.log(`TEXT:\n${text}`);
      console.log('---\nBUNDLE:', bundle);
      console.log('...execute code here through some exec engine...');
      console.groupEnd();
    }
  });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// TEST CODE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('UR/APP_CONFIGURE', () => {
  console.log(...PR('Testing Keywords...'));
  TestKeywords(TESTNUM);
});
