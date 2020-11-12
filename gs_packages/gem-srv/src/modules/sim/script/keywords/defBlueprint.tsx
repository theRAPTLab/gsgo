/* eslint-disable react/prefer-stateless-function */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword defBlueprint command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { ISMCBundle, TScriptUpdate, ScriptUnit } from 'lib/t-script';
import { nop } from 'script/ops/debug-ops';
import { RegisterKeyword } from '../keyword-factory';

/// GEMSCRIPT KEYWORD DEFINITION //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class DefTemplate extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('defBlueprint');
    this.args = ['blueprintName string', 'baseBlueprint string'];
    this.serialize = this.serialize.bind(this);
    this.compile = this.compile.bind(this);
    this.render = this.render.bind(this);
  }

  /** create smc blueprint code objects for this unit */
  compile(parms: any[]): ISMCBundle {
    const blueprintName = parms[0];
    const baseBlueprint = parms[1];
    const progout = [];
    // this is a no-operation
    progout.push(nop());

    return {
      name: blueprintName,
      define: progout,
      defaults: [],
      conditions: []
    };
  }

  /** return a ScriptUnit made from current state */
  serialize(state: any): ScriptUnit {
    const { blueprintName, baseBlueprint } = state;
    return [this.keyword, blueprintName, baseBlueprint];
  }

  /** return rendered component representation */
  render(index: number, srcLine: ScriptUnit, children?: any[]): any {
    const state = {
      blueprintName: srcLine[1],
      baseBlueprint: srcLine[2]
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

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** implement interactive react component for this keyword, saving information
 *  in the local state
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type MyState = { blueprintName: string; baseBlueprint: string };
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
    this.setState({ blueprintName: e.currentTarget.value }, () => {
      const updata: TScriptUpdate = {
        index: this.index,
        scriptUnit: this.serialize(this.state)
      };
      UR.RaiseMessage('SCRIPT_UI_CHANGED', updata);
    });
  }

  render() {
    const { blueprintName, baseBlueprint } = this.state;
    return (
      <div>
        blueprintName
        <input onChange={this.onChange} type="text" value={blueprintName} />
      </div>
    );
  }
} // end script element

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// make sure you import this at some point with
/// import from 'file'
RegisterKeyword(DefTemplate);
