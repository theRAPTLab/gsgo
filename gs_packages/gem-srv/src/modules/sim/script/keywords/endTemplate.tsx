/* eslint-disable react/prefer-stateless-function */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword endTemplate command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import { KeywordDef } from 'lib/class-kw-definition';
import { IAgentTemplate, ScriptUpdate, ScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from '../keyword-factory';

/// CLASS DEFINITION 2 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** closing tag, not shown in GUI but required when using DefTemplate */
export class EndTemplate extends KeywordDef {
  args: string[];
  reg_scope: Set<string>;
  key_scope: Set<string>;

  constructor() {
    super('endTemplate');
  }

  /** create smc template code objects */ compile(
    parms: string[]
  ): IAgentTemplate {
    const progout = [];
    progout.push(() => console.log('no op'));
    return {
      define: progout
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
RegisterKeyword(EndTemplate);
