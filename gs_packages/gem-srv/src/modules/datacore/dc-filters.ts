/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FILTERS

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { GetAgentsByType } from './dc-agents';
import { GetFunction } from './dc-programs';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// const PR = UR.PrefixUtil('DCFLTR', 'TagRed');

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
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return agents of type AgentType that pass test
 *  test looks like (agent)=>boolean
 *  FUTURE OPTIMIZATION will cache the results based on key
 */
export function SingleAgentFilter(type: string, testA: string) {
  const agents = GetAgentsByType(type);
  const testFunc = GetFunction(testA);
  ShuffleArray(agents);
  const pass = [];
  const fail = [];
  agents.forEach(agent => {
    if (testFunc(agent)) pass.push(agent);
    else fail.push(agent);
  });
  return [pass, fail];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return pairs of agents the pass testAB
 *  test looks like (agentA, agentB)=>boolean
 */
export function PairAgentFilter(typeA: string, typeB: string, testAB: string) {
  const setA = GetAgentsByType(typeA);
  const setB = GetAgentsByType(typeB);
  const testFunc = GetFunction(testAB);
  ShuffleArray(setA);
  ShuffleArray(setB);
  const pass = [];
  const fail = [];
  setA.forEach(a =>
    setB.forEach(b => {
      if (testFunc(a, b)) pass.push([a, b]);
      else fail.push([a, b]);
    })
  );
  return [pass, fail];
}
