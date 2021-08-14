/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "propPop" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword, { DerefProp } from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class propPop extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('propPop');
    this.args = ['objref', 'optionalMethod', 'optionalArgs'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, refArg, optMethod, ...optArgs] = unit;
    const deref = DerefProp(refArg);
    const progout = [];
    progout.push((agent, state) => {
      const p = deref(agent, state.ctx);

      // this bypasses min/max
      // if (optMethod === undefined) p.value = state.pop();

      // use setTo so that min/max are honored
      if (optMethod === undefined) p.setTo(state.pop());
      else p[optMethod](...state.stack);
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
    const isEditable = children ? children.isEditable : false;
    const isInstanceEditor = children ? children.isInstanceEditor : false;

    const jsx = <>propPop {`'${objref}'`}&ensp;</>;
    if (!isInstanceEditor || isEditable) {
      return super.jsx(index, unit, jsx);
    }
    return jsx;
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(propPop);
