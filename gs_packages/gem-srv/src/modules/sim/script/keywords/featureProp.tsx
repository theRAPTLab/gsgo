/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "featureProp" keyword object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class featureProp extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('featureProp');
    this.args = ['featureName:string', 'propName:string', 'value:any'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, featureName, propName, value] = unit;
    const progout = [];
    progout.push((agent: IAgent, state: IState) => {
      const featProp = agent.featProp(featureName, propName);
      console.log(featProp);
      featProp.value = value;
    });
    return progout;
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { featureName, propName, value } = state;
    return [this.keyword, featureName, propName, value];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const featName = unit[1];
    const propName = unit[2];
    const value = unit[3];
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
RegisterKeyword(featureProp);
