/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "featureHook" command object
  make sure to use PROGRAM pragma to direct into appropriate blueprint!
  see dc-script-bundle for a list of valid bundle

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { GetFeature, GetFeatureMethod } from 'modules/datacore/dc-features';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class featureHook extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('featureHook');
    this.args = ['featureName:string', 'methodName:string'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, featName, methodName] = unit;
    const feature = GetFeature(featName);
    const method = feature.featGetMethod(methodName);
    const progout = [];
    progout.push((agent: IAgent) => {
      method.call(feature, agent);
    });
    return progout;
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { feature, method, ...args } = state;
    return [this.keyword, feature, method, args];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw, featName, method] = unit;
    return super.jsx(index, unit, <>{unit.join(' ')}</>);
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(featureHook);
