/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "_pragma" keyword object, which is represented
  by a leading # in scriptText

  It implements a number of compiler directives, which are defined in the
  PRAGMA dictionary below. They tap directly into the DCBUNDLER, which
  is keeping track of the current bundle target, to set directives as they
  are encountered

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import * as DCBUNDLER from 'modules/datacore/dc-sim-bundler';
import * as DCENGINE from 'modules/datacore/dc-sim-data';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** the _pragma directives (e.g. #BUNDLE bundletype) return SMCPrograms that
 *  are run IMMEDIATELY after the _pragma is invoked, using a dummy agent
 *  and state object inside CompileRawUnit() of Transpiler
 */
const PRAGMA = {
  'BLUEPRINT': (name, parent) => {
    DCBUNDLER.SetBundleName(name, parent);
    return [];
  },
  'PROGRAM': libName => {
    DCBUNDLER.SetProgramOut(libName);
    return [];
  },
  'TAG': (tagName, value) => {
    DCBUNDLER.SetBundleTag(tagName, value);
    return [];
  }
};

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class _pragma extends Keyword {
  // base pragmaerties defined in KeywordDef

  constructor() {
    super('_pragma');
    this.args = ['pragmaName:pragma', '*:{...}'];
  }

  /** create smc blueprint code objects */
  compile(params: TArguments): TOpcode[] {
    // don't do anything if the bundler is inactive, as it is for the
    // case when compiling a script outside of a blueprint
    if (!DCBUNDLER.BundlerActive()) return [];

    // get a valid pragma
    const [, pragmaName, ...args] = params;
    const processor = PRAGMA[(pragmaName as string).toUpperCase()];
    if (processor === undefined) {
      DCBUNDLER.LogKeywordError(this.keyword, params);
      return [];
    }
    // got this far, then it's a valid pragma and we run it
    const out = processor(...args);

    if (out.length > 0) return out; // pragma returns a program
    return []; // return null program otherwise
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
DCENGINE.RegisterKeyword(_pragma);
