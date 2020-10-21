/* eslint-disable react/prefer-stateless-function */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword defTemplate command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import {
  ITemplatePrograms,
  SM_Keyword,
  KeywordObj,
  KeywordUpdateData,
  KEYGEN
} from 'lib/class-sm-keyword';

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** implement interactive react component for this keyword, saving information
 *  in the local state
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type MyProps = {
  index: number;
  keyword: string;
  arg: any;
};
type MyState = { templateName: string; baseTemplate: string };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ScriptElement extends React.Component<MyProps, MyState> {
  index: number; // ui index
  keyword: string; // keyword
  constructor(props: MyProps) {
    super(props);
    const { index, keyword, arg } = props;
    this.index = index;
    this.keyword = keyword;
    const { templateName, baseTemplate } = arg;
    this.state = {
      templateName,
      baseTemplate
    };
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    this.setState({ templateName: e.currentTarget.value }, () => {
      const { templateName, baseTemplate } = this.state;
      const data: KeywordUpdateData = {
        keyword: this.keyword,
        index: this.index,
        state: [templateName, baseTemplate]
      };
      UR.RaiseMessage('KEYWORD_TEST_UPDATE', data);
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

  /** return a state object that can be used to initialize render()*/
  keywordObj(parms: any[]): KeywordObj {
    const templateName = parms[0];
    const baseTemplate = parms[1];
    return {
      keyword: this.keyword,
      args: [templateName, baseTemplate]
    };
  }

  /** return rendered component representation */
  render(index: number, args: any[], children?: any[]): any {
    const [templateName, baseTemplate] = args;
    return (
      <ScriptElement
        key={KEYGEN.UniqueKeyProp()}
        index={index}
        keyword={this.keyword}
        arg={{ templateName, baseTemplate }}
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

  /** return a state object that can be used to initialize render()*/
  keywordObj(parms: any[]): KeywordObj {
    return {
      keyword: this.keyword,
      args: []
    };
  }

  /** render to HTML */
  render(index: number, args: any[], children: any[]): any {
    return undefined; // need to solve template embedding
  }
} // end of EndDefTemplate

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
