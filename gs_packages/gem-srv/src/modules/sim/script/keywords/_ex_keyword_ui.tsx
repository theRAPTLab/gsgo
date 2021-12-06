/* eslint-disable react/prefer-stateless-function */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword defTemplate command object
  THIS CODE DOESN'T RUN IN THE CURRENTVERSION

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';

import Keyword from '../../../../lib/class-keyword';
import { TOpcode, TScriptUnit } from '../../../../lib/t-script';
import { RegisterKeyword, GetTest, UtilFirstValue } from '../../../datacore';

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
  serialize: (state: MyState) => TScriptUnit;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ScriptElement extends React.Component<MyProps, MyState> {
  index: number; // ui index
  keyword: string; // keyword
  serialize: (state: MyState) => TScriptUnit;
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
      const updata = {
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
export class defTemplate extends Keyword {
  // base properties defined in Keyword
  constructor() {
    super('defTemplate');
    this.args = ['templateName string', 'baseTemplate string'];
  }

  /** create smc template code objects for this unit */
  compile(unit: TScriptUnit): TOpcode[] {
    // this is example code for <ScriptElement>, so don't emit anything
    return [];
  }

  /** return a ScriptUnit made from current state */
  serialize(state: any): TScriptUnit {
    const { templateName, baseTemplate } = state;
    return [this.keyword, templateName, baseTemplate];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    // note that styleIndex below has to have weird typescript
    // stuff for originally hyphenated CSS properties so it doesn't
    // get marked by the linter as invalid CSS
    const state = {
      templateName: unit[1],
      baseTemplate: unit[2]
    };
    return super.jsx(index, unit, <>ex_keyword_ui</>);
  }
} // end of DefTemplate

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
