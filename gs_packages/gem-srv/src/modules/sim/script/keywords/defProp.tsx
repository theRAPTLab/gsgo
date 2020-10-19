/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword DefProp command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { ITemplatePrograms, SM_Keyword, KeywordObj } from 'lib/class-sm-keyword';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class DefProp extends SM_Keyword {
  // base properties defined in SM_Keyword
  constructor() {
    super('defProp');
    this.args = ['propName string', 'propType string', 'initValue any'];
    this.req_scope.add('defTemplate');
    this.key_scope.add('unknown');
  }

  /** create smc template code objects */
  compile(parms: string[]): ITemplatePrograms {
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

  /** return a state object that can be used to initialize render()*/
  keywordObj(parms: any[]): KeywordObj {
    const propName = parms[0];
    const propType = parms[1];
    const initValue = parms[2];
    return {
      keyword: this.keyword,
      arg: { propName, propType, initValue }
    };
  }

  /** return rendered component representation */
  render(index: number, arg: any, children?: any[]): any {
    const { propName, propType, initValue } = arg;
    // return `<PropEditor label='${propName}' type='${propType}' value={${initValue}} />`;
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
