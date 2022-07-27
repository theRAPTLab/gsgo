/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "_pragma" keyword object, which is represented
  by a leading # in scriptText

  It implements a number of compiler directives, which are defined in the
  PRAGMA dictionary below. They tap directly into the BUNDLER, which
  is keeping track of the current bundle target, to set directives as they
  are encountered

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import * as BUNDLER from 'script/tools/script-bundler';
import * as SIMDATA from 'modules/datacore/dc-sim-data';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** the _pragma directives (e.g. #BUNDLE bundletype) return SMCPrograms that
 *  are run IMMEDIATELY after the _pragma is invoked, using a dummy agent
 *  and state object inside CompileRawUnit() of Transpiler */
SIMDATA.DefinePragma('BLUEPRINT', (name, parent) => {
  BUNDLER.SetBundleName(name, parent);
  return [];
});
SIMDATA.DefinePragma('PROGRAM', libName => {
  BUNDLER.SetProgramOut(libName);
  return [];
});
SIMDATA.DefinePragma('TAG', (tagName, value) => {
  BUNDLER.SetBundleTag(tagName, value);
  return [];
});

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class _directive extends Keyword {
  // base pragmaerties defined in KeywordDef

  constructor() {
    super('_directive');
    this.args = ['pragmaName:pragma', '*:{...}'];
  }

  /** create smc blueprint code objects */
  compile(params: TKWArguments): TOpcode[] {
    // don't do anything if the bundler is inactive, as it is for the
    // case when compiling a script outside of a blueprint
    if (!BUNDLER.BundlerActive()) return [];

    // get a valid pragma
    const [, pragmaName, ...args] = params;
    const processor = SIMDATA.GetPragma((pragmaName as string).toUpperCase());
    if (processor === undefined) {
      BUNDLER.LogKeywordError(this.keyword, params);
      return [];
    }
    // got this far, then it's a valid pragma and we run it
    const out = processor(...args);

    if (out.length > 0) return out; // pragma returns a program
    return []; // return null program otherwise
  }

  validate(unit: TScriptUnit): TValidatedScriptUnit {
    const vtoks = []; // validation token array
    const [kwTok, dirTok, ...argToks] = unit; // get arg pattern
    vtoks.push(this.shelper.anyKeyword(kwTok));
    vtoks.push(this.shelper.pragma(dirTok));
    // HACK Hide Blueprint subclasses to prevent novice editor error!!!
    if (String(dirTok.identifier).toLowerCase() === 'blueprint') {
      // only show blueprint name, skip base name
      vtoks.push(...this.shelper.pragmaArgs([argToks[0]]));
    } else {
      // show all parameters
      vtoks.push(...this.shelper.pragmaArgs(argToks));
    }
    const log = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: log };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
SIMDATA.RegisterKeyword(_directive);
