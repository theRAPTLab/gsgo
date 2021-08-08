/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "ifExpr" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword, UtilFirstValue } from 'modules/datacore';
import { ScriptToJSX } from 'modules/sim/script/tools/script-to-jsx';

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
  jsx(index: number, unit: TScriptUnit, options: any, children?: any): any {
    const [kw, testName, consequent, alternate] = unit;
    let cc = '';
    if (consequent && Array.isArray(consequent)) {
      const blockIndex = 2; // the position in the unit array to replace <ifExpr> <expr> <conseq>
      // already nested?
      // consequents and alternates need to maintain their own options
      // because the parentLineIndices need to be maintained separately
      // otherwise, alternate parentLineIndices end up with consequents' inserted
      const ccOptions = { ...options };
      if (ccOptions.parentLineIndices !== undefined) {
        // nested parentIndices!
        ccOptions.parentLineIndices = [
          ...ccOptions.parentLineIndices,
          { index, blockIndex }
        ];
      } else {
        ccOptions.parentLineIndices = [{ index, blockIndex }]; // for nested lines
      }
      cc = ScriptToJSX(consequent, ccOptions);
    }
    let aa = '';
    if (alternate && Array.isArray(alternate)) {
      const blockIndex = 3; // the position in the unit array to replace <ifExpr> <expr> <conseq>
      // already nested?
      const aaOptions = { ...options };
      if (aaOptions.parentLineIndices !== undefined) {
        // nested parentIndices!
        aaOptions.parentLineIndices = [
          ...aaOptions.parentLineIndices,
          { index, blockIndex }
        ];
      } else {
        aaOptions.parentLineIndices = [{ index, blockIndex }]; // for nested lines
      }
      aa = ScriptToJSX(alternate, aaOptions);
    }

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
  }
} // end of DefProp

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(ifExpr);
