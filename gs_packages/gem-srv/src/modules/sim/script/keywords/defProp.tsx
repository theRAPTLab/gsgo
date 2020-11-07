/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword DefProp command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { KeywordDef } from 'lib/class-kw-definition';
import { IAgentTemplate, ScriptUpdate, ScriptUnit } from 'lib/t-script';
import { addProp } from 'script/ops/op-imports';
import { RegisterKeyword, GetSMObjectCtor } from '../keyword-factory';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class DefProp extends KeywordDef {
  // base properties defined in KeywordDef
  constructor() {
    super('defProp');
    this.args = ['propName string', 'propType string', 'initValue any'];
    this.req_scope.add('defTemplate');
    this.key_scope.add('unknown');
  }

  /** create smc template code objects */
  compile(parms: any[]): IAgentTemplate {
    const propName = parms[0];
    const propType = parms[1];
    const initValue = parms[2];
    const propCtor = GetSMObjectCtor(propType);
    const progout = [];
    progout.push(addProp(propName, propCtor));
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
    const [propName, propType, initValue] = args;
    return (
      <div key={this.generateKey()} className="defProp">
        prop {propName} is type {propType} w/value {initValue}
      </div>
    );
  }
} // end of DefProp

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// make sure you import this at some point with
/// import from 'file'
RegisterKeyword(DefProp);
