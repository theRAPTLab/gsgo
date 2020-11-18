/* eslint-disable react/prefer-stateless-function */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword defBlueprint command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { ISMCBundle, IScriptUpdate, TScriptUnit } from 'lib/t-script';
import { nop } from 'script/ops/debug-ops';
import { RegisterKeyword } from 'modules/runtime-datacore';

/// GEMSCRIPT KEYWORD DEFINITION //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class DefTemplate extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('defBlueprint');
    // defTemplate 'HoneyBee' 'Bee'
    this.args = ['blueprintName string', 'baseBlueprint string'];
    this.serialize = this.serialize.bind(this);
    this.compile = this.compile.bind(this);
    this.render = this.render.bind(this);
  }

  /** create smc blueprint code objects for this unit
   *  derived from ScriptUnit, everything after the keyword
   *  e.g. 'HoneyBee', 'Bee'
   */
  compile(parms: any[]): ISMCBundle {
    const blueprintName = parms[0];
    const baseBlueprint = parms[1];
    const progout = [];
    // the compiler format is just an array of functions
    // of form TOpcode, which is:
    // (agent, state) => { do your stuff }
    // can use closures, which makes this work.
    progout.push((agent, state) => {
      console.log('agent blueprint', blueprintName);
      state.stack.push(100);
    });
    progout.push((agent, state) => {
      const a = state.stack.pop();
      console.log('received', a, 'from previous operation');
    });
    // return the ISMCBundle, which is used by compiler
    // to assemble a blueprint by concatenating these arrays
    // into the master blueprint
    return {
      name: blueprintName,
      define: progout,
      defaults: [],
      conditions: []
    };
  }

  /** return a TScriptUnit made from current state */
  serialize(state: any): TScriptUnit {
    const { blueprintName, baseBlueprint } = state;
    return [this.keyword, blueprintName, baseBlueprint];
  }

  /** return rendered component representation */
  // TScriptUnit is [ 'keyword', parm1, parm2, ... ]
  render(index: number, srcLine: TScriptUnit, children?: any[]): any {
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
  serialize: (state: MyState) => TScriptUnit;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** define a React component */
class ScriptElement extends React.Component<MyProps, MyState> {
  index: number; // ui index
  keyword: string; // keyword
  serialize: (state: MyState) => TScriptUnit;
  //
  constructor(props: MyProps) {
    super(props);
    const { index, state, serialize } = props;
    this.index = index;
    this.state = { ...state }; // copy state prop
    this.serialize = serialize;
    this.onChange = this.onChange.bind(this);
  }

  // this (1) updates the local ui (2) sends the change to the app
  // renderer, so it can update the source array
  onChange(e) {
    this.setState({ blueprintName: e.currentTarget.value }, () => {
      const updata: IScriptUpdate = {
        index: this.index,
        scriptUnit: this.serialize(this.state)
      };
      UR.RaiseMessage('SCRIPT_SRC_CHANGED', updata);
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
/// see above for keyword export
RegisterKeyword(DefTemplate);
