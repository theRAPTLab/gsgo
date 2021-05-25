/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tests the ScriptText Parser, which is based on jsep and expression parser.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import ScriptTokenizer from '../../lib/class-gscript-tokenizer';
// import * as TRANSPILER from '../sim/script/transpiler';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TOKENIZE TEST', 'TagTest');
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
  const nameCSS =
    'color:DarkBlue;font-weight:bold;padding:2px 4px;background-color:LightSkyBlue';
  const { text, expect } = test;
  const lines = text.split('\n');
  console.group(`%cTEST: '${testName}'`, nameCSS);
  console.group('source');

  lines.forEach((line, idx) => {
    const lnum = `${idx + 1}`.padStart(3, '0');
    if (line.trim().length > 0) console.log(`${lnum}: ${line}`);
  });
  console.groupEnd();
  console.group('parse');
  const script = tokenizer.tokenize(lines, 'show');
  console.groupEnd();
  if (JSON.stringify(expect) === JSON.stringify(script)) {
    console.log('%cPASSED script===expected', cssOK, script, expect);
  } else {
    console.log('%cFAILED script!==expected', cssFail);
    console.log('  parsed as:', JSON.stringify(script));
    console.log('  expected :', JSON.stringify(expect));
  }
  console.groupEnd();
}

/** format of these tests:
 *  'text': is literal scripttext
 *  'expect': is an array of scriptunits, which are themselves arrays
 */
const TESTS = {
  'multiLine': {
    text: `
    K A B C
    if [[
      D
    ]]`,
    expect: [
      [{ 'token': 'K' }, { 'token': 'A' }, { 'token': 'B' }, { 'token': 'C' }],
      [{ 'token': 'if' }, { 'block': ['[[', 'D', ']]'] }]
    ]
  },
  'block': {
    text: `
    [[
      K A B C
      K D E F
    ]]`,
    expect: [[{ block: ['[[', 'K A B C', 'K D E F', ']]'] }]]
  },
  'if-then': {
    text: `
    if [[
      X
    ]]`,
    expect: [[{ token: 'if' }, { block: ['[[', 'X', ']]'] }]]
  },
  // test:
  'if-then-else': {
    text: `
    if [[
      Y
    ]] [[
      Z
    ]]`,
    expect: [[{ token: 'if' }, { block: ['[[', 'Y', ']] [[', 'Z', ']]'] }]]
  },
  // test:
  'when[[if-then]]': {
    text: `
    when [[
      if [[
        A
      ]]
    ]]`,
    expect: [[{ token: 'when' }, { block: ['[[', 'if [[', 'A', ']]', ']]'] }]]
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
    expect: [
      [
        { token: 'when' },
        { block: ['[[', 'if [[', 'B', ']] [[', 'C', ']]', ']]'] }
      ]
    ]
  },
  'beeWhen': {
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
            '[[',
            'ifExpr {{ true }} [[',
            "dbgOut 'true'",
            ']] [[',
            "dbgOut 'false'",
            ']]',
            ']]'
          ]
        }
      ]
    ]
  }
};

/// RUN TESTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Object.keys(TESTS).forEach(testName => {
  const test = TESTS[testName];
  TokenizeTest(testName, test);
});

/// CONSOLE TESTS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
