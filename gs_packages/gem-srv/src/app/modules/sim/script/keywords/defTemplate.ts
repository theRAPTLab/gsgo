/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword defTemplate command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { ITemplatePrograms, SM_Keyword } from 'lib/class-sm-keyword';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class DefTemplate extends SM_Keyword {
  // base properties defined in SM_Keyword
  constructor() {
    super('defTemplate');
    this.args = ['templateName string', 'baseTemplate string'];
    this.req_scope.add('_EMPTY_');
    this.key_scope.add('defProp');
  }

  /** create smc template code objects */
  compile(parms: string[]): ITemplatePrograms {
    const templateName = parms.shift();
    const baseTemplate = parms.shift() || '';
    const progout = [];
    progout.push(
      `smc_defTemplate( ${templateName}, ${baseTemplate || 'Agent'} )`
    );
    return {
      template_define: progout,
      template_defaults: [],
      template_conditions: []
    };
  }

  /** return rendered component representation */
  render(parms: string[], children: string[]): any {
    const templateName = parms.shift();
    const baseTemplate = parms.shift() || 'Agent';
    return `<Template label='${templateName}' extends='${baseTemplate}'>`;
  }
} // end of DefTemplate

/// CLASS DEFINITION 2 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** closing tag, not shown in GUI but required when using DefTemplate */
export class EndTemplate extends SM_Keyword {
  args: string[];
  reg_scope: Set<string>;
  key_scope: Set<string>;
  //
  constructor() {
    super('endTemplate');
    this.req_scope.add('defTemplate');
  }

  /** create smc template code objects */ compile(
    parms: string[]
  ): ITemplatePrograms {
    const progout = [];
    progout.push('smc_nop()');
    return {
      template_define: progout
    };
  }

  /** render to HTML */
  render(parms: string[], children: string[]): any {
    return '</Template>';
  }
} // end of EndDefTemplate

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
