/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test compiler

  *** NEEDS UPDATING ***

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TextToScript, CompileBlueprint } from 'script/transpiler-v2';
import TEST_BPS from 'test/jsdata/script-compiler-data';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('T-COMPILER', 'TagTest');
const TESTNUM = undefined; // undefined for all tests

/// FUNCTIONS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestCompiler(index?: number) {
  const singleTest = typeof index === 'number';
  if (singleTest) console.log(...PR('running test #', index));
  else console.log(...PR('running', TEST_BPS.length, 'tests'));
  TEST_BPS.forEach((test, idx) => {
    if (!singleTest || index === idx) {
      const [desc, text] = test;
      const script = TextToScript(text);
      const bundle = CompileBlueprint(script);
      const lead = `${idx}`.padStart(2, '0');
      if (singleTest) console.group('test', lead, '-', desc);
      else console.groupCollapsed('test', lead, '-', desc);
      console.log(`TEXT:\n${text}`);
      console.log('---\nSCRIPT:');
      script.forEach((unit, unitLine) =>
        console.log(`${unitLine}`.padStart(3, '0'), JSON.stringify(unit))
      );
      console.log('---\nBUNDLE:', bundle);
      console.groupEnd();
    }
  });
}

/// TEST CODE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('UR/APP_CONFIGURE', () => {
  console.log(...PR('Testing Compiler...'));
  TestCompiler(TESTNUM);
});
