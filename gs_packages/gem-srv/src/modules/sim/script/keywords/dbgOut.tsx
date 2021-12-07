/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "dbgOut" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import Keyword, { K_EvalRuntimeUnitArgs } from 'lib/class-keyword';
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
          ...PR(...K_EvalRuntimeUnitArgs(unit.slice(1), { agent, ...state.ctx }))
        );
      }
      if (COUNTER === 0) console.log('dbgOut limiter at', MAX_OUT, 'statements');
    });
    return progout;
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [keyword, ...args] = unit;
    return <>{keyword}</>;
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(dbgOut);
