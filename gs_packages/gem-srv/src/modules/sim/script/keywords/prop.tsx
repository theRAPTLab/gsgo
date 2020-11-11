/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword useFeature command object

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
    this.args = ['propName:string', 'methodName:string', '...args'];
  }

  /** create smc blueprint code objects */
  compile(parms: any[]): ISMCBundle {
    const [propName, methodName, ...args] = parms;
    const progout = [];
    progout.push((agent: IAgent, state: IState) => {
      const prop = agent.prop(propName);
      // prop.method(methodName, [...args]);
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
    const { min, max, floor } = state;
    return [this.keyword, min, max, floor];
  }

  /** return rendered component representation */
  render(index: number, args: any[], children?: any[]): any {
    const testName = args[1];
    const conseq = args[2];
    const alter = args[3];
    // return `<UseFeature label='${featureName}'><PropList/><MethodList/></UseFeature>`;
    return (
      <div key={this.generateKey()} className="useFeature">
        on {testName} TRUE {conseq}, ELSE {alter}
      </div>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// make sure you import this at some point with
/// import from 'file'
RegisterKeyword(Prop);
