/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword error command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { ISMCBundle, IScriptUpdate, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/runtime-datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class unknownKeyword extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('unknownKeyword');
    this.args = ['...parms'];
  }

  compile(parms: any[]): ISMCBundle {
    const progout = [];
    progout.push(agent => {
      console.log(`[${this.keyword} ${parms.slice(1, parms.length).join(', ')}]`);
    });
    return {
      define: progout,
      defaults: [],
      conditions: [],
      update: []
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { error } = state;
    return [this.keyword, error];
  }

  /** return rendered component representation */
  jsx(index: number, srcLine: TScriptUnit, children?: any[]): any {
    const [error] = srcLine;
    return super.jsx(
      index,
      srcLine,
      <>{`[${this.keyword} ${srcLine.slice(1, srcLine.length).join(', ')}]`}</>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(unknownKeyword);
