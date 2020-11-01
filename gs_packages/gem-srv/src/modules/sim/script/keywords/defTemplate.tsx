/* eslint-disable react/prefer-stateless-function */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword defTemplate command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import { KeywordDef } from 'lib/class-kw-definition';
import { IAgentTemplate, ScriptUpdate, ScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from '../keyword-dict';

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** implement interactive react component for this keyword, saving information
 *  in the local state
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type MyState = { templateName: string; baseTemplate: string };
type MyProps = {
  index: number;
  state: MyState;
  serialize: (state: MyState) => ScriptUnit;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ScriptElement extends React.Component<MyProps, MyState> {
  index: number; // ui index
  keyword: string; // keyword
  serialize: (state: MyState) => ScriptUnit;
  constructor(props: MyProps) {
    super(props);
    const { index, state, serialize } = props;
    this.index = index;
    this.state = { ...state }; // copy state prop
    this.serialize = serialize;
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    this.setState({ templateName: e.currentTarget.value }, () => {
      const updata: ScriptUpdate = {
        index: this.index,
        scriptUnit: this.serialize(this.state)
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
export class DefTemplate extends KeywordDef {
  // base properties defined in KeywordDef
  constructor() {
    super('defTemplate');
    this.args = ['templateName string', 'baseTemplate string'];
    this.serialize = this.serialize.bind(this);
    this.compile = this.compile.bind(this);
    this.render = this.render.bind(this);
  }

  /** create smc template code objects for this unit */
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

  /** return a ScriptUnit made from current state */
  serialize(state: any): ScriptUnit {
    const { templateName, baseTemplate } = state;
    return [this.keyword, templateName, baseTemplate];
  }

  /** return rendered component representation */
  render(index: number, srcLine: ScriptUnit, children?: any[]): any {
    const state = {
      templateName: srcLine[1],
      baseTemplate: srcLine[2]
    };
    return (
      <ScriptElement
        key={this.generateKey()}
        index={index}
        state={state}
        serialize={this.serialize}
      />
    );
  }
} // end of DefTemplate

/// CLASS DEFINITION 2 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** closing tag, not shown in GUI but required when using DefTemplate */
export class EndTemplate extends KeywordDef {
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
  serialize(state: any): ScriptUnit {
    return [this.keyword];
  }

  /** render to HTML */
  render(index: number, args: any[], children: any[]): any {
    return undefined; // need to solve template embedding
  }
} // end of EndDefTemplate

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// make sure you import this at some point with
/// import from 'file'
RegisterKeyword(DefTemplate);
RegisterKeyword(EndTemplate);
