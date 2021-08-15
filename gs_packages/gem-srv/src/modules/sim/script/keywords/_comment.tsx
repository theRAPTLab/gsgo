/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "_comment" object

  NOTE: This is a SYSTEM KEYWORD used for // COMMENT syntax, and not intended
  for direct use

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from 'lib/class-keyword';
import { TOpcode, IScriptUpdate, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class _comment extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('_comment');
    this.args = ['...args:any'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    return [];
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { _comment } = state;
    return ['//', _comment];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw, cmt] = unit;
    const comment = cmt === '' ? '...' : cmt;
    const isInstanceEditor = children ? children.isInstanceEditor : false;

    if (!isInstanceEditor) {
      // Script Editor, add line numbers
      return super.jsx(
        index,
        unit,
        <i style={{ color: 'gray' }}>{`${comment}`}</i>
      );
    }
    return ''; // skip comments for instance editors
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(_comment);
