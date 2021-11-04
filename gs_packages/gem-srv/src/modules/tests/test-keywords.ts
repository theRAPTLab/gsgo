/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test keywords

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { ScriptifyText, CompileBlueprint } from 'script/transpiler-v2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('KWTEST', 'TagTest');
const TT = [];
const TESTNUM = undefined; // undefined for all tests

/// FUNCTIONS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestKeywords(index?: number) {
  const singleTest = typeof index === 'number';
  if (singleTest) console.log(...PR('running test #', index));
  else console.log(...PR('running', TT.length, 'tests'));
  TT.forEach((test, idx) => {
    if (!singleTest || index === idx) {
      const [desc, text] = test;
      const script = ScriptifyText(text);
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

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'desc: ',
  `
  # BLUEPRINT Bee
  # PROGRAM TEST
  `.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// TEST CODE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TestKeywords(TESTNUM);
