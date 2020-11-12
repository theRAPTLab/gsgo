/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The SimCondition class implements interactions and tests.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { TSMCProgram } from './t-script';
import AgentSet from './class-agentset';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BAD_INIT_ERR = 'constructor requires AgentSet instance';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 */
class SimCondition {
  hashid: string; // unique hash for this condition, generated from sig
  agset: AgentSet; // the agents this condition applies to
  tests: TSMCProgram[]; // test(s) run on each agent in set
  execsStack: any[]; // initial arguments to pass to execs
  execs: TSMCProgram[]; // exec(s) queued to each agent in set that passed
  dim: number; // dimension (1 for filter, 2 for pair)
  /** */
  constructor(ags: AgentSet) {
    if (!(ags instanceof AgentSet)) throw Error(BAD_INIT_ERR);
    this.hashid = '';
    this.agset = ags;
    this.tests = [];
    this.execs = [];
    this.execsStack = [];
    this.dim = -1;
  }
  /** add test tests */
  addTest(test: TSMCProgram) {
    this.tests.push(test);
  }
  /** add executables */
  addExec(exec: TSMCProgram, args: any[] = []) {
    this.execs.push(exec);
    if (!Array.isArray(args)) throw Error('exec args not array');
    this.execsStack.push(args);
  }
  /** process filtering on single set
   *  TODO: multiple tests should refine filter set
   */
  filterTest(tests: TSMCProgram[] = this.tests) {
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
  pairTest(tests: TSMCProgram[] = this.tests) {
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
  sendResults(
    execs: TSMCProgram[] = this.execs,
    stacks: any[] = this.execsStack
  ) {
    if (this.dim < 0) throw Error('test not run');
    if (this.dim > 2) throw Error('dim > 2');
    if (this.dim < 1) throw Error('dim < 1');
    if (this.dim === 1) this.agset.notifyMatches(execs, stacks);
    else this.agset.notifyPairs(execs, stacks);
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
