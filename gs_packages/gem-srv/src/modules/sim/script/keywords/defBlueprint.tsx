/* eslint-disable react/prefer-stateless-function */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "defBlueprint" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { TOpcode, IScriptUpdate, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/runtime-datacore';

/// GEMSCRIPT KEYWORD DEFINITION //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class defBlueprint extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('defBlueprint');
    // defBlueprint 'HoneyBee' 'Bee'
    this.args = ['blueprintName string', 'baseBlueprint string'];
    this.serialize = this.serialize.bind(this);
    this.compile = this.compile.bind(this);
    this.jsx = this.jsx.bind(this);
  }

  /** create smc blueprint code objects for this unit
   *  derived from ScriptUnit, everything after the keyword
   *  e.g. 'HoneyBee', 'Bee'
   */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, blueprintName, baseBlueprint] = unit;
    const progout = [];
    // the compiler format is just an array of functions
    // of form TOpcode, which is:
    // (agent, state) => { do your stuff }
    // can use closures, which makes this work.
    progout.push((agent, state) => {});
    // return the ISMCBundle, which is used by compiler
    // to assemble a blueprint by concatenating these arrays
    // into the master blueprint
    return progout;
  }

  /** return a TScriptUnit made from current state */
  serialize(state: any): TScriptUnit {
    const { blueprintName, baseBlueprint } = state;
    return [this.keyword, blueprintName, baseBlueprint];
  }

  /** return rendered component representation */
  // TScriptUnit is [ 'keyword', parm1, parm2, ... ]
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const state = {
      blueprintName: unit[1],
      baseBlueprint: unit[2]
    };
    return super.jsx(
      index,
      unit,
      <ScriptElement index={index} state={state} serialize={this.serialize} />
    );
  }
} // end of DefBlueprint

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
      <>
        <span>blueprintName</span>{' '}
        <input onChange={this.onChange} type="text" value={blueprintName} />
      </>
    );
  }
} // end script element

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(defBlueprint);
