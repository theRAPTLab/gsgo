/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword prop keyword object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { KeywordDef } from 'lib/class-kw-definition';
import { IAgent, IScopeable, IState } from 'lib/t-smc';
import { ISMCBundle, ScriptUnit } from 'lib/t-script';
import { RegisterKeyword, GetTest } from '../keyword-factory';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class Prop extends KeywordDef {
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
        prop {propName} set to {value}
      </div>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// make sure you import this at some point with
/// import from 'file'
RegisterKeyword(Prop);
