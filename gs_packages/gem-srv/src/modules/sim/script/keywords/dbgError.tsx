/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword error command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { KeywordDef } from 'lib/class-kw-definition';
import { IAgentTemplate, ScriptUpdate, ScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from '../keyword-factory';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class dbgError extends KeywordDef {
  // base properties defined in KeywordDef
  constructor() {
    super('dbgError');
    this.args = ['error string'];
    this.req_scope.add('TBD');
    this.key_scope.add('TBD');
  }

  /** create smc template code objects */
  compile(parms: string[]): IAgentTemplate {
    const error = parms[0];
    const progout = [];
    progout.push(`smc_dbg_err( ${error} )`);
    return {
      define: progout,
      defaults: [],
      conditions: []
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): ScriptUnit {
    const { error } = state;
    return [this.keyword, error];
  }

  /** return rendered component representation */
  render(index: number, args: any, children?: any[]): any {
    const [error] = args;
    // return `<UseFeature label='${featureName}'><PropList/><MethodList/></UseFeature>`;
    return (
      <div key={this.generateKey()} className="dbgError" style={{ color: 'red' }}>
        unknown keyword: {`'${error}'`}
      </div>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// make sure you import this at some point with
/// import from 'file'
RegisterKeyword(dbgError);
