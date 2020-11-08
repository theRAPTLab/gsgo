/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword useFeature command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { KeywordDef } from 'lib/class-kw-definition';
import { IAgentBlueprint, ScriptUpdate, ScriptUnit } from 'lib/t-script';
import { addFeature } from 'script/ops/op-imports';
import { RegisterKeyword } from '../keyword-factory';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class UseFeature extends KeywordDef {
  // base properties defined in KeywordDef
  constructor() {
    super('useFeature');
    this.args = ['featureName string'];
    this.req_scope.add('defBlueprint');
    this.key_scope.add('TBD');
  }

  /** create smc blueprint code objects */
  compile(parms: any[]): IAgentBlueprint {
    const featureName = parms[0];
    const progout = [];
    progout.push(addFeature(featureName));
    return {
      define: progout,
      defaults: [],
      conditions: []
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): ScriptUnit {
    const { featureName } = state;
    return [this.keyword, featureName];
  }

  /** return rendered component representation */
  render(index: number, args: any, children?: any[]): any {
    const [featureName] = args;
    // return `<UseFeature label='${featureName}'><PropList/><MethodList/></UseFeature>`;
    return (
      <div key={this.generateKey()} className="useFeature">
        feature {featureName} has props, methods
      </div>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// make sure you import this at some point with
/// import from 'file'
RegisterKeyword(UseFeature);
