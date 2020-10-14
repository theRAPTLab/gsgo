/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword defTemplate command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { SM_Keyword } from 'app/lib/class-sm-keywords';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class DefTemplate extends SM_Keyword {
  // base properties defined in SM_Keyword
  constructor() {
    super('defTemplate');
    console.log(this);
    this.args = ['templateName string', 'baseTemplate string'];
    this.req_scope.add('_EMPTY_');
    this.key_scope.add('defProp');
  }

  /** create smc template code objects with programs to run in any of
   *  the appropriate phases */
  compile(parms: string[]) {
    // defTemplate.compile knows what to expect incl types
    // the args type array is for the GUI to know how to render a component
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

  /** render to HTML */
  render(parms: string[], children: string[]) {
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

  /** create smc template code objects with programs to run in any of
   *  the appropriate phases */
  compile(parms: string[]) {
    const progout = [];
    progout.push('smc_nop()');
    return {
      template_define: progout
    };
  }

  /** render to HTML */
  render(parms: string[], children: string[]) {
    return '</Template>';
  }
} // end of EndDefTemplate

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
