/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "dbgOut" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import Keyword, { EvalRuntimeUnitArgs } from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';

/// KEYWORD STATIC DECLARATIONS ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let MAX_OUT = 1000;
let COUNTER = MAX_OUT;
UR.HandleMessage('ALL_AGENTS_PROGRAM', () => {
  console.log('DBGOUT RESET OUTPUT COUNTER to', MAX_OUT);
  COUNTER = MAX_OUT;
});
UR.HandleMessage('AGENT_PROGRAM', () => {
  console.log('DBGOUT RESET OUTPUT COUNTER to', MAX_OUT);
  COUNTER = MAX_OUT;
});
const PR = UR.PrefixUtil('DBGOUT', 'TagGreen');

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
    const progout = [];

    progout.push((agent, state) => {
      if (COUNTER-- > 0) {
        console.log(
          ...PR(...EvalRuntimeUnitArgs(unit.slice(1), { agent, ...state.ctx }))
        );
      }
      if (COUNTER === 0) console.log('dbgOut limiter at', MAX_OUT, 'statements');
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
    const [kw, ...args] = unit;
    return super.jsx(index, unit, <>{`${kw} ${args}`}</>);
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(dbgOut);
