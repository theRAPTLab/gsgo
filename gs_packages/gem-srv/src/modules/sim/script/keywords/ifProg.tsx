/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "ifProg" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from '../../../../lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit } from '../../../../lib/t-script';
import { RegisterKeyword } from '../../../datacore';
import { SingleAgentConditional } from '../conditions';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class ifProg extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('ifProg');
    this.args = ['test:string', 'consq:block', 'alter:block'];
  }

  compile(unit: TScriptUnit): TOpcode[] {
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

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [keyword, testName, conseq, alter] = unit;
    return <>{keyword}</>;
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(ifProg);
