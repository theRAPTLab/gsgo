/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "ifTest" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from '../../../../lib/class-keyword';
import { TOpcode, TScriptUnit } from '../../../../lib/t-script';
import { RegisterKeyword, GetTest, UtilFirstValue } from '../../../datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class ifTest extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('ifTest');
    this.args = ['testName:string', 'consequent:TMethod', 'alternate:TMethod'];
  }

  /** create smc blueprint code objects
   *  NOTE: when compile is called, all arguments have already been expanded
   *  from {{ }} to a ParseTree
   */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, testName, consq, alter] = unit;
    const code = [];
    code.push((agent, state) => {
      const ast = GetTest(testName as string);
      if (!ast) throw Error(`ifTest: '${testName}' doesn't exist`);
      const result = UtilFirstValue(agent.exec(ast, state.ctx));
      if (result && consq) agent.exec(consq);
      if (!result && alter) agent.exec(alter);
    });
    return code;
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any): any {
    const [keyword, testName, consequent, alternate] = unit;
    return <>{keyword}</>;
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(ifTest);
