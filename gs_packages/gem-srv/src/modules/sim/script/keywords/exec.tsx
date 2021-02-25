/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "exec" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class exec extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('exec');
    this.args = ['expression: TMethod'];
  }

  /** create smc blueprint code objects
   *  NOTE: when compile is called, all arguments have already been expanded
   *  from {{ }} to a ParseTree
   */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, expression] = unit;
    if (typeof expression !== 'object') {
      console.log('non ast expression', expression);
      return [];
    }
    return [agent => agent.exec(expression)];
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
    return super.jsx(
      index,
      unit,
      <>
        exec {testName} {cc} {aa}
      </>
    );
  }
} // end of DefProp

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(exec);
