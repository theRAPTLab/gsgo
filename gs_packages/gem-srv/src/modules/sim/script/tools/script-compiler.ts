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

import * as DCENGINE from 'modules/datacore/dc-sim-data';
import * as DCBUNDLER from 'modules/datacore/dc-sim-bundler';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import GAgent from 'lib/class-gagent';
import { VSymError } from './symbol-helpers';
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
  if (type === 'program') return DCENGINE.GetProgram(value);
  throw Error(`DecodeToken unhandled type ${type}`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a ScriptUnit, return the 'decoded' tokens as usable valuables when
 *  it is time to invoke a compiler function
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
/** API: A mirror of CompileStatement, extracts the symbol data as a separate
 *  pass so we don't have to rewrite the entire compiler and existing keyword
 *  code. Note that this does not recurse into statement blocks, because the
 *  only keywords in a statement that add symbol data are `addProp` and `when`
 *  which are always level 0 (not nested)
 */
function SymbolizeStatement(statement: TScriptUnit, line?: number): TSymbolData {
  const fn = 'SymbolizeStatement:';
  const kw = CHECK.DecodeKeywordToken(statement[0]);
  if (!kw) return {}; // blank lines emit no symbol info
  const kwp = DCENGINE.GetKeyword(kw);
  if (!kwp) {
    console.warn(`${fn} keyword processor ${kw} bad`);
    return {
      error: { code: 'errExist', info: `missing kwProcessor for: '${kw}'` }
    };
  }
  // ***NOTE***
  // May return empty object, but that just means there are no symbols produced.
  // keywords don't return symbols unless they are adding props or features.
  const kwArgs = DecodeStatement(statement);
  const symbols = kwp.symbolize(kwArgs, line); // these are new objects
  return symbols;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Given statement, return the associated validation data structure
 *  consisting of an array of ValidationTokens and a validationLog with
 *  debug information for each token in the array.
 */
function ValidateStatement(
  statement: TScriptUnit,
  refs: TSymbolRefs
): TValidatedScriptUnit {
  const { bundle, globals } = refs || {};
  const kw = CHECK.DecodeKeywordToken(statement[0]);
  const kwp = DCENGINE.GetKeyword(kw);
  if (kwp !== undefined) {
    kwp.validateInit({ bundle, globals });
    return kwp.validate(statement);
  }
  // if got this far, the keyword was unrecognized
  const keywords = DCENGINE.GetAllKeywords();
  const err = new VSymError('errExist', `invalid keyword '${kw}'`, {
    keywords
  });
  return {
    validationTokens: [err]
  };
}

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Compile a single ScriptUnit, which invokes the Keyord Processor
 *  to generate a TSMCProgram consisting of TOpcodes. This skips directives
 *  and comments, generating no code.
 */
function CompileStatement(
  statement: TScriptUnit,
  line?: number
): TCompiledStatement {
  const fn = 'CompileStatement:';
  const kw = CHECK.DecodeKeywordToken(statement[0]);
  if (!kw) return []; // skips comments, blank lines
  const kwp = DCENGINE.GetKeyword(kw) || DCENGINE.GetKeyword('keywordErr');
  if (!kwp) throw Error(`${fn} bad keyword ${kw}`);
  const kwArgs = DecodeStatement(statement);
  const compiledStatement = kwp.compile(kwArgs, line);
  return compiledStatement;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Compile ScriptUnits into a TSMCProgram (TOpcode[]). It ignores
 *  directives. Use CompileBlueprint() to handle directives.
 */
function CompileScript(script: TScriptUnit[]): TSMCProgram {
  const program: TSMCProgram = [];
  if (script.length === 0) return [];
  // compile unit-by-unit
  let objcode: TCompiledStatement;
  script.forEach((statement, ii) => {
    if (statement[0] === '_pragma') return; // ignore directives
    objcode = CompileStatement(statement);
    program.push(...(objcode as TSMCProgram));
  });
  // return TSMCProgram (TOpcode functions)
  return program;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given an array of scriptunits, scan the top-level statements for _pragma
 *  directives and return what it finds
 */
function ExtractBlueprintDirectives(script: TScriptUnit[]) {
  const fn = 'ExtractBlueprintDirectives:';
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 */
export function CompileBlueprintScript(script: TScriptUnit[]): SM_Bundle {
  const fn = 'CompileBlueprintScript:';
  // get blueprint metadata
  const { BLUEPRINT, TAGS } = ExtractBlueprintDirectives(script);
  const [bpName] = BLUEPRINT;
  // get the bundle to work on
  const bdl = DCENGINE.GetBlueprintBundle(bpName);
  DCBUNDLER.OpenBundle(bdl);
  DCBUNDLER.SetBundleType(EBundleType.BLUEPRINT);

  if (!Array.isArray(script))
    throw Error(`${fn} script should be array, not ${typeof script}`);

  let objcode: TCompiledStatement;
  script.forEach((stm, line) => {
    objcode = CompileStatement(stm, line);
    DCBUNDLER.AddProgram(objcode);
  }); // script forEach
  return DCBUNDLER.CloseBundle();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** DEPRECATED: Compile a script into a bundle, which is automatically saved
 *  under the blueprint name
 *  replaced by CompileBlueprintScript()
 */
function CompileBlueprint(script: TScriptUnit[]): SM_Bundle {
  const fn = 'CompileBlueprint:';
  // get blueprint metadata
  const { BLUEPRINT, TAGS } = ExtractBlueprintDirectives(script);
  const [bpName] = BLUEPRINT;
  // get the bundle to work on
  const bdl = DCENGINE.GetBlueprintBundle(bpName);
  DCBUNDLER.OpenBundle(bdl);
  DCBUNDLER.SetBundleType(EBundleType.BLUEPRINT);
  DCBUNDLER.AddSymbols(GAgent.Symbols); // TODO: move into SymbolizeBlueprint()

  if (!Array.isArray(script))
    throw Error(`${fn} script should be array, not ${typeof script}`);

  let objcode: TCompiledStatement;
  script.forEach((stm, line) => {
    // normal processing of statement
    objcode = CompileStatement(stm, line);
    DCBUNDLER.AddProgram(objcode);
    // TODO: move into SymbolizeBlueprint()
    const symbols = SymbolizeStatement(stm, line);
    DCBUNDLER.AddSymbols(symbols);
  }); // script forEach

  if (!DCBUNDLER.HasBundleName) throw Error(`${fn} missing BLUEPRINT directive`);
  return DCBUNDLER.CloseBundle();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { ExtractBlueprintDirectives };
export { CompileScript, CompileBlueprint };
export {
  DecodeToken,
  DecodeTokenPrimitive,
  DecodeStatement,
  SymbolizeStatement,
  ValidateStatement
};
