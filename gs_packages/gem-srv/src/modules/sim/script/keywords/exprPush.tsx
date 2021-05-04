/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "exprPush" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword, UtilFirstValue } from 'modules/datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class exprPush extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('exprPush');
    this.args = ['expr:TMethod'];
  }

  /** create smc blueprint code objects
   *  NOTE: when compile is called, all arguments have already been expanded
   *  from {{ }} to a ParseTree
   */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, expr] = unit;
    const code = [];
    code.push((agent, state) => {
      const vals = agent.exec(expr, state.ctx);
      state.push(vals);
    });
    return code;
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { expr } = state;
    return [this.keyword, expr];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any): any {
    const [kw, expr] = unit;
    return super.jsx(index, unit, <>exprPush {`'${expr}'`}</>);
  }
} // end of DefProp

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(exprPush);
