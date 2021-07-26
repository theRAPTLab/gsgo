/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tests the ScriptText Parser, which is based on jsep and expression parser.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import ScriptTokenizer from '../../lib/class-gscript-tokenizer-dbg';
// import * as TRANSPILER from '../sim/script/transpiler';

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

  const script = tokenizer.tokenize(lines);
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
  tokenizer.tokenize(lines, 'show');
  console.groupEnd();
  console.groupEnd();
}

/** format of these tests:
 *  'text': is literal scripttext
 *  'expect': is an array of scriptunits, which are themselves arrays
 */
const TESTS = {
  'inline-block': {
    text: `
    K [[ NAME ]] [[
      A
    ]]`,
    expect: [[{ 'token': 'K' }, { 'program': 'NAME' }, { 'block': ['A'] }]]
  },
  'multiLine': {
    text: `
    K A B C
    if [[
      D
    ]]`,
    expect: [
      [{ 'token': 'K' }, { 'token': 'A' }, { 'token': 'B' }, { 'token': 'C' }],
      [{ 'token': 'if' }, { 'block': ['D'] }]
    ]
  },
  'block': {
    text: `
    [[
      K A B C
      K D E F
    ]]`,
    expect: [[{ block: ['K A B C', 'K D E F'] }]]
  },
  'if-then': {
    text: `
    if [[
      X
    ]]`,
    expect: [[{ token: 'if' }, { block: ['X'] }]]
  },
  // test:
  'if-then-else': {
    text: `
    if [[
      Y
    ]] [[
      Z
    ]]`,
    expect: [[{ token: 'if' }, { block: ['Y'] }, { block: ['Z'] }]]
  },
  // test:
  'when[[if-then]]': {
    text: `
    when [[
      if [[
        A
      ]]
    ]]`,
    expect: [[{ token: 'when' }, { block: ['if [[', 'A', ']]'] }]]
  },
  // test:
  'when[[if-then-else]]': {
    text: `
    when [[
      if [[
        B
      ]] [[
        C
      ]]
    ]]`,
    expect: [[{ token: 'when' }, { block: ['if [[', 'B', ']] [[', 'C', ']]'] }]]
  },
  'bee-when-ifexpr': {
    text: `
    when Bee touches Bee [[
      ifExpr {{ true }} [[
        dbgOut 'true'
      ]] [[
        dbgOut 'false'
      ]]
    ]]`,
    expect: [
      [
        { 'token': 'when' },
        { 'token': 'Bee' },
        { 'token': 'touches' },
        { 'token': 'Bee' },
        {
          'block': [
            'ifExpr {{ true }} [[',
            "dbgOut 'true'",
            ']] [[',
            "dbgOut 'false'",
            ']]'
          ]
        }
      ]
    ]
  }
};

/// RUN TESTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// RUN ALL TESTS
Object.keys(TESTS).forEach(testName => {
  const test = TESTS[testName];
  TokenizeTest(testName, test);
});
/// RUN ONE TEST
// const testName = 'if-then-else';
// TokenizeTest(testName, TESTS[testName]);

/// CONSOLE TESTS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
