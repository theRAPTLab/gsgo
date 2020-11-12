/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword DefProp command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { ISMCBundle, ScriptUnit } from 'lib/t-script';
import { addProp } from 'script/ops/op-imports';
import { RegisterKeyword, GetValueCtor } from 'modules/runtime-datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class AddProp extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('addProp');
    this.args = ['propName string', 'propType string', 'initValue any'];
  }

  /** create smc blueprint code objects */
  compile(parms: any[]): ISMCBundle {
    const propName = parms[0];
    const propType = parms[1];
    const initValue = parms[2];
    const propCtor = GetValueCtor(propType);
    const progout = [];
    progout.push(addProp(propName, propCtor, initValue));
    return {
      define: progout,
      defaults: [],
      conditions: []
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): ScriptUnit {
    const { propName, propType, initValue } = state;
    return [this.keyword, propName, propType, initValue];
  }

  /** return rendered component representation */
  render(index: number, args: any[], children?: any[]): any {
    const [kw, propName, propType, initValue] = args;
    return (
      <div key={this.generateKey()} className="addProp">
        addProp {propName} = {initValue} :{propType}
      </div>
    );
  }
} // end of DefProp

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(AddProp);
