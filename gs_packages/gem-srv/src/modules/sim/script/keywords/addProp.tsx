/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword DefProp command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { ISMCBundle, ScriptUnit } from 'lib/t-script';
import { addProp } from 'script/ops/op-imports';
import { RegisterKeyword, GetSMObjectCtor } from '../keyword-factory';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class AddProp extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('addProp');
    this.args = ['propName string', 'propType string', 'initValue any'];
    this.req_scope.add('defBlueprint');
    this.key_scope.add('unknown');
  }

  /** create smc blueprint code objects */
  compile(parms: any[]): ISMCBundle {
    const propName = parms[0];
    const propType = parms[1];
    const initValue = parms[2];
    const propCtor = GetSMObjectCtor(propType);
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
/// make sure you import this at some point with
/// import from 'file'
RegisterKeyword(AddProp);
