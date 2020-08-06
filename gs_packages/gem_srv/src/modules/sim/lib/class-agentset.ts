/* eslint-disable no-continue */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The AgentSet class implements interactions and tests

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { T_Agent, T_Program } from '../types/t-smc';
import { AGENTS, CONDITIONS } from '../runtime-core';
import { WORLD } from '../agents/global';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BADTEST_ERR = 'stack did not contain test result';
const NOTEST_ERR = 'a test has not been defined';
const TOOMANY_ERR = 'AgentSet currently handles at most 2 agent types';
const TOOFEW_ERR = 'AgentSet requires at least one type to process';

const DBG = false;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 */
class AgentSet {
  _types: string[];
  _test: T_Program;
  _members: T_Agent[];
  _pairs: [T_Agent, T_Agent][];
  //
  constructor(...types: string[]) {
    this._types = types;
    this._members = [];
    this._pairs = [];
    this._test = [];
    if (this._types.length > 2) throw Error(TOOMANY_ERR);
    if (this._types.length < 1) throw Error(TOOFEW_ERR);
  }
  /** set the AgentSet test */
  setTest(test: T_Program) {
    this._test = test;
  }
  /** uses the test function to filter the agent set into members array */
  filter(): void {
    if (!this._test) throw Error(BADTEST_ERR);
    // always run the first type only
    const agents = [...AGENTS.get(this._types[0])];
    this._members = agents.filter(agent => {
      const result = agent.exec_smc(this._test);
      // console.log(agent.name(), result);
      if (result.length !== 1) throw Error(NOTEST_ERR);
      return result.pop();
    });
  }
  /** uses the test function to run interactions between all agents
   *  these are potentially very slow, so we want to eventually cache
   *  the AgentSet results and streamline the functions as much
   *  as possible
   */
  interact(): void {
    if (!this._test) throw Error(BADTEST_ERR);
    if (this._types.length !== 2) throw Error(TOOFEW_ERR);
    const SET_A: T_Agent[] = [...AGENTS.get(this._types[0])];
    const SET_B: T_Agent[] = [...AGENTS.get(this._types[1])];
    // walk over arrays
    for (let i = SET_A.length - 1; i >= 0; i--) {
      for (let j = SET_B.length - 1; j >= 0; j--) {
        const agentA = SET_A[i];
        const agentB = SET_B[j];
        if (agentA === agentB) continue;

        const stack = [agentA, agentB];
        // the result should be
        const result = WORLD.exec_smc(this._test, stack);
        if (result.length !== 1) throw Error(NOTEST_ERR);
        if (result.pop() === true) this._pairs.push([agentA, agentB]);
      }
    }
    if (DBG) console.log('matching pairs', this._pairs);
  }
  /** returns the members array that has presumably been filtered */
  members() {
    return this._members;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default AgentSet;
