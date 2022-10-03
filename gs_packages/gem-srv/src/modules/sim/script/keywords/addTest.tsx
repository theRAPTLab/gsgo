/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "addTest" command object
  adds a named test to the TESTS table so we can refer to it later
  this particular test is for a condition that runs inside of an agent,
  so we want SMC-compatible code here.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { RegisterKeyword, RegisterTest } from 'modules/datacore/dc-sim-data';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class addTest extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('addTest');
    this.args = ['testName:string', 'test:method'];
  }

  /** create smc blueprint code objects
   *  NOTE: when compile is called, all arguments have already been expanded
   *  from {{ }} to a ParseTree
   */
  compile(dtoks: TKWArguments): TOpcode[] {
    const [kw, testName, block] = dtoks;
    const conds = [
      (agent: IAgent) => {
        RegisterTest(testName as string, block as TSMCProgram);
      }
    ];
    return conds;
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(addTest);
