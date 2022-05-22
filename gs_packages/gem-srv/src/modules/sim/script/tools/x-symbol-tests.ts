/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  x-symbols-test

  symbol tokens and validator test suite

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as TRANSPILER from 'script/transpiler-v2';
import { SymbolValidator } from './x-symbol-validator';

const { warn, log, group, groupEnd } = console;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TEST_SCRIPT = `# blueprint test
# TAG isCharControllable false
# PROGRAM DEFINE
useFeature Costume
addProp energyType String 'producer'
addProp energyLevel number 50

# program init
prop energyLevel setTo 0
prop agent.energyLevel setTo 0
prop energyLevel setTo 'foo'
prop energyLevel

# PROGRAM Update
every 1 runAtStart [[
  if {{ energyLevel > 1 }} [[
    prop energyLevel sub 1
  ]] [[
    prop energyLevel setTo 50
  ]]
]]
`.trim();

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestValidate() {
  const fn = 'TestValidate:';
  group(fn);
  const sh = new SymbolValidator('test-validate');
  const script = TRANSPILER.TextToScript(TEST_SCRIPT);
  const bdl = TRANSPILER.BundleBlueprint(script);
  groupEnd();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { TestValidate };
