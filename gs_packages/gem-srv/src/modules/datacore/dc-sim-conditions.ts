/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DATACORE SIM CONDITIONS

  Used in `when` clauses, interaction code runs outside of the individual
  agent blueprints to perform both single and paired 'tests" which
  produce a list of agent instances that passed the test. It is part of
  the script engine's runtime state.

  This is a complicated module; it's not intended for use by non-expert
  users of GEMSTEP.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import * as DCAGENTS from './dc-sim-agents';
import * as SIMDATA from './dc-sim-data';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type TestResultsCache = {
  singleTestArgs?: Array<any>;
  pairTestArgs?: Array<any>;
  passed: Array<any>; // agents (single) or arrays of agents (pairs)
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INTERACTION_CACHE = new Map<string, TestResultsCache>();

/// UTILTIES //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MakeInteractionKey(args: any[]): string {
  return args.join('|');
}

/// REGISTER REQUEST FOR TEST RESULTS /////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** used by when keyword to register a new test to run with a specific set
 *  of parameters, if it doesn't already exist. Returns the generated key
 *  so runtime code can request the passing agents */
function RegisterSingleInteraction(testArgs: any[]) {
  const key = MakeInteractionKey(testArgs);
  if (!INTERACTION_CACHE.has(key)) {
    INTERACTION_CACHE.set(key, {
      singleTestArgs: testArgs,
      passed: []
    });
  }
  return key;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** similar to RegisterSingleInteraction */
function RegisterPairInteraction(testArgs: any[]) {
  const key = MakeInteractionKey(testArgs);
  if (!INTERACTION_CACHE.has(key)) {
    INTERACTION_CACHE.set(key, {
      pairTestArgs: testArgs,
      passed: []
    });
  }
  return key;
}

/// REQUEST RESULTS OF TEST ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetInteractionResults(key: string): Array<any> {
  const cn = INTERACTION_CACHE.get(key);
  if (cn === undefined) return [];
  return cn.passed;
}

/// DICTIONARY ACCESS OR CLEAR ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetAllInteractions() {
  const conditions = INTERACTION_CACHE.values();
  return conditions; // iterator of entries
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DeleteAllInteractions() {
  INTERACTION_CACHE.clear();
}

/// SET FILTERING /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** To ensure that simulation objects are not always processed in order of
 *  definition, which would introduce undesirable simulation biases!
 *
 *  algorithm: Durstenfeld Shuffle (shuffles in-place)
 *  - en.wikipedia.org/wiki/Fisher-Yates_shuffle#The_modern_algorithm
 *  - stackoverflow.com/a/12646864/2684520
 *  - blog.codinghorror.com/the-danger-of-naivete/
 */
function ShuffleArray(array) {
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
function SingleAgentFilter(type: string, testA: string, ...args: any) {
  const agents = DCAGENTS.GetAgentsByType(type);
  const testFunc = SIMDATA.GetWhenTest(testA);
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
function PairAgentFilter(A: string, testAB: string, B: string, ...args: any) {
  const setA = DCAGENTS.GetAgentsByType(A);
  const setB = DCAGENTS.GetAgentsByType(B);
  const testFunc = SIMDATA.GetWhenTest(testAB);
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

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  MakeInteractionKey,
  //
  RegisterSingleInteraction,
  RegisterPairInteraction,
  //
  GetInteractionResults,
  //
  GetAllInteractions,
  DeleteAllInteractions,
  SingleAgentFilter,
  PairAgentFilter
};
