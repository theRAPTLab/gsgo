/* eslint-disable react/prefer-stateless-function */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword endBlueprint command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { ISMCBundle, IScriptUpdate, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/runtime-datacore';

/// CLASS DEFINITION 2 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** closing tag, not shown in GUI but required when using DefTemplate */
export class endBlueprint extends Keyword {
  args: string[];
  reg_scope: Set<string>;
  key_scope: Set<string>;

  constructor() {
    super('endBlueprint');
  }

  /** create smc blueprint code objects */
  compile(parms: string[]): ISMCBundle {
    const progout = [];
    return {
      define: progout
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    return [this.keyword];
  }

  /** render to HTML */
  render(index: number, args: any[], children: any[]): any {
    return undefined; // need to solve blueprint embedding
  }
} // end of EndDefTemplate

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(endBlueprint);
