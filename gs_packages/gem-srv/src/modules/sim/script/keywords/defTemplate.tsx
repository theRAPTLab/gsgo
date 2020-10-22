/* eslint-disable react/prefer-stateless-function */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword defTemplate command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import {
  IAgentTemplate,
  KeywordHelper,
  UIUpdate,
  SRCLine,
  KEYGEN
} from 'lib/class-keyword-helper';

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** implement interactive react component for this keyword, saving information
 *  in the local state
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type MyState = { templateName: string; baseTemplate: string };
type MyProps = {
  index: number;
  keyword: string;
  state: MyState;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ScriptElement extends React.Component<MyProps, MyState> {
  index: number; // ui index
  keyword: string; // keyword
  constructor(props: MyProps) {
    super(props);
    const { index, keyword, state } = props;
    this.index = index;
    this.keyword = keyword;
    this.state = { ...state }; // copy state prop
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    this.setState({ templateName: e.currentTarget.value }, () => {
      const updata: UIUpdate = {
        index: this.index,
        keyword: this.keyword,
        state: this.state
      };
      UR.RaiseMessage('SCRIPT_UI_CHANGED', updata);
    });
  }

  render() {
    const { templateName, baseTemplate } = this.state;
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
export class DefTemplate extends KeywordHelper {
  // base properties defined in KeywordHelper
  constructor() {
    super('defTemplate');
    this.args = ['templateName string', 'baseTemplate string'];
    this.req_scope.add('_EMPTY_');
    this.key_scope.add('defProp');
  }

  /** create smc template code objects */
  compile(parms: any[]): IAgentTemplate {
    const templateName = parms[0];
    const baseTemplate = parms[1];
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

  /** return a state object that turn react state back into source */
  serialize(state: any): SRCLine {
    const { templateName, baseTemplate } = state;
    return [this.keyword, templateName, baseTemplate];
  }

  /** return rendered component representation */
  render(index: number, srcLine: SRCLine, children?: any[]): any {
    const state = {
      templateName: srcLine[1],
      baseTemplate: srcLine[2]
    };
    return (
      <ScriptElement
        key={KEYGEN.UniqueReactKey()}
        index={index}
        keyword={this.keyword}
        state={state}
      />
    );
  }
} // end of DefTemplate

/// CLASS DEFINITION 2 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** closing tag, not shown in GUI but required when using DefTemplate */
export class EndTemplate extends KeywordHelper {
  args: string[];
  reg_scope: Set<string>;
  key_scope: Set<string>;

  constructor() {
    super('endTemplate');
    this.req_scope.add('defTemplate');
  }

  /** create smc template code objects */ compile(
    parms: string[]
  ): IAgentTemplate {
    const progout = [];
    progout.push('smc_nop()');
    return {
      template_define: progout
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): SRCLine {
    return [this.keyword];
  }

  /** render to HTML */
  render(index: number, args: any[], children: any[]): any {
    return undefined; // need to solve template embedding
  }
} // end of EndDefTemplate

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
