/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword error command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { ISMCBundle, TScriptUpdate, ScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from '../keyword-factory';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class dbgError extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('dbgError');
    this.args = ['...parms'];
  }

  /** create smc blueprint code objects */
  compile(parms: any[]): ISMCBundle {
    const progout = [];
    progout.push(() => {
      console.warn(`unknown: ${this.keyword}(${parms.join(', ')})`);
    });
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
