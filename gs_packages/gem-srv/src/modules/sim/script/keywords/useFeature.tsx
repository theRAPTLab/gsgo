/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "useFeature" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { addFeature } from 'script/ops/_all';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class useFeature extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('useFeature');
    this.args = ['featureName string'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, featureName] = unit;
    const progout = [];
    progout.push(addFeature(featureName as string));
    return progout;
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw, featureName] = unit;
    const isEditable = children ? (children as any).isEditable : false;
    const isInstanceEditor = children
      ? (children as any).isInstanceEditor
      : false;
    const jsx = <>useFeature {featureName}</>;
    if (!isInstanceEditor || isEditable) {
      return super.jsx(index, unit, jsx);
    }
    return super.jsxMin(index, unit, jsx);
  }
} // end of useFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(useFeature);
