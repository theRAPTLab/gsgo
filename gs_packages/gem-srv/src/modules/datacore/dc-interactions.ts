/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  INTERACTIONS

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import { GetAgentsByType } from './dc-agents';
import { GetFunction } from './dc-named-methods';

/// INTERACTION UPDATE TESTS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const INTERACTION_CACHE = new Map<
  string,
  {
    singleTestArgs?: Array<any>;
    pairTestArgs?: Array<any>;
    passed: Array<any>; // agents (single) or arrays of agents (pairs)
  }
>();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_MakeInteractionKey(args: any[]): string {
  return args.join('|');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** used by when keyword to register a new test to run with a specific set
 *  of parameters, if it doesn't already exist. Returns the generated key
 *  so runtime code can request the passing agents
 */
export function RegisterSingleInteraction(testArgs: any[]) {
  const key = m_MakeInteractionKey(testArgs);
  if (!INTERACTION_CACHE.has(key)) {
    INTERACTION_CACHE.set(key, {
      singleTestArgs: testArgs,
      passed: []
    });
  }
  return key;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RegisterPairInteraction(testArgs: any[]) {
  const key = m_MakeInteractionKey(testArgs);
  if (!INTERACTION_CACHE.has(key)) {
    INTERACTION_CACHE.set(key, {
      pairTestArgs: testArgs,
      passed: []
    });
  }
  return key;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetInteractionResults(key: string): Array<any> {
  const cn = INTERACTION_CACHE.get(key);
  if (cn === undefined) return [];
  return cn.passed;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetAllInteractions() {
  const conditions = INTERACTION_CACHE.values();
  return conditions; // iterator of entries
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function DeleteAllInteractions() {
  INTERACTION_CACHE.clear();
}

/// SET FILTERING /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Durstenfeld Shuffle (shuffles in-place)
 *  also see:
 *  en.wikipedia.org/wiki/Fisher-Yates_shuffle#The_modern_algorithm
 *  stackoverflow.com/a/12646864/2684520
 *  blog.codinghorror.com/the-danger-of-naivete/
 */
export function ShuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(RNG() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return agents of type AgentType that pass test
 *  test looks like (agent)=>boolean
 *  FUTURE OPTIMIZATION will cache the results based on key
 */
export function SingleAgentFilter(type: string, testA: string, ...args: any) {
  const agents = GetAgentsByType(type);
  const testFunc = GetFunction(testA);
  ShuffleArray(agents);
  const pass = [];
  const fail = [];
  agents.forEach(agent => {
    if (testFunc(agent, ...args)) pass.push(agent);
    else fail.push(agent);
  });
  return [pass, fail];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return pairs of agents the pass testAB
 *  test looks like (agentA, agentB)=>boolean
 */
export function PairAgentFilter(
  A: string,
  testAB: string,
  B: string,
  ...args: any
) {
  const setA = GetAgentsByType(A);
  const setB = GetAgentsByType(B);
  const testFunc = GetFunction(testAB);
  ShuffleArray(setA);
  ShuffleArray(setB);
  const pass = [];
  const fail = [];
  setA.forEach(a =>
    setB.forEach(b => {
      if (testFunc(a, b, ...args)) pass.push([a, b]);
      else fail.push([a, b]);
    })
  );
  return [pass, fail];
}
