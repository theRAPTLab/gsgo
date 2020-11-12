/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword propCall keyword object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { IAgent, IScopeable, IState } from 'lib/t-smc';
import { ISMCBundle, ScriptUnit } from 'lib/t-script';
import { RegisterKeyword, GetTest } from 'modules/runtime-datacore';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class PropMethod extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('propMethod');
    this.args = ['propName:string', 'methodName:string', '...args'];
  }

  /** create smc blueprint code objects */
  compile(parms: any[]): ISMCBundle {
    const [propName, methodName, ...args] = parms;
    const progout = [];
    progout.push((agent: IAgent, state: IState) => {
      const prop = agent.prop(propName);
      prop[methodName](...args);
    });
    return {
      define: [],
      defaults: [],
      conditions: progout
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): ScriptUnit {
    const { propName, methodName, ...args } = state;
    return [this.keyword, propName, ...args];
  }

  /** return rendered component representation */
  render(index: number, args: any[], children?: any[]): any {
    const [kw, propName, methodName, ...arg] = args;
    return (
      <div key={this.generateKey()} className="propMethod">
        prop {propName}.{methodName}({arg.join(' ')})
      </div>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(PropMethod);
