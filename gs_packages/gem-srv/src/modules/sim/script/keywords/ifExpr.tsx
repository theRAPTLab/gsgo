/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword IfExpr command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { ISMCBundle, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword, GetTest } from 'modules/runtime-datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class IfExpr extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('ifExpr');
    this.args = ['test:TMethod', 'consequent:TMethod', 'alternate:TMethod'];
  }

  /** create smc blueprint code objects
   *  NOTE: when compile is called, all arguments have already been expanded
   *  from {{ }} to a ParseTree
   */
  compile(parms: any[]): ISMCBundle {
    const test = parms[0]; // any TMethod returning boolean
    const consq = parms[1]; // could be any TMethod
    const alter = parms[2]; // also a TMethod
    const code = [];
    code.push((agent, state) => {
      const method = test;
      const result = this.topValue(agent.exec(method, [], state.ctx));
      if (result) agent.exec(consq);
      else agent.exec(alter);
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
    return super.jsx(
      index,
      srcLine,
      <>ifTest {testName} then run [consequent]</>
    );
  }
} // end of DefProp

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(IfExpr);
