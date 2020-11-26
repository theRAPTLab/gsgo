/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "dbgOut" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { TOpcode, IScriptUpdate, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/runtime-datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class dbgOut extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('dbgOut');
    this.args = ['...args'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, error] = unit;
    const progout = [];

    progout.push(agent => {
      if (agent.aaa === undefined) agent.aaa = 10;
      if (agent.aaa > 0) {
        const unknown = unit.join(', ');
        console.log(`?${unknown}`);
        agent.aaa--;
      }
    });
    return progout;
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { error } = state;
    return [this.keyword, error];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw] = unit;
    return super.jsx(index, unit, <>unknown keyword: {`'${kw}'`}</>);
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(dbgOut);
