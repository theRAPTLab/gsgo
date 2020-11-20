/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "ifTest" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { ISMCBundle, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword, GetTest } from 'modules/runtime-datacore';

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
  compile(parms: any[]): ISMCBundle {
    const testName = parms[0];
    const consq = parms[1]; // could be any TMethod
    const alter = parms[2]; // also a TMethod
    const code = [];
    code.push((agent, state) => {
      const ast = GetTest(testName);
      if (!ast) throw Error(`ifTest: '${testName}' doesn't exist`);
      const result = this.topValue(agent.exec(ast, [], state.ctx));
      if (result && consq) agent.exec(consq);
      if (!result && alter) agent.exec(alter);
    });
    return {
      update: code
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { testName, consequent, alternate } = state;
    return [this.keyword, testName, consequent, alternate];
  }

  /** return rendered component representation */
  jsx(index: number, srcLine: TScriptUnit, children?: any): any {
    const [kw, testName, consequent, alternate] = srcLine;
    const cc = consequent ? 'TRUE:[consequent]' : '';
    const aa = alternate ? 'FALSE:[alternate]' : '';
    return super.jsx(
      index,
      srcLine,
      <>
        ifTest {testName} {cc} {aa}
      </>
    );
  }
} // end of DefProp

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(ifTest);
