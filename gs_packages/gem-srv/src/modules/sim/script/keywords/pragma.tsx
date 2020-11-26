/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "pragma" keyword object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword, SetBundleOut } from 'modules/runtime-datacore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PRAGMA = {
  'blueprint': blueprintName => {
    return (agent, state) => state.stack.push('blueprint', blueprintName);
  },
  'bundle': bundleName => {
    // console.log('bundle to', bundleName);
    SetBundleOut(bundleName);
  }
};

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class pragma extends Keyword {
  // base pragmaerties defined in KeywordDef

  constructor() {
    super('pragma');
    this.args = ['pragmaName:string', 'value:any'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, pragmaName, value] = unit;
    const run = PRAGMA[pragmaName](value);
    return [
      (agent: IAgent, state: IState) => {
        state.stack.push(pragmaName);
        state.stack.push(value);
      }
    ];
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { pragmaName, value } = state;
    return [this.keyword, pragmaName, value];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const pragmaName = unit[1];
    const value = unit[2];
    return super.jsx(
      index,
      unit,
      <>
        pragma {pragmaName} = {value}
      </>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(pragma);
