/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword prop keyword object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { IAgent, IState, ISMCBundle, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/runtime-datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class FeatureProp extends Keyword {
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
      prop[propName].value = value;
    });
    return {
      define: [],
      defaults: [],
      conditions: progout,
      update: progout // hack
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { featureName, propName, value } = state;
    return [this.keyword, featureName, propName, value];
  }

  /** return rendered component representation */
  jsx(index: number, srcLine: any[], children?: any[]): any {
    const featName = srcLine[1];
    const propName = srcLine[2];
    const value = srcLine[3];
    return (
      <>
        Feature {featName}.{propName} set to {value}
      </>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(FeatureProp);
