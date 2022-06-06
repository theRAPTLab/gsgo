/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  x-symbols-test

  symbol tokens and validator test suite

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Bundle from 'lib/class-sm-bundle';
import * as TRANSPILER from 'script/transpiler-v2';
import * as PROJ_v2 from 'modules/datacore/dc-project-v2';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import { ENABLE_SYMBOL_TEST_BLUEPRINT } from 'modules/datacore/dc-constants';
import { DEV_PRJID, DEV_BPID } from 'config/gem-settings';
import TEST_SCRIPT from 'test/gemscript/gui-wizard-slots.gemscript';

const { warn, log, table, group, groupCollapsed, groupEnd } = console;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const USE_TEST_SCRIPT = ENABLE_SYMBOL_TEST_BLUEPRINT;

/// TEST SUPPORT METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetCurrentScriptTokens() {
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
function GetTestScriptText() {
  if (USE_TEST_SCRIPT) return TEST_SCRIPT;
  // else
  const bp = PROJ_v2.GetProjectBlueprint(DEV_PRJID, DEV_BPID);
  const { scriptText } = bp;
  return scriptText;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestValidate() {
  const fn = 'TestValidate:';
  const mode = USE_TEST_SCRIPT ? 'internal test bp' : `${DEV_PRJID}/${DEV_BPID}`;

  groupCollapsed(fn, mode);
  const script = m_GetCurrentScriptTokens();
  // GENERATE A BUNDLE that does not get saved into the
  let bdl: SM_Bundle = new SM_Bundle('test-validate');
  bdl = TRANSPILER.SymbolizeBlueprint(script, bdl);
  bdl = TRANSPILER.CompileBlueprint(script, bdl);
  const { name, symbols } = bdl;
  log(
    `%ccompiled ${name}, got symbols`,
    'font-style:italic;color:maroon',
    symbols
  );

  // validate all the lines
  const [script_page] = TRANSPILER.ScriptToLines(script);
  const VALID_PAGE = [];
  //
  // validate script line by line
  //
  script_page.forEach((line, num) => {
    num = CHECK.OffsetLineNum(num);
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
  groupEnd();
  //
  // RESULT
  // VALID_PAGE is an array of validation token arrays
  //
  const testLines = [
    'prop',
    'prop energyLevel',
    'prop energyLevel setTo',
    'prop energyLevel setTo 0',
    'prop energyLevel setTo 0 a b c',
    'poop energyLevel into bucket',
    'prop bucketCount',
    'prop bucketCount divideBy "fish"',
    'prop energyLevel setTo "banana"',
    'prop energyLevel setTo energyLevel',
    'prop energyLevel divideBy 200',
    'prop energyLevel setTo bananaEnergy'
  ];

  groupCollapsed(fn, 'Testing special casesVALIDATE LINE SCRIPTS');
  log(`%cusing bundle '${bdl.name}'`, 'font-style:italic;color:maroon');
  type Slot = {
    expectedType: TGSArg;
    viewState: `${'valid'} | ${'empty'} | ${'invalid'}| ${'unexpected'} | ${'vague'}`;
    unitText: string;
    dataSelectKey: number;
  };

  testLines.forEach((line, testNum) => {
    const { validationTokens } = TRANSPILER.ValidateLineText(line, bdl);

    const ut = [];
    const gs = [];
    const vs = [];
    const dsk = [];
    let errInfo = '';

    validationTokens.forEach((valTok, index) => {
      const dataSelectKey = CHECK.OffsetLineNum(index);
      const { gsType, unitText, error } = valTok;
      let viewState = 'valid';
      if (error) {
        viewState = error.code;
        if (!errInfo) errInfo = ` - error at tok[${index}]\n   ${error.info}`;
      }
      ut.push(unitText);
      gs.push(gsType);
      vs.push(viewState);
      dsk.push(dataSelectKey);
    });

    const resultcss = errInfo
      ? 'color:red;font-weight:bold'
      : 'color:black;font-weight:bold';
    const errcss = 'color:maroon;font-weight:normal';
    const normcss = 'font-weight:normal;color:gray';
    const prefix = `${testNum}`.padStart(2, '0');
    groupCollapsed(
      `%c${prefix} %c${line}%c${errInfo}`,
      normcss,
      resultcss,
      errcss
    );
    table({
      unitText: ut,
      gsType: gs,
      viewState: vs,
      dataKey: dsk
    });
    groupEnd();
  });

  groupEnd();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { GetTestScriptText, TestValidate };
