/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword DefProp command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { ITemplatePrograms, SM_Keyword } from 'lib/class-sm-keyword';

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

  /** return rendered component representation */
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
