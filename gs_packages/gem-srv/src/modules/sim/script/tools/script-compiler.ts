/* eslint-disable @typescript-eslint/dot-notation */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert text to Script Units Tokens. It does not test the validity of then
  produced tokens.

  BASIC SCRIPT PROCESSING

  do_script
  - script is array of statements
  - call do_statement on each statement in script
  - save results of do_statement

  do_statement
  - statement is array of tokens
  - use first token to load a keyword processor
  - call do_token on each token in array
  - send decoded tokens through keyword processor
  - return results of processor

  do_token
  - token may be converted to values or strings with UnpackToken
  - token may be further processed depending on type
  - critically, block tokens have to recursively call do_script

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

// uses types in t-script.d
import { EBundleType } from 'modules/../types/t-script.d'; // workaround to import as obj
import SM_Bundle from 'lib/class-sm-bundle';

import * as SIMDATA from 'modules/datacore/dc-sim-data';
import * as BUNDLER from 'script/tools/script-bundler';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import SM_Agent from 'lib/class-gagent';
import VSDToken from 'script/tools/class-validation-token';
import { ParseExpression } from './class-expr-parser-v2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('COMPILE', 'TagDebug');

/// SUPPORT API ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility to return the 'decoded' value of a token
 *  note: gscript-tokenizer now has an improved version of this called
 *  UnpackToken, which returns [ type, value ] instead of the primitive
 *  value or token. TODO: review whether it should replace DecodeToken
 */
function DecodeTokenPrimitive(arg) {
  const [type, value] = CHECK.UnpackToken(arg);
  if (type === undefined) {
    console.warn('unknown argument type:', arg);
    throw Error('DecodeTokenPrimitive: unknown argument type');
  }
  if (type === 'comment') return `// ${value}`;
  return value;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Converts scriptToken to the runtime value pased to keyword methods
 *  like compiler(), symbolize(), and validate()
 */
function DecodeToken(tok: IToken): any {
  const [type, value] = CHECK.UnpackToken(tok);
  if (type === undefined)
    throw Error(`DecodeToken: invalid token ${JSON.stringify(tok)}`);
  if (type === 'identifier') return value;
  if (type === 'objref') return { objref: value };
  if (type === 'string') return value;
  if (type === 'value') return value;
  if (type === 'line') return value;
  if (type === 'expr') return { expr: ParseExpression(value) };
  if (type === 'comment') return { comment: value };
  if (type === 'directive') return '_pragma';
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  if (type === 'block') return CompileScript(value);
  if (type === 'program') return SIMDATA.GetProgram(value);
  throw Error(`DecodeToken unhandled type ${type}`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a ScriptUnit, return the 'decoded' tokens as usable valuables when
 *  it is time to invoke a compiler function. See also UnpackStatement() for
 *  a similar function that returns [type,value] (in dc-sim-data-utils)
 */
function DecodeStatement(statement: TScriptUnit): any[] {
  const dUnit: TScriptUnit = statement.map((tok, line) => {
    if (line === 0) {
      const arg = DecodeToken(tok);
      if (typeof arg === 'object' && arg.comment) return '_comment';
      return arg;
    }
    return DecodeToken(tok);
  });
  return dUnit;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given an array of scriptunits, scan the top-level statements for _pragma
 *  directives and return what it finds
 */
function ExtractBlueprintMeta(script: TScriptUnit[]): TBlueprintMeta {
  const fn = 'ExtractBlueprintMeta:';
  let bpName: string;
  let bpBase: string;
  let programs = new Set();
  let tags = new Map();
  script.forEach(stm => {
    const [kw, directive, ...args] = DecodeStatement(stm);
    if (kw !== '_pragma') return;
    switch (directive.toUpperCase()) {
      case 'BLUEPRINT':
        if (!bpName) {
          [bpName, bpBase] = args;
        } else throw Error(`${fn} blueprint name repeated`);
        break;
      case 'PROGRAM':
        programs.add(args[0]);
        break;
      case 'TAG':
        tags.set(args[0], args[1]);
        break;
      default: // do nothing
    }
  });
  const PROGRAMS = {};
  [...programs].forEach(k => {
    PROGRAMS[k as string] = true;
  });
  const TAGS = {};
  [...tags.keys()].forEach(k => {
    TAGS[k] = tags.get(k);
  });
  return {
    BLUEPRINT: [bpName, bpBase],
    PROGRAMS,
    TAGS
  };
}

/// SYMBOLIZE API /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: A mirror of CompileStatement, extracts the symbol data as a separate
 *  pass so we don't have to rewrite the entire compiler and existing keyword
 *  code. Note that this does not recurse into statement blocks, because the
 *  only keywords in a statement that add symbol data are `addProp` and `when`
 *  which are always level 0 (not nested)
 *  @param {TScriptUnit} statement - a line of script tokens to validate
 *  @param {number} [line] - current line being symbolized metadata
 *  @returns TSymbolData
 *  @returns TValidatedScriptUnit
 */
function SymbolizeStatement(statement: TScriptUnit, line?: number): TSymbolData {
  const fn = 'SymbolizeStatement:';
  const kw = CHECK.DecodeKeywordToken(statement[0]);
  if (!kw) return {}; // blank lines emit no symbol info
  const kwp = SIMDATA.GetKeyword(kw);
  if (!kwp) {
    console.warn(`${fn} keyword processor ${kw} bad`);
    return {
      error: { code: 'invalid', info: `missing kwProcessor for: '${kw}'` }
    };
  }
  // ***NOTE***
  // May return empty object, but that just means there are no symbols produced.
  // keywords don't return symbols unless they are adding props or features.
  const kwArgs = DecodeStatement(statement);
  const symbols = kwp.symbolize(kwArgs, line); // these are new objects
  return symbols;
}

/// VALIDATION API ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Given statement, return the associated validation data structure
 *  consisting of an array of ValidationTokens and a validationLog with
 *  debug information for each token in the array.
 *  @param {TScriptUnit} statement - a line of script tokens to validate
 *  @param {TSymbolRefs} refs - bundle, global references context to use
 *  @returns TValidatedScriptUnit
 */
function ValidateStatement(
  statement: TScriptUnit,
  refs: TSymbolRefs
): TValidatedScriptUnit {
  // check for zero-length statements and blank statements comments or lines)
  if (statement.length === 0) return { validationTokens: [] };
  const { bundle, globals } = refs || {};
  const kw = CHECK.DecodeKeywordToken(statement[0]);
  const kwp = SIMDATA.GetKeyword(kw);
  if (kwp !== undefined) {
    kwp.setRefs({ bundle, globals });
    return kwp.validate(statement);
  }
  // if got this far, the keyword was unrecognized
  const keywords = SIMDATA.GetAllKeywords();
  const err = new VSDToken(
    { keywords },
    {
      gsType: 'keyword',
      err_code: 'invalid',
      err_info: `invalid keyword '${kw}'`
    }
  );
  return {
    validationTokens: [err],
    validationLog: [`unrecognized keyword '${kw}'`]
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Given a blueprint script, create a "page" of "lines" of ValidationTokens
 */
function ValidateBlueprint(script: TScriptUnit[]) {
  // this might store the validation page inside it, instead of using
  // the scriptprinter classes
  // call ValidateStatement() with all the symbolrefs bundle, global
}

/// COMPILER API //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Compile a single ScriptUnit, which invokes the Keyord Processor
 *  to generate a TSMCProgram consisting of TOpcodes. This skips directives
 *  and comments, generating no code.
 *  @param {TScriptUnit} statement - array of ScriptToken
 *  @param {number} [line] - current "line" of script metadata
 *  @returns TSMCProgram
 */
function CompileStatement(
  stm: TScriptUnit,
  refs?: TSymbolRefs
): TCompiledStatement {
  const fn = 'CompileStatement:';
  const kw = CHECK.DecodeKeywordToken(stm[0]);
  if (!kw) return []; // skips comments, blank lines
  const kwp = SIMDATA.GetKeyword(kw) || SIMDATA.GetKeyword('keywordErr');
  if (!kwp) throw Error(`${fn} bad keyword ${kw}`);
  const kwArgs = DecodeStatement(stm);
  const compiledStatement = kwp.compile(kwArgs, refs);
  return compiledStatement;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Compile ScriptUnits into a TSMCProgram (TOpcode[]). It ignores
 *  directives. Use CompileBlueprint() to handle directives.
 *  @param {TScriptUnit[]} script - tokenized scriptText
 *  @returns TSMCProgram
 */
function CompileScript(script: TScriptUnit[], refs?: TSymbolRefs): TSMCProgram {
  const program: TSMCProgram = [];
  if (script.length === 0) return [];
  // compile unit-by-unit
  script.forEach((statement, ii) => {
    console.log(ii, 'compiling', statement);
    const objcode = CompileStatement(statement, refs);
    program.push(...(objcode as TSMCProgram));
  });
  return program;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Given a blueprint script, extract all the symbol information inside
 *  and populate the current bundle .symbols property
 *  @param {TScriptUnit[]} script - tokenized scriptText
 *  @param {SM_Bundle} [bdl] - bundle to use rather than retrieve simdata dict
 *  @returns SM_Bundle
 */
function SymbolizeBlueprint(script: TScriptUnit[], bdl?: SM_Bundle) {
  const fn = 'SymbolizeBlueprint:';
  // open provided bundle or look it up in SIMDATA by bpName
  if (bdl instanceof SM_Bundle) BUNDLER.OpenBundle(bdl);
  else {
    const { BLUEPRINT, TAGS } = ExtractBlueprintMeta(script);
    const [bpName] = BLUEPRINT;
    BUNDLER.OpenBundle(bpName);
  }
  // setup bundle type
  BUNDLER.SetBundleType(EBundleType.BLUEPRINT);
  // add default agent symbols
  BUNDLER.AddSymbols(SM_Agent.Symbols);
  // symbolize statement-by-statement
  script.forEach((stm, line) => {
    const symbols = SymbolizeStatement(stm, line);
    BUNDLER.AddSymbols(symbols);
  }); // script forEach
  // store script in bundle
  BUNDLER.SaveScript(script);
  // return bundle
  return BUNDLER.CloseBundle();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Given a blueprint script, extract the name and save it to the
 *  simulation blueprint dictionary, and returns the bundle.
 *  DOES NOT CALL SYMBOLIZE()
 *  @param {TScriptUnit[]} script - tokenized scriptText
 *  @param {SM_Bundle} [bdl] - bundle to use rather than retrieve simdata dict
 *  @returns SM_Bundle
 */
function CompileBlueprint(script: TScriptUnit[], bdl?: SM_Bundle): SM_Bundle {
  const fn = 'CompileBlueprintScript:';
  // open provided bundle or look it up in SIMDATA by bpName
  if (bdl instanceof SM_Bundle) BUNDLER.OpenBundle(bdl);
  else {
    const { BLUEPRINT, TAGS } = ExtractBlueprintMeta(script);
    const [bpName] = BLUEPRINT;
    BUNDLER.OpenBundle(bpName);
  }
  // setup bundle type
  BUNDLER.SetBundleType(EBundleType.BLUEPRINT);
  // compile statement-by-statement

  const refs = BUNDLER.SymbolRefs();
  script.forEach((stm, line) => {
    refs.line = line;
    const objcode = CompileStatement(stm, refs);
    BUNDLER.AddProgram(objcode);
  });
  // store script in bundle
  BUNDLER.SaveScript(script);
  // return bundle
  return BUNDLER.CloseBundle();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: To create a complete bundle with symbol data and blueprint data,
 *  use this call (replaces the old CompileBlueprint()
 *  WARNING: This doesn't work for blueprints that refer to other blueprints
 */
function BundleBlueprint(script: TScriptUnit[]): SM_Bundle {
  const fn = 'BundleBlueprint:';
  console.warn(`${fn} DEPRECATED`);
  // get blueprint metadata
  const { BLUEPRINT, TAGS } = ExtractBlueprintMeta(script);
  const [bpName] = BLUEPRINT;
  // get the bundle to work on
  BUNDLER.OpenBundle(bpName);
  BUNDLER.SetBundleType(EBundleType.BLUEPRINT);
  BUNDLER.AddSymbols(SM_Agent.Symbols);

  if (!Array.isArray(script))
    throw Error(`${fn} script should be array, not ${typeof script}`);

  const refs = BUNDLER.SymbolRefs();
  console.log(`${fn} compiling ${bpName} w/ refs`, refs);
  script.forEach((stm, line) => {
    // normal processing of statement
    const symbols = SymbolizeStatement(stm, line);
    BUNDLER.AddSymbols(symbols);
    refs.line = line;
    const objcode = CompileStatement(stm, refs);
    BUNDLER.AddProgram(objcode);
  }); // script forEach
  if (!BUNDLER.HasBundleName) throw Error(`${fn} missing BLUEPRINT directive`);
  // store script in bundle
  BUNDLER.SaveScript(script);
  // return bundle
  return BUNDLER.CloseBundle();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// MAIN API
export {
  BundleBlueprint,
  CompileBlueprint,
  ValidateBlueprint,
  SymbolizeBlueprint
};
/// UTILITIES
export { ExtractBlueprintMeta, CompileScript };
export {
  DecodeToken,
  DecodeTokenPrimitive,
  DecodeStatement,
  SymbolizeStatement,
  ValidateStatement
};
