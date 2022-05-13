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

import * as DCENGINE from 'modules/datacore/dc-sim-resources';
import * as DCBUNDLER from 'modules/datacore/dc-sim-bundler';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import GAgent from 'lib/class-gagent';
import { VSymError } from './symbol-helpers';
import { ParseExpression } from './class-expr-parser-v2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('COMPILE', 'TagDebug');

/// COMPILER SUPPORT FUNCTIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** filter-out errors in the code array, which are non-functions, so we are
 *  returning a pure code array
 */
function m_StripErrors(
  code: TCompiledStatement,
  unit: TScriptUnit,
  ...args: any[]
): TSMCProgram {
  const out = code.filter(f => {
    if (typeof f === 'function') return true;
    if (Array.isArray(f)) {
      // didn't get a function return, so it must be an error code
      const [err, line] = f as any[];
      const where = line !== undefined ? `line ${line}` : '';
      console.log(...PR(`fn: ${err} ${where}`), unit);
    }
    // got a single string, so is error
    if (typeof f === 'string')
      console.log(...PR(`fn: '${f}' ${args.join(' ')}`), unit);
    return false;
  });
  return out as TSMCProgram;
}

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
    objcode = m_StripErrors(objcode, statement);
    program.push(...(objcode as TSMCProgram));
  });
  // return TSMCProgram (TOpcode functions)
  return program;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** CompileBlueprint parses # DIRECTIVES to set up a program bundle. It
 *  returns a NEW bundle, because there are times you want a bundle
 *  but it doesn't actually store them.
 */
function CompileBlueprint(script: TScriptUnit[]): SM_Bundle {
  const fn = 'CompileBlueprint:';
  let objcode: TCompiledStatement;
  const bdl = new SM_Bundle();
  bdl.setType(EBundleType.BLUEPRINT);
  // TODO: move the symbolizer to a new SymbolizeBlueprint() call
  DCBUNDLER.AddSymbol(bdl, GAgent.Symbols);
  //
  if (!Array.isArray(script))
    throw Error(`${fn} script should be array, not ${typeof script}`);
  if (script.length === 0) return bdl;

  script.forEach((stm, line) => {
    // special case 1: first line must be # BLUEPRINT directive
    if (line === 0) {
      const [lead, kw, bpName, bpParent] = DecodeStatement(stm);
      if (lead === '_pragma' && kw.toUpperCase() === 'BLUEPRINT') {
        if (DBG) console.log(...PR('compiling', bpName));
        DCBUNDLER.SetBundleName(bdl, bpName, bpParent);
        return;
      }
      throw Error(`${fn} # BLUEPRINT must be first line in script`);
    }

    // special case 2: tag processing
    const [lead, kw, tagName, tagValue] = DecodeStatement(stm);
    if (lead === '_pragma' && kw.toUpperCase() === 'TAG') {
      DCBUNDLER.BundleTag(bdl, tagName, tagValue);
      return;
    }

    // normal processing of statement
    objcode = CompileStatement(stm, line);
    objcode = m_StripErrors(objcode, stm);
    // save objcode to current bundle section, which can be changed
    // through pragma PROGRAM
    DCBUNDLER.BundleOut(bdl, objcode);
    // TODO: move the symbolizer to a new SymbolizeBlueprint() call
    const symbols = SymbolizeStatement(stm, line);
    DCBUNDLER.AddSymbol(bdl, symbols);
  }); // script forEach

  if (bdl.name === undefined) throw Error(`${fn} missing BLUEPRINT directive`);
  // always add GAgent.Symbols, which are the default built-in props
  // TODO: remove the duplicate AddSymbol when writing SymbolizeBlueprint
  // DCBUNDLER.AddSymbol(bdl, GAgent.Symbols);
  // set type to "BLUEPRINT" (there are other bundle types too)
  bdl.setType(EBundleType.BLUEPRINT);
  return bdl;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given an array of scriptunits, scan the top-level statements for _pragma
 *  directives and return what it finds
 */
function ExtractDirectives(script: TScriptUnit[]) {
  script.forEach(stm => {
    const kw = CHECK.DecodeKeywordToken(stm[0]);
  });
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { CompileScript, CompileBlueprint };
export {
  DecodeToken,
  DecodeTokenPrimitive,
  DecodeStatement,
  SymbolizeStatement,
  ValidateStatement,
  ExtractDirectives
};
