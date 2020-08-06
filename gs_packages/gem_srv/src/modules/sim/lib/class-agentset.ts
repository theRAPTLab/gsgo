/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The AgentSet class implements interactions and tests

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { T_Agent, T_Program } from '../types/t-smc';
import { AGENTS, CONDITIONS } from '../runtime-core';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BADTEST_ERR = 'stack did not contain test result';
const NOTEST_ERR = 'a test has not been defined for this agent set';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 */
class AgentSet {
  _type: string;
  _test: T_Program;
  _members: T_Agent[];
  //
  constructor(agentType: string, test: T_Program) {
    if (AGENTS.has(agentType)) throw Error(`group ${agentType} already exists`);
    this._type = agentType;
    this._members = [];
    if (test) this._test = test;
  }
  //
  filter() {
    if (!this._test) throw Error(NOTEST_ERR);
    const agents = [...AGENTS.get(this._type)];
    this._members = agents.filter(agent => {
      const result = agent.exec_smc(this._test);
      // console.log(agent.name(), result);
      return result.pop();
    });
  }
  //
  members() {
    return this._members;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default AgentSet;
