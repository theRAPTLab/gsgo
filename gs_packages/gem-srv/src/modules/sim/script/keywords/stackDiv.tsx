/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "stackDiv" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class stackDiv extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('stackDiv');
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw] = unit;
    const progout = [];

    progout.push((agent, state) => {
      const [a, b] = state.pop(2);
      state.push((b as number) / (a as number));
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
    return super.jsx(index, unit, <>{`${kw}`}</>);
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(stackDiv);
