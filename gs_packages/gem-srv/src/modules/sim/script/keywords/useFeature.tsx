/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword useFeature command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { ISMCBundle, TScriptUnit } from 'lib/t-script';
import { addFeature } from 'script/ops/_all';
import { RegisterKeyword } from 'modules/runtime-datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class UseFeature extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('useFeature');
    this.args = ['featureName string'];
  }

  /** create smc blueprint code objects */
  compile(parms: any[]): ISMCBundle {
    const featureName = parms[0];
    const progout = [];
    progout.push(addFeature(featureName));
    return {
      define: progout,
      defaults: [],
      conditions: []
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { featureName } = state;
    return [this.keyword, featureName];
  }

  /** return rendered component representation */
  jsx(index: number, srcLine: TScriptUnit, children?: any[]): any {
    const [kw, featureName] = srcLine;
    return super.jsx(index, srcLine, <>useFeature {featureName}</>);
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(UseFeature);
