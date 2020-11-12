/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword featureProp command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { IAgent, IState } from 'lib/t-script';
import { ISMCBundle, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/runtime-datacore';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class FeatureCall extends Keyword {
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
  serialize(state: any): TScriptUnit {
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
/// see above for keyword export
RegisterKeyword(FeatureCall);
