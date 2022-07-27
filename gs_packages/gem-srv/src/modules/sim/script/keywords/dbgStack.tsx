/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "dbgStack" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class dbgStack extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('dbgStack');
    this.args = ['numpop:number'];
  }

  /** create smc blueprint code objects */
  compile(unit: TKWArguments): TOpcode[] {
    const [kw, numpop] = unit;
    const progout = [];

    progout.push((agent, state) => {
      if (agent.bbb === undefined) agent.bbb = 100;
      if (agent.bbb !== 0) {
        --agent.bbb;
        console.log(`STACK(${agent.name}):`, state.stack);
      }
    });
    return progout;
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(dbgStack);
