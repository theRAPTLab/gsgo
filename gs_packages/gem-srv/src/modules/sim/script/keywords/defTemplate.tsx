/* eslint-disable react/prefer-stateless-function */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword defTemplate command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import { ITemplatePrograms, SM_Keyword, KEYGEN } from 'lib/class-sm-keyword';

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** implement interactive react component for this keyword, saving information
 *  in the local state
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type MyProps = {
  keyword: string;
  args: any[];
};
type MyState = { templateName: string; baseTemplate: string };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ScriptElement extends React.Component<MyProps, MyState> {
  constructor(props: MyProps) {
    super(props);
    const { keyword, args } = props;
    this.state = {
      templateName: args[0],
      baseTemplate: args[1]
    };
    this.onChange = this.onChange.bind(this);
  }
  onChange(e) {
    this.setState({ templateName: e.currentTarget.value }, () => {
      UR.RaiseMessage('KEYWORD_TEST_UPDATE');
    });
  }
  getState() {
    return this.state;
  }
  render() {
    const { templateName, baseTemplate } = this.state;
    const { keyword } = this.props;
    return (
      <div>
        templateName
        <input onChange={this.onChange} type="text" value={templateName} />
      </div>
    );
  }
} // end script element

/// GEMSCRIPT KEYWORD DEFINITION //////////////////////////////////////////////
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
  render(parms: (string | any)[], children: string[]): any {
    // return `<Template label='${templateName}' extends='${baseTemplate}'>`;
    return (
      <ScriptElement
        key={KEYGEN.UniqueKeyProp()}
        keyword="defTemplate"
        args={parms}
      />
    );
  }
} // end of DefTemplate

/// CLASS DEFINITION 2 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** closing tag, not shown in GUI but required when using DefTemplate */
export class EndTemplate extends SM_Keyword {
  args: string[];
  reg_scope: Set<string>;
  key_scope: Set<string>;

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
    return undefined; // need to solve template embedding
  }
} // end of EndDefTemplate

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
