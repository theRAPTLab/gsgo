/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "pragma" keyword object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword, SetBundleOut } from 'modules/runtime-datacore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** the pragma directives (e.g. #BUNDLE bundletype) return SMCPrograms that
 *  are run IMMEDIATELY after the pragma is invoked, using a dummy agent
 *  and state object inside CompileRawUnit() of Transpiler
 */
const PRAGMA = {
  'BLUEPRINT': (blueprintName, baseBlueprint) => {
    return (agent, state) => {
      state.stack.push('defBlueprint', blueprintName, baseBlueprint);
    };
  },
  'DEFINE': () => SetBundleOut('define'),
  'INIT': () => SetBundleOut('init'),
  'UPDATE': () => SetBundleOut('update'),
  'THINK': () => SetBundleOut('think'),
  'EXEC': () => SetBundleOut('exec'),
  'CONDITION': () => SetBundleOut('condition'),
  'TEST': () => SetBundleOut('test'),
  'ALTERNATE': () => SetBundleOut('alter'),
  'CONSEQUENT': () => SetBundleOut('conseq')
};

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class pragma extends Keyword {
  // base pragmaerties defined in KeywordDef

  constructor() {
    super('pragma');
    this.args = ['pragmaName:string', '...args'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, pragmaName, ...args] = unit;
    const pragmatizer = PRAGMA[pragmaName.toUpperCase()];
    const program = pragmatizer(...args);
    // the output of the pragmatizer is either a TOpcode,
    // a TOpcode[], or nothing. This program receives
    // a compiler agent and a compiler state that is unique
    // to the compile loop.
    if (Array.isArray(program)) return program;
    if (typeof program === 'function') return [program];
    // if nothing returns, reset the COMPILER_STATE
    return [(agent, state) => state.reset()];
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { pragmaName, value } = state;
    return [this.keyword, pragmaName, value];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const pragmaName = unit[1];
    const value = unit[2];
    return super.jsx(
      index,
      unit,
      <>
        pragma {pragmaName} = {value}
      </>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(pragma);
