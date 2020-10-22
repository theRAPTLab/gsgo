/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword DefProp command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { IAgentTemplate, KeywordHelper, SRCLine } from 'lib/class-keyword-helper';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class DefProp extends KeywordHelper {
  // base properties defined in KeywordHelper
  constructor() {
    super('defProp');
    this.args = ['propName string', 'propType string', 'initValue any'];
    this.req_scope.add('defTemplate');
    this.key_scope.add('unknown');
  }

  /** create smc template code objects */
  compile(parms: string[]): IAgentTemplate {
    const propName = parms[0];
    const propType = parms[1];
    const initValue = parms[2];
    const progout = [];
    progout.push(
      `smc_defProp( ${propName}, ${propType}, ${initValue || '<defaultVal>'} )`
    );
    return {
      template_define: progout,
      template_defaults: [],
      template_conditions: []
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): SRCLine {
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
/// see exports above
