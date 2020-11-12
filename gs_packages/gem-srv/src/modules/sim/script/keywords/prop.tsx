/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword prop keyword object

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
export class Prop extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('prop');
    this.args = ['propName:string', 'value:any'];
  }

  /** create smc blueprint code objects */
  compile(parms: any[]): ISMCBundle {
    const [propName, value] = parms;
    const progout = [];
    progout.push((agent: IAgent, state: IState) => {
      const prop = agent.prop(propName);
      prop._value = value;
    });
    return {
      define: [],
      defaults: [],
      conditions: progout
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): ScriptUnit {
    const { propName, value } = state;
    return [this.keyword, propName, value];
  }

  /** return rendered component representation */
  render(index: number, args: any[], children?: any[]): any {
    const propName = args[1];
    const value = args[2];
    return (
      <div key={this.generateKey()} className="prop">
        prop {propName} = {value}
      </div>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(Prop);
