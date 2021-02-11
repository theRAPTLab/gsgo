/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "propPush" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { TOpcode, IScriptUpdate, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';
import { DerefProp } from 'lib/expr-evaluator';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class propPush extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('propPush');
    this.args = ['objref', 'optionalMethod', 'optionalArgs'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, refArg, optMethod, ...optArgs] = unit;
    const deref = DerefProp(refArg);
    const progout = [];
    progout.push((agent, state) => {
      const p = deref(agent, state.ctx);
      if (optMethod === undefined) state.push(p.value);
      else state.push(p[optMethod](...optArgs));
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
    return super.jsx(index, unit, <>propPush: {`'${objref}'`}</>);
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(propPush);
