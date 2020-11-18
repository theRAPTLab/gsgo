/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword onCondition command object
  What is this supposed to do? Implement expression conditionals
  on an agent. These are run during the CONDITIONALS part of the
  simulation lifecycle

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { IAgent, IState, ISMCBundle, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/runtime-datacore';
import { SingleAgentConditional } from 'script/script-conditionals';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class OnCondition extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('onCondition');
    this.args = ['testExpr:string', 'consequent:smc', 'alternate:smc'];
  }
  /* NOTE THIS IS NONFUNCTIONAL */
  /** create smc blueprint code objects */
  compile(parms: any[]): ISMCBundle {
    const testExpr = parms[0]; // {{ expr }}
    const consq = parms[1];
    const alter = parms[2];
    const cout = [];
    cout.push();
    return {
      define: [],
      defaults: [],
      conditions: cout
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { min, max, floor } = state;
    return [this.keyword, min, max, floor];
  }

  /** return rendered component representation */
  render(index: number, args: any[], children?: any[]): any {
    const testName = args[1];
    const conseq = args[2];
    const alter = args[3];
    return (
      <div key={this.generateKey()} className="onCondition">
        on {testName} TRUE {conseq}, ELSE {alter}
      </div>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(OnCondition);
