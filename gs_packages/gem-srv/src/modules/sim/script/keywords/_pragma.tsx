/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "_pragma" keyword object

  NOTE: This is a SYSTEM KEYWORD used for "# DIRECTIVE" syntax, and not
  intended for direct use. It implements a number of compiler directives,
  which are defined in the PRAGMA dictionary below.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword, SetBundleOut } from 'modules/runtime-datacore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** the _pragma directives (e.g. #BUNDLE bundletype) return SMCPrograms that
 *  are run IMMEDIATELY after the _pragma is invoked, using a dummy agent
 *  and state object inside CompileRawUnit() of Transpiler
 */
const PRAGMA = {
  'BLUEPRINT': (blueprintName, baseBlueprint) => {
    return (agent, state) => {
      state.stack.push('_blueprint', blueprintName, baseBlueprint);
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
export class _pragma extends Keyword {
  // base pragmaerties defined in KeywordDef

  constructor() {
    super('_pragma');
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
        # {pragmaName} {unit.slice(2).join(' ')}
      </>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(_pragma);
