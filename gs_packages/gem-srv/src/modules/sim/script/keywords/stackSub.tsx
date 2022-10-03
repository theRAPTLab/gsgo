/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "stackSub" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class stackSub extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('stackSub');
  }

  /** create smc blueprint code objects */
  compile(unit: TKWArguments): TOpcode[] {
    const [kw] = unit;
    const progout = [];

    progout.push((agent, state) => {
      const [a, b] = state.pop(2);
      state.push(Number(b) - Number(a));
    });
    return progout;
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(stackSub);
