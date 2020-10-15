/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword useFeature command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { ITemplatePrograms, SM_Keyword } from 'lib/class-sm-keyword';

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
    const featureName = parms.shift();
    const progout = [];
    progout.push(`smc_useFeature( ${featureName} )`);
    return {
      template_define: progout,
      template_defaults: [],
      template_conditions: []
    };
  }

  /** return rendered component representation */
  render(parms: string[], children: string[]): any {
    const featureName = parms.shift();
    return `<UseFeature label='${featureName}'><PropList/><MethodList/></UseFeature>`;
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
