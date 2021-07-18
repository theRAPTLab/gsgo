/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "ifExpr" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword, UtilFirstValue } from 'modules/datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class ifExpr extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('ifExpr');
    this.args = ['test:TMethod', 'consequent:TMethod', 'alternate:TMethod'];
  }

  /** create smc blueprint code objects
   *  NOTE: when compile is called, all arguments have already been expanded
   *  from {{ }} to a ParseTree
   */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, test, consq, alter] = unit;
    const code = [];
    code.push((agent, state) => {
      const vals = agent.exec(test, state.ctx);
      const result = UtilFirstValue(vals);
      if (result && consq) agent.exec(consq, state.ctx);
      if (!result && alter) agent.exec(alter, state.ctx);
    });
    return code;
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { testName, consequent, alternate } = state;
    return [this.keyword, testName, consequent, alternate];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any): any {
    const [kw, testName, consequent, alternate] = unit;
    const cc = consequent ? 'TRUE:[consequent]' : '';
    const aa = alternate ? 'FALSE:[alternate]' : '';

    const expr =
      testName && testName.expr && testName.expr.raw
        ? testName.expr.raw
        : 'testExpression';

    return super.jsx(
      index,
      unit,
      <>
        ifExpr ( {expr} ) {cc} {aa}
      </>
    );

    // ORIG CODE
    // Results in Uncaught Error: Objects are not valid as a React child (found: object with keys {expr}). If you meant to render a collection of children, use an array instead.
    // return super.jsx(
    //   index,
    //   unit,
    //   <>
    //     ifExpr {testName} {cc} {aa}
    //   </>
    // );
  }
} // end of DefProp

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(ifExpr);
