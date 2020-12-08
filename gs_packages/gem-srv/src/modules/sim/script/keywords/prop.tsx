/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "propMethod" keyword object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class propMethod extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('propMethod');
    this.args = ['propName:string', 'methodName:string', '...args'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, propName, methodName, ...args] = unit;
    const progout = [];
    progout.push((agent: IAgent, state: IState) => {
      const prop = agent.prop(propName);
      const res = prop[methodName](...args).value;
      if (res !== undefined) state.pushArgs(res);
    });
    return progout;
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { propName, methodName, ...args } = state;
    return [this.keyword, propName, ...args];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw, propName, methodName, ...arg] = unit;
    return super.jsx(
      index,
      unit,
      <>
        prop {propName}.{methodName}({arg.join(' ')})
      </>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(propMethod);
