/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "comment" object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { ISMCBundle, IScriptUpdate, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/runtime-datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class comment extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('comment');
    this.args = ['...args:any'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): ISMCBundle {
    return {};
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { comment } = state;
    return ['//', comment];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw, cmt] = unit;
    return super.jsx(index, unit, <i style={{ color: 'gray' }}>{`${cmt}`}</i>);
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(comment);
