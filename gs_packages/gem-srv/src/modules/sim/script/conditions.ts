/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  when: specifies a condition that runs at a certain time by simloop
  condition: if [test] [consequent] [alternate]

  single set test: average(AgentSet), inside(AgentSet, bound) -> AgentSet
  single set condition: if [condition] [consequent]
  pair set test: touch(AgentSet1, AgentSet2) -> PairSet
  timer condition: elapsed [interval]

  This stuff has been moved into runtime-datacore

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { GetAgentsByType } from 'modules/datacore';
import { ParseExpression } from 'lib/expr-parser';
import { ISMCBundle } from 'lib/t-script';
import { Evaluate } from 'lib/expr-evaluator';

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
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/// SET FILTERING /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return agents of type AgentType that pass test
 *  test looks like (agent)=>boolean
 */
function SingleAgentFilter(type, testA) {
  const agents = GetAgentsByType(type);
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
  const setA = GetAgentsByType(typeA);
  const setB = GetAgentsByType(typeB);
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
  const ast = isAST ? exprA : ParseExpression(exprA);
  return agent => Evaluate(ast, { A: agent });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a testAB function for the passed expression */
function MakePairAgentExprTest(exprAB) {
  const isAST = typeof exprAB === 'object' && exprAB.type;
  const ast = isAST ? exprAB : ParseExpression(exprAB);
  return (a, b) => Evaluate(ast, { A: a, B: b });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a type, a conditional expression, and tmethods to run after
 *  "do the thing, julee"
 */
function SingleAgentConditional(typeA, exprA, bundle: ISMCBundle) {
  const test = MakeAgentExprTest(exprA);
  const [passed, failed] = SingleAgentFilter(typeA, test);
  const { conseq, alter } = bundle;
  if (conseq) passed.forEach(agent => agent.queueUpdate(conseq));
  if (alter) failed.forEach(agent => agent.queueUpdate(alter));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PairAgentConditional(typeA, typeB, exprAB, bundle: ISMCBundle) {
  const test = MakePairAgentExprTest(exprAB);
  const [passed, failed] = PairAgentFilter(typeA, typeB, test);
  const { conseq, alter } = bundle;
  if (conseq) passed.forEach(agent => agent.queueUpdate(conseq));
  if (alter) failed.forEach(agent => agent.queueUpdate(alter));
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SingleAgentFilter, PairAgentFilter, ShuffleArray };
export { SingleAgentConditional, PairAgentConditional };
export { MakeAgentExprTest, MakePairAgentExprTest };
