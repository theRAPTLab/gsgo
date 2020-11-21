/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "featureCall" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { IAgent, IState, ISMCBundle, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/runtime-datacore';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class featureCall extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('featureCall');
    this.args = ['featureName:string', 'methodName:string', '...args'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): ISMCBundle {
    const [kw, featName, methodName, ...args] = unit;
    const progout = [];
    progout.push((agent: IAgent, state: IState) => {
      // invoke the feature on the agent
      const feat = agent.feature(featName);
      // spread [...args] handles case when args is a single item, not an array
      // then the argument passed to evaluate() is always an array
      // agent.evaluateArgs() mutates the returned array so we spread it
      const vals = [...args];
      feat.method(agent, methodName, ...agent.evaluateArgs(vals));
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
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw, featName, method, ...args] = unit;
    return super.jsx(index, unit, <>{unit.join(' ')}</>);
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(featureCall);
