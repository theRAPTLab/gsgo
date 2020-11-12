/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword useFeature command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { KeywordDef } from 'lib/class-kw-definition';
import { IAgent, IScopeable, IState } from 'lib/t-smc';
import { ISMCBundle, TScriptUpdate, ScriptUnit } from 'lib/t-script';
import { RegisterKeyword, GetTest } from '../keyword-factory';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Random(min: number, max: number, floor: boolean = true) {
  const n = Math.random() * (max - min) + min;
  if (floor) return Math.floor(n);
  return n;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class OnCondition extends KeywordDef {
  // base properties defined in KeywordDef

  constructor() {
    super('onCondition');
    this.args = ['testName:string', 'consequent:smc', 'alternate:smc'];
  }

  /** create smc blueprint code objects */
  compile(parms: any[]): ISMCBundle {
    const testName = parms[0];
    const consq = parms[1];
    const alter = parms[2];
    const test = GetTest(testName);
    const progout = [];
    progout.push((agent: IAgent, state: IState) => {
      const pass = agent.exec(test); // a test always returns boolean
      if (pass) agent.exec(consq);
      if (!pass) agent.exec(alter);
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
RegisterKeyword(OnCondition);
