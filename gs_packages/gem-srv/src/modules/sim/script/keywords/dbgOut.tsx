/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "dbgOut" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { Keyword } from 'lib/class-keyword';
import { TOpcode, IScriptUpdate, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';
import { EvalUnitArgs } from 'lib/expr-evaluator';

/// KEYWORD STATIC DECLARATIONS ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let MAX_OUT = 100;
let COUNTER = MAX_OUT;
UR.RegisterMessage('AGENT_PROGRAM', () => {
  console.log('DBGOUT RESET OUTPUT COUNTER to', MAX_OUT);
  COUNTER = MAX_OUT;
});

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

    progout.push(agent => {
      if (COUNTER-- > 0) {
        console.log(`?${EvalUnitArgs(unit, { agent }).join(' ')}`);
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
    const [kw] = unit;
    return super.jsx(index, unit, <>unknown keyword: {`'${kw}'`}</>);
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(dbgOut);
