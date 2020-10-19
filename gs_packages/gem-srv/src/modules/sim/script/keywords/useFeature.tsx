/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword useFeature command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { ITemplatePrograms, SM_Keyword, KeywordObj } from 'lib/class-sm-keyword';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class UseFeature extends SM_Keyword {
  // base properties defined in SM_Keyword
  constructor() {
    super('useFeature');
    this.args = ['featureName string'];
    this.req_scope.add('defTemplate');
    this.key_scope.add('TBD');
  }

  /** create smc template code objects */
  compile(parms: string[]): ITemplatePrograms {
    const featureName = parms[0];
    const progout = [];
    progout.push(`smc_useFeature( ${featureName} )`);
    return {
      template_define: progout,
      template_defaults: [],
      template_conditions: []
    };
  }

  /** return a state object that can be used to initialize render()*/
  keywordObj(parms: any[]): KeywordObj {
    const featureName = parms[0];
    return {
      keyword: this.keyword,
      arg: { featureName }
    };
  }
  /** return rendered component representation */
  render(index: number, arg: any, children?: any[]): any {
    const { featureName } = arg;
    // return `<UseFeature label='${featureName}'><PropList/><MethodList/></UseFeature>`;
    return (
      <div key={this.generateKey()} className="useFeature">
        feature {featureName} has props, methods
      </div>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
