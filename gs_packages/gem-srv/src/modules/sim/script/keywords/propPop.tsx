/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "propPop" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword, { K_DerefProp } from 'lib/class-keyword';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class propPop extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('propPop');
    this.args = ['prop:objref'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, refArg, optMethod, ...optArgs] = unit;
    const deref = K_DerefProp(refArg);
    const progout = [];
    progout.push((agent, state) => {
      const p = deref(agent, state.ctx);

      // this bypasses min/max
      // if (optMethod === undefined) p.value = state.pop();

      // use setTo so that min/max are honored
      // eslint-disable-next-line @typescript-eslint/dot-notation
      if (optMethod === undefined) p['setTo'](state.pop());
      else p[optMethod as string](...state.stack);
    });
    return progout;
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(propPop);
