/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  when: specifies a condition that runs at a certain time by simloop
  condition: if [test] [consequent] [alternate]

  single set test: average(AgentSet), inside(AgentSet, bound) -> AgentSet
  single set condition: if [condition] [consequent]
  pair set test: touch(AgentSet1, AgentSet2) -> PairSet
  timer condition: elapsed [interval]

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import { GetCharactersByType } from 'modules/datacore';
import { ParseExpression } from 'script/tools/class-expr-parser-v2';
// uses types defined in t-script.d
import { Evaluate } from 'script/tools/class-expr-evaluator-v2';
import ERROR from 'modules/error-mgr';

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Durstenfeld Shuffle (shuffles in-place)
 *  also see:
 *  en.wikipedia.org/wiki/Fisher-Yates_shuffle#The_modern_algorithm
 *  stackoverflow.com/a/12646864/2684520
 *  blog.codinghorror.com/the-danger-of-naivete/
 */
function ShuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(RNG() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/// SET FILTERING /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return agents of type AgentType that pass test
 *  test looks like (agent)=>boolean
 */
function SingleAgentFilter(type, testA) {
  const agents = GetCharactersByType(type);
  ShuffleArray(agents);
  const pass = [];
  const fail = [];
  agents.forEach(agent => {
    if (testA(agent)) pass.push(agent);
    else fail.push(agent);
  });
  return [pass, fail];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return pairs of agents the pass testAB
 *  test looks like (agentA, agentB)=>boolean
 */
function PairAgentFilter(typeA, typeB, testAB) {
  const setA = GetCharactersByType(typeA);
  const setB = GetCharactersByType(typeB);
  ShuffleArray(setA);
  ShuffleArray(setB);
  const pass = [];
  const fail = [];
  setA.forEach(a =>
    setB.forEach(b => {
      if (testAB(a, b)) pass.push([a, b]);
      else fail.push([a, b]);
    })
  );
  return [pass, fail];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a testA function for the passed expression */
function MakeAgentExprTest(exprA) {
  const isAST = typeof exprA === 'object' && exprA.type;
  // try {
  const ast = isAST ? exprA : ParseExpression(exprA);
  return agent => Evaluate(ast, { A: agent });
  // } catch (caught) {
  //   ERROR(`failed to make agent expression ${exprA}`, {
  //     source: 'expression',
  //     data: {
  //       expr: exprA
  //     },
  //     where: 'conditions.MakeAgentExprTest',
  //     caught
  //   });
  // }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a testAB function for the passed expression */
function MakePairAgentExprTest(exprAB) {
  // try {
  const isAST = typeof exprAB === 'object' && exprAB.type;
  const ast = isAST ? exprAB : ParseExpression(exprAB);
  return (a, b) => Evaluate(ast, { A: a, B: b });
  // } catch (caught) {
  //   ERROR(`failed to make pair agent expression test ${exprAB}`, {
  //     source: 'expression',
  //     data: {
  //       expr: exprAB
  //     },
  //     where: 'conditions.MakePairAgentExprTest',
  //     caught
  //   });
  // }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a type, a conditional expression, and tmethods to run after
 *  "do the thing, julee"
 */
function SingleAgentConditional(typeA, exprA, bundle: ISMCBundle) {
  const test = MakeAgentExprTest(exprA);
  const [passed, failed] = SingleAgentFilter(typeA, test);
  const { CONSEQ, ALTER } = bundle;
  if (CONSEQ) passed.forEach(agent => agent.queueUpdate(CONSEQ));
  if (ALTER) failed.forEach(agent => agent.queueUpdate(ALTER));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PairAgentConditional(typeA, typeB, exprAB, bundle: ISMCBundle) {
  const test = MakePairAgentExprTest(exprAB);
  const [passed, failed] = PairAgentFilter(typeA, typeB, test);
  const { CONSEQ, ALTER } = bundle;
  if (CONSEQ) passed.forEach(agent => agent.queueUpdate(CONSEQ));
  if (ALTER) failed.forEach(agent => agent.queueUpdate(ALTER));
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SingleAgentFilter, PairAgentFilter, ShuffleArray };
export { SingleAgentConditional, PairAgentConditional };
export { MakeAgentExprTest, MakePairAgentExprTest };
