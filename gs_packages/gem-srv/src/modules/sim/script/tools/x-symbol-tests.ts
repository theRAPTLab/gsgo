/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  x-symbols-test

  symbol tokens and validator test suite

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Bundle from 'lib/class-sm-bundle';
import * as TRANSPILER from 'script/transpiler-v2';
import * as PROJ_v2 from 'modules/datacore/dc-project-v2';
import { DEV_PRJID, DEV_BPID } from 'config/gem-settings';
import { SymbolValidator } from './x-symbol-validator';

const { warn, log, group, groupEnd } = console;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const USE_TEST_SCRIPT = false;
const TEST_SCRIPT = `# blueprint TestAgentInternal
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

/// TEST SUPPORT METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetTestScript() {
  if (USE_TEST_SCRIPT) return TRANSPILER.TextToScript(TEST_SCRIPT);
  const bp = PROJ_v2.GetProjectBlueprint(DEV_PRJID, DEV_BPID);
  const { scriptText } = bp;
  return TRANSPILER.TextToScript(scriptText);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetFirstErrorInfo(vTokens) {
  for (let i = 0; i < vTokens.length; i++) {
    const vtok = vTokens[i];
    if (vtok.error) return vtok.error.info;
  }
  return '';
}

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestValidate() {
  const fn = 'TestValidate:';

  group(fn);
  const script = m_GetTestScript();
  // GENERATE A BUNDLE that does not get saved into the
  let bdl: SM_Bundle = new SM_Bundle('test-validate');
  bdl = TRANSPILER.SymbolizeBlueprint(script, bdl);
  bdl = TRANSPILER.CompileBlueprint(script, bdl);
  const { name, symbols } = bdl;
  log(`compiled ${name}, got symbols`, symbols);

  // validate all the lines
  const [script_page] = TRANSPILER.ScriptToLines(script);
  const VALID_PAGE = [];
  //
  // validate script line by line
  //
  script_page.forEach((line, num) => {
    const { lineScript, globalRefs } = line;
    const vtoks = TRANSPILER.ValidateStatement(lineScript, {
      bundle: bdl,
      globals: globalRefs
    });
    //
    VALID_PAGE.push(vtoks);
    //
    // print scriptText lines with errors
    //
    const index = num.toString().padStart(2, '0');
    const errText = m_GetFirstErrorInfo(vtoks.validationTokens);
    const scriptText = TRANSPILER.ScriptToText([lineScript]);
    if (errText) {
      let out = `${index} %c${scriptText}%c`;
      let c1 = 'color:black;font-weight:bold;';
      let c2 = 'color:rgba(0,0,0,0.5);font-style:italic';
      if (errText) {
        out += `\n${errText}`;
        c1 = 'color:rgba(255,0,0,0.5)';
      }
      log(out, c1, c2);
    }
  });
  //
  // RESULT
  // VALID_PAGE is an array of validation token arrays
  //
  const sh = new SymbolValidator('test-validate');

  groupEnd();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { TestValidate };
