/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "propPop" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword, { K_DerefProp } from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class propPop extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('propPop');
    this.args = ['objRef:object', 'optMethod:string', '...optArgs:any'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, refArg, optMethod, ...optArgs] = unit;
    const deref = K_DerefProp(refArg);
    const progout = [];
    progout.push((agent, state) => {
      const p = deref(agent, state.ctx);

      // this bypasses min/max
      // if (optMethod === undefined) p.value = state.pop();

      // use setTo so that min/max are honored
      // eslint-disable-next-line @typescript-eslint/dot-notation
      if (optMethod === undefined) p['setTo'](state.pop());
      else p[optMethod as string](...state.stack);
    });
    return progout;
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { error } = state;
    return [this.keyword, error];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw, objref, optMethod, ...optArgs] = unit;
    const isEditable = children ? (children as any).isEditable : false;
    const isInstanceEditor = children
      ? (children as any).isInstanceEditor
      : false;

    const jsx = <>propPop {`'${objref}'`}</>;
    if (!isInstanceEditor || isEditable) {
      return super.jsx(index, unit, jsx);
    }
    return super.jsxMin(index, unit, jsx);
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(propPop);
