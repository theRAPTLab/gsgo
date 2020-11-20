/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tests the new class ExpressionParser against the original parser in jsep.
  They both return an AST that Evaluate can work with, and they should
  resolve to the same value. Check the console output for the test results.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import ExpressionParser from 'lib/class-expr-parser';
import ScriptTokenizer from 'lib/class-script-tokenizer';
import parse from 'jsep';
import { Evaluate } from 'script/script-evaluator';
import { LineToScriptUnit } from 'script/script-parser';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PARSER TEST', 'TagDkRed');
const gobbler = new ExpressionParser();
const tokenizer = new ScriptTokenizer();

/// COMPARE EXPRESSION PARSERS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ctx = {
  agent: { name: 'Sri', luck: () => 'lucky' },
  makeName: (...args) => args.join(''),
  a: 1,
  b: 2,
  Math
};
const exprs = [
  // [ expression, expected ]
  ['1 + 1', 2],
  ['1 + 2 * 3', 7],
  ['1 + 12 / (3*4)', 2],
  ['a + 5 * b', 11],
  ['agent.name + "Foo"', 'SriFoo'],
  ['agent.name()', undefined],
  ['makeName("Fish",2,3)', 'Fish23'],
  ['agent.luck()', 'lucky'],
  ['Math.abs(0-12)-1', 11],
  ['agent.name=="Sri"', true],
  ['1+2 == 4', false],
  ['a+b+10 === 0', false]
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** test whether the output of ScriptGobbler matches that of the original
 *  jsep package (loaded as parse)
 */
function GobblerTest() {
  console.log(...PR('EXPRESSION PARSE TEST w/CONTEXT:\n', ctx));
  exprs.forEach((entry, idx) => {
    const [expr, answer] = entry;
    let out = `${String(idx).padStart(2, '0')}`;
    out += `: ${expr} == ${answer}`;
    const ast1 = parse(expr);
    const ast2 = gobbler.parse(expr);
    const res1 = Evaluate(ast1, ctx);
    const res2 = Evaluate(ast2, ctx);
    const pass1 = res1 === answer;
    const pass2 = res2 === answer;
    out += pass1
      ? ' / OK!'
      : `\n    result1:${res1} expect:${answer} match:${res1 === answer}`;
    out += pass2
      ? ' OK!\n'
      : `\n    result2:${res2} expect:${answer} match:${res2 === answer}`;
    if (pass1 && pass2) console.log(out);
    else console.log(...PR('TEST FAILED\n', out));
  });
}

/// TOKENIZER TRIALS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TokenizeTest(str) {
  const nodes = tokenizer.tokenize(str);
  console.log(...PR(`TokenizeTest\n${str}`), nodes);
}

/// RUN TESTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TokenizeTest(`defTemplate "French's Fried Potatoes" {{12+3/agent.pi}} 'Agent'`);
GobblerTest();
