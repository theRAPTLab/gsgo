/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "ifExpr" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import * as DCSIM from 'modules/datacore/dc-sim-data';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class ifExpr extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('ifExpr');
    this.args = ['text:expr', 'consequent:block', 'alternate:block'];
  }

  /** create smc blueprint code objects
   *  NOTE: when compile is called, all arguments have already been expanded
   *  from {{ }} to a ParseTree
   */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, test, consq, alter] = unit;
    const code = [];
    code.push((agent, state) => {
      const vals = agent.exec(test, state.ctx);
      const result = this.utilFirstValue(vals);
      if (result && consq) agent.exec(consq, state.ctx);
      if (!result && alter) agent.exec(alter, state.ctx);
    });
    return code;
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
DCSIM.RegisterKeyword(ifExpr);
