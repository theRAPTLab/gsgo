/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "addTest" command object
  adds a named test to the TESTS table so we can refer to it later
  this particular test is for a condition that runs inside of an agent,
  so we want SMC-compatible code here.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from '../../../../lib/class-keyword';
import {
  IAgent,
  TKWArguments,
  TOpcode,
  TScriptUnit,
  TMethod
} from '../../../../lib/t-script';
import { RegisterKeyword, RegisterTest } from '../../../datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class addTest extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('addTest');
    this.args = ['testName:string', 'test:TMethod'];
  }

  /** create smc blueprint code objects
   *  NOTE: when compile is called, all arguments have already been expanded
   *  from {{ }} to a ParseTree
   */
  compile(dtoks: TKWArguments): TOpcode[] {
    const [kw, testName, block] = dtoks;
    const conds = [
      (agent: IAgent) => {
        RegisterTest(testName as string, block);
      }
    ];
    return conds;
  }
  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any): any {
    const [keyword, testName, expr] = unit;
    return <>{keyword}</>;
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(addTest);
