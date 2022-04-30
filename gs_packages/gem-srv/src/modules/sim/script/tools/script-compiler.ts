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

import {
  IKeyword,
  IToken,
  TScriptUnit,
  TCompiledStatement,
  TSMCProgram,
  EBundleType,
  TSymbolData,
  TSymbolRefs,
  TValidatedScriptUnit
} from 'lib/t-script.d';
import SM_Bundle from 'lib/class-sm-bundle';

import * as DCENGINE from 'modules/datacore/dc-sim-resources';
import * as DCBUNDLER from 'modules/datacore/dc-sim-bundler';
import GAgent from 'lib/class-gagent';
import { VSymError } from './symbol-helpers';

import { ParseExpression } from './class-expr-parser-v2';
import GScriptTokenizer, {
  IsValidToken,
  UnpackToken
} from './class-gscript-tokenizer-v2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('COMPILE', 'TagDebug');
const Scriptifier = new GScriptTokenizer();

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
  const [type, value] = UnpackToken(arg);
  if (type === undefined) {
    console.warn('unknown argument type:', arg);
    throw Error('DecodeTokenPrimitive: unknown argument type');
  }
  if (type === 'comment') return `// ${value}`;
  return value;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** converts scriptToken to the runtime value pased to keyword.compile()
 */
function DecodeToken(tok: IToken): any {
  const [type, value] = UnpackToken(tok);
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
function DecodeStatement(toks: TScriptUnit): any[] {
  const dUnit: TScriptUnit = toks.map((tok, ii) => {
    if (ii === 0) {
      const arg = DecodeToken(tok);
      if (typeof arg === 'object' && arg.comment) return '_comment';
      return arg;
    }
    return DecodeToken(tok);
  });
  return dUnit;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** check that the passed decoded token is actually a keyword. This is called
 *  AFTER the statement tokens has been decoded as far as it can be by
 *  DecodeStatement()
 */
function isKeywordString(tok: any): boolean {
  // don't compile comment lines, but compile everything else
  if (typeof tok === 'string') {
    if (tok.length > 0) return true;
    return false; // the case for blank lines, now allowed
  }
  // this shouldn't happen, but just ruling it out
  if (Array.isArray(tok)) return false;
  // if it's an object, do a bit more digging
  if (typeof tok === 'object') {
    if (tok.line) return false;
  }
  return false;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: A mirror of CompileStatement, extracts the symbol data as a separate
 *  pass so we don't have to rewrite the entire compiler and existing keyword
 *  code. Note that this does not recurse into statement blocks, because the
 *  only keywords in a statement that add symbol data are `addProp` and `when`
 *  which are always level 0 (not nested)
 */
function SymbolizeStatement(statement: TScriptUnit, line: number): TSymbolData {
  const fn = 'SymbolizeStatement:';
  const kwArgs = DecodeStatement(statement); // replace with UnpackStatement
  let kw = kwArgs[0];
  if (kw === '') return {}; // blank lines emit no symbol info
  if (!isKeywordString(kw)) return {}; // if !keyword return no symbol
  const kwProcessor = DCENGINE.GetKeyword(kw);
  if (!kwProcessor) {
    console.warn(`${fn} keyword processor ${kw} bad`);
    return {
      error: { code: 'errExist', info: `missing kwProcessor for: '${kw}'` }
    };
  }
  // ***NOTE***
  // May return empty object, but that just means there are no symbols produced.
  // keywords don't return symbols unless they are adding props or features.
  const symbols = kwProcessor.symbolize(kwArgs, line); // these are new objects
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
  const [kw] = DecodeStatement(statement);
  const kwp = DCENGINE.GetKeyword(kw);
  if (kwp === undefined) {
    const keywords = DCENGINE.GetAllKeywords();
    return {
      validationTokens: [
        new VSymError('errExist', `invalid keyword '${kw}'`, { keywords })
      ]
    };
  }
  // DO THE RIGHT THING II: return the Validation Tokens
  kwp.validateInit({ bundle, globals });
  return kwp.validate(statement);
}

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Compile a single ScriptUnit, which invokes the Keyord Processor
 *  to generate a TSMCProgram consisting of TOpcodes. This skips directives
 *  and comments, generating no code.
 */
function CompileStatement(
  statement: TScriptUnit,
  idx?: number
): TCompiledStatement {
  let kwProcessor: IKeyword;
  // convert the tokens into actual values to feed the kw compiler
  const kwArgs = DecodeStatement(statement);
  let kw = kwArgs[0];
  // let's compile!
  // if first keyword is invalid return empty array (no code generated)
  if (!isKeywordString(kw)) return [];
  // otherwise, compile the statement!
  kwProcessor = DCENGINE.GetKeyword(kw);
  if (!kwProcessor) kwProcessor = DCENGINE.GetKeyword('keywordErr');
  const compiledStatement = kwProcessor.compile(kwArgs, idx);
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
    objcode = CompileStatement(statement, ii);
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
  // TODO: move the symbolizer to a new SymbolizeBlueprint() call
  DCBUNDLER.AddSymbol(bdl, GAgent.Symbols);
  //
  if (!Array.isArray(script))
    throw Error(`${fn} script should be array, not ${typeof script}`);
  if (script.length === 0) return bdl;
  script.forEach((stm, ii) => {
    // special case 1: first line must be # BLUEPRINT directive
    if (ii === 0) {
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
    objcode = CompileStatement(stm, ii);
    objcode = m_StripErrors(objcode, stm);
    // save objcode to current bundle section, which can be changed
    // through pragma PROGRAM
    DCBUNDLER.BundleOut(bdl, objcode);
    // TODO: move the symbolizer to a new SymbolizeBlueprint() call
    const symbols = SymbolizeStatement(stm, ii);
    DCBUNDLER.AddSymbol(bdl, symbols);
  }); // script forEach

  if (bdl.name === undefined) throw Error(`${fn} missing BLUEPRINT directive`);
  // always add GAgent.Symbols, which are the default built-in props
  DCBUNDLER.AddSymbol(bdl, GAgent.Symbols);
  // set type to "BLUEPRINT" (there are other bundle types too)
  bdl.setType(EBundleType.BLUEPRINT);
  return bdl;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { CompileScript, CompileBlueprint };
export {
  IsValidToken,
  UnpackToken,
  DecodeToken,
  DecodeTokenPrimitive,
  DecodeStatement,
  SymbolizeStatement,
  ValidateStatement
};
