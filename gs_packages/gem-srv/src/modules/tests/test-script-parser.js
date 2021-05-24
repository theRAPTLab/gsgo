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
  const css = 'color:white;padding:2px 4px;background-color:red';
  const nameCSS =
    'color:DarkBlue;font-weight:bold;padding:2px 4px;background-color:LightSkyBlue';
  const { text, tokens } = test;
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
  console.group('tokens');
  if (JSON.stringify(tokens) === JSON.stringify(script)) {
    console.log('PASSED');
  } else {
    console.log('%cFAILED script!==expected tokens', css, script, tokens);
  }
  console.groupEnd();

  console.groupEnd();
  // console.group(...PR('ScriptUnits Decompiled from Nodes'));
  // TRANSPILER.ScriptToConsole(script, lines);
  // console.groupEnd();
}

const TESTS = {
  'if-then': {
    text: `
    if [[
      X
    ]]`,
    tokens: [[{ token: 'if' }, { block: ['[[', 'X', ']]'] }]]
  },
  // test:
  'if-then-else': {
    text: `
    if [[
      Y
    ]] [[
      Z
    ]]
    `,
    tokens: [[{ token: 'if' }, { block: ['[[', 'Y', ']] [[', 'Z', ']]'] }]]
  },
  // test:
  'when[[if-then]]': {
    text: `
    when [[
      if [[
        A
      ]]
    ]]
  `,
    tokens: [{ token: 'when' }, { block: ['if [[', 'if [[', 'A', ']]'] }]
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
    ]]
  `,
    tokens: [[{ token: 'when' }, { block: ['if [[', 'B', ']] [[', 'C', ']]'] }]]
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
