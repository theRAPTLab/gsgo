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
import SM_Agent from 'lib/class-sm-agent';
import VSDToken from 'script/tools/class-validation-token';
import { ParseExpression } from './class-expr-parser-v2';
import { Evaluate } from 'lib/expr-evaluator';

import { DEBUG_FLAGS } from 'config/dev-settings';
const { SYMBOLIZE_CALLS: DBG_SC } = DEBUG_FLAGS;

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
function DecodeTokenPrimitive(arg: IToken) {
  const [type, value] = CHECK.UnpackToken(arg);
  if (type === undefined) {
    console.warn(
      'unknown argument type:',
      arg,
      `converted to: type:${type},value:${value}`
    );
    throw Error('DecodeTokenPrimitive: unknown argument type');
  }
  if (type === 'comment') return `// ${value}`;
  return value;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Converts scriptToken to the runtime value pased to keyword methods
 *  like compiler(), symbolize(), and validate()
 */
function DecodeToken(tok: IToken, refs: TSymbolRefs): any {
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
  if (type === 'block') return CompileScript(value, refs);
  if (type === 'program') return SIMDATA.GetProgram(value);
  throw Error(`DecodeToken unhandled type ${type}`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a ScriptUnit, return the 'decoded' tokens as usable valuables when
 *  it is time to invoke a compiler function. See also UnpackStatement() for
 *  a similar function that returns [type,value] (in dc-sim-data-utils)
 */
function DecodeStatement(
  statement: TScriptUnit,
  refs: TSymbolRefs
): TKWArguments {
  const dUnit: TScriptUnit = statement.map((tok, line) => {
    if (line === 0) {
      const arg = DecodeToken(tok, refs);
      if (typeof arg === 'object' && arg.comment) return '_comment';
      return arg;
    }
    return DecodeToken(tok, refs);
  });
  return dUnit;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given an array of scriptunits, scan the top-level statements for _pragma
 *  directives and return what it finds
 */
function ExtractBlueprintMeta(script: TScriptUnit[]): TBlueprintMeta {
  const fn = 'ExtractBlueprintMeta:';
  const bundle = new SM_Bundle('ExtractBlueprintMeta');
  const refs = { bundle, globals: {} };
  let bpName: string;
  let bpBase: string;
  let programs = new Set();
  let tags = new Map();
  script.forEach(stm => {
    const [kwTok, dirTok, ...arg] = stm;
    const [, kw] = CHECK.UnpackToken(kwTok);
    if (kw !== '#') return;
    const [, directive] = CHECK.UnpackToken(dirTok);
    switch (directive.toUpperCase()) {
      case 'BLUEPRINT':
        if (!bpName) {
          bpName = DecodeToken(arg[0], refs);
          if (arg[1]) bpBase = DecodeToken(arg[1], refs);
        } else throw Error(`${fn} blueprint name repeated`);
        break;
      case 'PROGRAM':
        programs.add(DecodeToken(arg[0], refs));
        break;
      case 'TAG':
        tags.set(DecodeToken(arg[0], refs), DecodeToken(arg[1], refs));
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
 *  pass. This only needs to handle the level 0 statements, as statements
 *  inside of blocks do not have symbol data...I hope */
function SymbolizeStatement(stm: TScriptUnit, line?: number): TSymbolData {
  const fn = 'SymbolizeStatement:';
  if (!stm || (Array.isArray(stm) && stm.length < 1)) return {}; // blank lines emit no symbol info
  const kw = CHECK.DecodeKeywordToken(stm[0]);
  if (!kw) return {}; // blank lines emit no symbol info
  const kwp = SIMDATA.GetKeyword(kw);
  if (!kwp) {
    console.warn(`${fn} keyword processor ${kw} bad`);
    return {
      error: { code: 'invalid', info: `missing kwProcessor for: '${kw}'` }
    };
  }
  // NOTE: most keywords don't return symbols because they don't add props
  const symbols = kwp.symbolize(stm, line); // these are new objects
  return symbols;
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
  let bpName;
  // open provided bundle or look it up in SIMDATA by bpName
  if (bdl instanceof SM_Bundle) {
    BUNDLER.OpenBundle(bdl);
    bpName = BUNDLER.BundlerState().bpName;
    if (DBG_SC)
      console.warn(`${fn} xxxbdl %c${bpName}`, 'font-style:bold;color:green');
  } else {
    const { BLUEPRINT, TAGS } = ExtractBlueprintMeta(script);
    [bpName] = BLUEPRINT;
    BUNDLER.OpenBundle(bpName);
    if (DBG_SC)
      console.warn(`${fn} sysbdl %c${bpName}`, 'font-style:bold;color:green');
  }
  // setup bundle type
  BUNDLER.SetBundleType(EBundleType.BLUEPRINT);
  // add default agent symbols
  BUNDLER.AddSymbols(SM_Agent.Symbols);
  // symbolize statement-by-statement
  script.forEach((stm, line) => {
    const symbols = SymbolizeStatement(stm, line);
    if (DBG && symbols) console.log(line, 'adding symbols', symbols);
    BUNDLER.AddSymbols(symbols);
  }); // script forEach
  // store script in bundle
  BUNDLER.SaveScript(script);
  // return bundle
  return BUNDLER.CloseBundle();
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
  if (statement === undefined)
    return { validationTokens: [], validationLog: ['undefined statement'] };
  if (statement.length === 0)
    return { validationTokens: [], validationLog: ['zero-length statement'] };
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
/** API: Given a compiled expression in AST form, see if it is accessing
 *  defined globals */
function ValidateExpression(exprAST, globals = {}) {
  const result = Evaluate(exprAST, globals);
  return result;
}

/// COMPILER API //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Compile a single ScriptUnit, which invokes the Keyord Processor
 *  to generate a TSMCProgram consisting of TOpcodes. This skips directives
 *  and comments, generating no code. */
function CompileStatement(
  stm: TScriptUnit,
  refs: TSymbolRefs
): TCompiledStatement {
  const fn = 'CompileStatement:';
  const kw = CHECK.DecodeKeywordToken(stm[0]);
  if (!kw) return []; // skips comments, blank lines
  const kwp = SIMDATA.GetKeyword(kw) || SIMDATA.GetKeyword('keywordErr');
  if (!kwp) throw Error(`${fn} bad keyword ${kw}`);
  const kwArgs = DecodeStatement(stm, refs);
  const compiledStatement = kwp.compile(kwArgs, refs);
  return compiledStatement;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Compile ScriptUnits into a TSMCProgram (TOpcode[]). It ignores
 *  directives. Use CompileBlueprint() to handle directives.
 *  @param {TScriptUnit[]} script - tokenized scriptText
 *  @returns TSMCProgram
 */
function CompileScript(script: TScriptUnit[], refs: TSymbolRefs): TSMCProgram {
  if (refs === undefined) throw Error(`CompileScript: No Refs`);
  const program: TSMCProgram = [];
  if (script.length === 0) return [];
  // compile unit-by-unit
  script.forEach((statement, ii) => {
    const objcode = CompileStatement(statement, refs);
    program.push(...(objcode as TSMCProgram));
  });
  return program;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Given a blueprint script, extract the name and save it to the
 *  simulation blueprint dictionary, and returns the bundle. */
function CompileBlueprint(script: TScriptUnit[], tempBdl?: SM_Bundle): SM_Bundle {
  const fn = 'CompileBlueprint:';
  let bpName;
  // open provided bundle or look it up in SIMDATA by bpName
  if (tempBdl instanceof SM_Bundle) {
    BUNDLER.OpenBundle(tempBdl);
    bpName = BUNDLER.BundlerState().bpName;
    console.warn(`${fn} TMP bdl %c${bpName}`, 'font-style:bold;color:blue');
  } else {
    const { BLUEPRINT, TAGS } = ExtractBlueprintMeta(script);
    [bpName] = BLUEPRINT;
    BUNDLER.OpenBundle(bpName);
    if (DBG_SC)
      console.warn(`${fn} SYS bdl %c${bpName}`, 'font-style:bold;color:blue');
  }
  // setup bundle type
  BUNDLER.SetBundleType(EBundleType.BLUEPRINT);
  // compile statement-by-statement

  const refs = BUNDLER.SymbolRefs();
  if (DBG_SC) console.log('refs are', refs);
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

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// MAIN API
export { CompileBlueprint, SymbolizeBlueprint };
/// UTILITIES
export { ExtractBlueprintMeta, CompileScript };
export {
  DecodeToken,
  DecodeTokenPrimitive,
  DecodeStatement,
  SymbolizeStatement,
  ValidateStatement,
  ValidateExpression
};
