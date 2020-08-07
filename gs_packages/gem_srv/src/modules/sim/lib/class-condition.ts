/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The SimCondition class implements interactions and tests.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { T_Agent, T_Program } from '../types/t-smc';
import { AGENTS, CONDITIONS } from '../runtime-core';
import { WORLD } from '../agents/global';
import AgentSet from './class-agentset';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BAD_INIT_ERR = 'constructor requires AgentSet instance';
const DBG = false;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 */
class SimCondition {
  hashid: string; // unique hash for this condition, generated from sig
  agset: AgentSet; // the agents this condition applies to
  tests: T_Program[]; // test(s) run on each agent in set
  execs: T_Program[]; // exec(s) queued to each agent in set that passed
  dim: number; // dimension (1 for filter, 2 for pair)
  /** */
  constructor(ags: AgentSet) {
    if (!(ags instanceof AgentSet)) throw Error(BAD_INIT_ERR);
    this.hashid = '';
    this.agset = ags;
    this.tests = [];
    this.execs = [];
    this.dim = -1;
  }
  /** add test tests */
  addTest(test: T_Program) {
    this.tests.push(test);
  }
  /** add executables */
  addExec(exec: T_Program) {
    this.execs.push(exec);
  }
  /** process filtering on single set
   *  TODO: multiple tests should refine filter set
   */
  filterTest(tests: T_Program[] = this.tests) {
    if (this.dim > 0) {
      console.warn('already filtered...skipping');
      return;
    }
    tests.forEach(test => {
      this.agset.filter(test);
    });
    this.dim = 1;
  }

  /** process pairing with A or A B depending on
   *  the number of types in AgentSet
   */
  pairTest(tests: T_Program[] = this.tests) {
    if (this.dim > 0) {
      console.warn('already paired...skipping');
      return;
    }
    tests.forEach(test => {
      this.agset.pair(test);
    });
    this.dim = 2;
  }

  /** process test results and inform members
   */
  sendResults(execs: T_Program[] = this.execs) {
    if (this.dim < 0) throw Error('test not run');
    if (this.dim > 2) throw Error('dim > 2');
    if (this.dim < 1) throw Error('dim < 1');
    if (this.dim === 1) this.agset.notifyMatches(execs);
    else this.agset.notifyPairs(execs);
  }

  /** reset condition to run again */
  reset() {
    if (this.dim === 0) console.warn('already reset');
    this.dim = 0;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SimCondition;
