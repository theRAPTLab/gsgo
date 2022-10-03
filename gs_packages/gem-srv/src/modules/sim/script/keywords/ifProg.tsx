/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "ifProg" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { RegisterKeyword } from '../../../datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class ifProg extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('ifProg');
    this.args = ['test:string', 'consq:block', 'alter:block'];
  }

  compile(unit: TKWArguments): TOpcode[] {
    // the incoming parameters are already expanded into their runtime
    // equivalents (AST for expressions, TSMCProgram for blocks)
    const [kw, test, consq, alter] = unit;
    const cout = [];
    cout.push((agent, state) => {
      if (agent.name('bun0')) {
        const res = agent.exec(test);
        if (res) agent.exec(consq);
        else agent.exec(alter);
      }
    });
    return cout;
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(ifProg);
