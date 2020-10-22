/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword useFeature command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { IAgentTemplate, KeywordHelper, SRCLine } from 'lib/class-keyword-helper';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class UseFeature extends KeywordHelper {
  // base properties defined in KeywordHelper
  constructor() {
    super('useFeature');
    this.args = ['featureName string'];
    this.req_scope.add('defTemplate');
    this.key_scope.add('TBD');
  }

  /** create smc template code objects */
  compile(parms: string[]): IAgentTemplate {
    const featureName = parms[0];
    const progout = [];
    progout.push(`smc_useFeature( ${featureName} )`);
    return {
      template_define: progout,
      template_defaults: [],
      template_conditions: []
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): SRCLine {
    const { featureName } = state;
    return [this.keyword, featureName];
  }

  /** return rendered component representation */
  render(index: number, args: any, children?: any[]): any {
    const [featureName] = args;
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
