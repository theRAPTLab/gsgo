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
export class FeatureProp extends KeywordDef {
  // base properties defined in KeywordDef

  constructor() {
    super('featureProp');
    this.args = ['featureName:string', 'propName:string', 'value:any'];
  }

  /** create smc blueprint code objects */
  compile(parms: any[]): ISMCBundle {
    const [featureName, propName, value] = parms;
    const progout = [];
    progout.push((agent: IAgent, state: IState) => {
      const feat = agent.feature(featureName);
      const prop = feat.prop(propName);
      prop[propName]._value = value;
    });
    return {
      define: [],
      defaults: [],
      conditions: progout,
      update: progout // hack
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): ScriptUnit {
    const { featureName, propName, value } = state;
    return [this.keyword, featureName, propName, value];
  }

  /** return rendered component representation */
  render(index: number, args: any[], children?: any[]): any {
    const featName = args[1];
    const propName = args[2];
    const value = args[3];
    return (
      <div key={this.generateKey()} className="prop">
        Feature {featName}.{propName} set to {value}
      </div>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// make sure you import this at some point with
/// import from 'file'
RegisterKeyword(FeatureProp);
