/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword featureProp command object

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
export class FeatureCall extends KeywordDef {
  // base properties defined in KeywordDef

  constructor() {
    super('featureCall');
    this.args = ['featureName:string', 'methodName:string', '...args'];
  }

  /** create smc blueprint code objects */
  compile(parms: any[]): ISMCBundle {
    const [featName, methodName, ...args] = parms;
    const progout = [];
    progout.push((agent: IAgent, state: IState) => {
      // invoke the feature on the agent
      const feat = agent.feature(featName);
      feat.method(agent, methodName, ...args);
    });
    return {
      define: [],
      defaults: [],
      conditions: [],
      update: progout
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): ScriptUnit {
    const { feature, method, ...args } = state;
    return [this.keyword, feature, method, args];
  }

  /** return rendered component representation */
  render(index: number, parms: any[], children?: any[]): any {
    const [kw, featName, method, ...args] = parms;
    return (
      <div key={this.generateKey()} className="featureMethod">
        feature {featName}.{method}({args.join(',')})
      </div>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// make sure you import this at some point with
/// import from 'file'
RegisterKeyword(FeatureCall);
