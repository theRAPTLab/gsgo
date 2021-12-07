/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "_pragma" keyword object

  NOTE: This is a SYSTEM KEYWORD used for "# DIRECTIVE" syntax, and not
  intended for direct use. It implements a number of compiler directives,
  which are defined in the PRAGMA dictionary below.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from 'lib/class-keyword';
import { IAgent, IState, TArguments, TOpcode, TScriptUnit } from 'lib/t-script';
import { SetBundleOut } from 'modules/datacore/dc-script-bundle';
import { RegisterKeyword } from 'modules/datacore/dc-script-engine';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** the _pragma directives (e.g. #BUNDLE bundletype) return SMCPrograms that
 *  are run IMMEDIATELY after the _pragma is invoked, using a dummy agent
 *  and state object inside CompileRawUnit() of Transpiler
 */
const PRAGMA = {
  'BLUEPRINT': (blueprintName, baseBlueprint) => {
    return (agent, state) => {
      // The stack is read by transpiler if a BLUEPRINT pragma
      // is detected as a special case. This is how the transpiler
      // knows what the blueprintname is!
      state.stack.push('_blueprint', blueprintName, baseBlueprint);
    };
  },
  'PROGRAM': libName => SetBundleOut(libName)
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
  compile(params: TArguments): TOpcode[] {
    const [kw, pragmaName, ...args] = params;
    const pragmatizer = PRAGMA[(pragmaName as string).toUpperCase()];
    const program = pragmatizer(...args);
    // the output of the pragmatizer is either a TOpcode,
    // a TOpcode[], boolean, or void.
    // Note that the runtime context is different for
    // pragma TOpcode[]. It's transpile-time, not
    // during runtime.

    if (Array.isArray(program)) return program;
    if (typeof program === 'function') return [program];
    // if nothing returns, reset the COMPILER_STATE
    return [(agent, state) => state.reset()];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const pragmaName = unit[1];
    return <>{pragmaName}</>;
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(_pragma);
