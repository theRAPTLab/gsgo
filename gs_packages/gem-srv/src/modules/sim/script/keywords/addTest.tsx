/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "addTest" command object
  adds a named test to the TESTS table so we can refer to it later
  this particular test is for a condition that runs inside of an agent,
  so we want SMC-compatible code here.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword, RegisterTest } from 'modules/datacore';

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
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, testName, test] = unit;
    const conds = [
      agent => {
        if (RegisterTest(testName, test))
          console.log(`registering test '${testName}' ${test.type ? 'AST' : ''}`);
        else console.log(`overwriting test '${testName}'`);
        RegisterTest(testName, test);
        return testName;
      }
    ];
    return conds;
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { testName, expr } = state;
    return [this.keyword, testName, expr];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any): any {
    const [kw, testName, expr] = unit;
    return super.jsx(
      index,
      unit,
      <>
        addTest {testName} = {expr}
      </>
    );
  }
} // end of DefProp

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(addTest);
