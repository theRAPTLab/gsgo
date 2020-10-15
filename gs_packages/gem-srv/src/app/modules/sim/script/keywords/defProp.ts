/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword DefProp command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { ITemplatePrograms, SM_Keyword } from 'lib/class-sm-keyword';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class DefProp extends SM_Keyword {
  // base properties defined in SM_Keyword
  constructor() {
    super('defProp');
    this.args = ['propName string', 'propType string', 'initValue any'];
    this.req_scope.add('defTemplate');
    this.key_scope.add('unknown');
  }

  /** create smc template code objects with programs to run in any of
   *  the appropriate phases */
  compile(parms: string[]): ITemplatePrograms {
    // DefProp.compile knows what to expect incl types
    // the args type array is for the GUI to know how to render a component
    const propName = parms.shift();
    const propType = parms.shift();
    const initValue = parms.shift();
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

  /** render to HTML */
  render(parms: string[], children: string[]): any {
    const propName = parms.shift();
    const propType = parms.shift();
    const initValue = parms.shift();
    return `<PropEditor label='${propName}' type='${propType}' value={${initValue}} />`;
  }
} // end of DefProp

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
