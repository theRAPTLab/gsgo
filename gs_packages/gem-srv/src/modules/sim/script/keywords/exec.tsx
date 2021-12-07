/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "exec" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from 'lib/class-keyword';
import { TOpcode, TArguments, TScriptUnit, TMethod } from 'lib/t-script';
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
  compile(dtoks: TArguments): TOpcode[] {
    const [kw, expression] = dtoks;
    if (typeof expression !== 'object') {
      console.log('non ast expression', expression);
      return [];
    }
    return [agent => agent.exec(expression as TMethod)];
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
RegisterKeyword(exec);
