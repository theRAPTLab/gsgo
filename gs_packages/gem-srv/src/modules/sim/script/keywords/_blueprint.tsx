/* eslint-disable react/prefer-stateless-function */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "_blueprint" command object. It is a little hacky
  because this is how the blueprint name is inserted into the ScriptUnit
  when the # BLUEPRINT syntax is encountered in a ScriptText being converted

  NOTE: This is a SYSTEM KEYWORD used for # BLUEPRINT syntax, and not intended
  for direct use. See _pragma.tsx also.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import Keyword from 'lib/class-keyword';
import { TOpcode, IScriptUpdate, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';

/// GEMSCRIPT KEYWORD DEFINITION //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class _blueprint extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('_blueprint');
    // _blueprint 'HoneyBee' 'Bee'
    this.args = ['blueprintName string', 'baseBlueprint string'];
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

  /** return rendered component representation */
  // TScriptUnit is [ 'keyword', parm1, parm2, ... ]
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    return super.jsx(index, unit, <div>blueprint</div>);
  }
} // end of _blueprint

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(_blueprint);
