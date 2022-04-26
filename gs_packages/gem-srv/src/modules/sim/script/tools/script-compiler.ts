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

import { TScriptUnit, TSMCProgram, IToken, EBundleType } from 'lib/t-script.d';
import SM_State from 'lib/class-sm-state';
import SM_Bundle from 'lib/class-sm-bundle';

import * as DCENGINE from 'modules/datacore/dc-script-engine';
import { GetProgram } from 'modules/datacore/dc-named-methods';
import * as DCBUNDLER from 'modules/datacore/dc-script-bundle';
import GAgent from 'lib/class-gagent';

import { ParseExpression } from './class-expr-parser-v2';
import GScriptTokenizer, {
  IsValidToken,
  UnpackToken
} from './class-gscript-tokenizer-v2';
import { ScriptTest, BlueprintTest } from './test-data/td-compiler';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('COMPILE', 'TagDebug');
const Scriptifier = new GScriptTokenizer();

/// COMPILER SUPPORT FUNCTIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** filter-out errors in the code array, which are strings instead of functions */
function m_StripErrors(code: TSMCProgram, unit: TScriptUnit, ...args: any[]) {
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
  return out;
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
/** return 'expanded' version of argument, suitable for passing to a keyword
 *  compiler
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
  if (type === 'program') return GetProgram(value);
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

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Compile a single ScriptUnit, which invokes the Keyord Processor
 *  to generate a TSMCProgram consisting of TOpcodes. This skips directives
 *  and comments, generating no code.
 */
function CompileStatement(statement: TScriptUnit, idx?: number): TSMCProgram {
  let kwProcessor;
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
  let objcode: TSMCProgram;
  script.forEach((statement, ii) => {
    if (statement[0] === '_pragma') return; // ignore directives
    objcode = CompileStatement(statement, ii);
    objcode = m_StripErrors(objcode, statement);
    program.push(...objcode);
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
  let objcode: TSMCProgram;
  const bdl = new SM_Bundle();
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
    // add symbol data TODO MOVE TO script-symbolizer
    // const symbols = SymbolizeStatement(stm, ii);
    // DCBUNDLER.AddSymbol(bdl, symbols);
  }); // script forEach

  if (bdl.name === undefined) throw Error(`${fn} missing BLUEPRINT directive`);
  // always add GAgent.Symbols, which are the default built-in props
  DCBUNDLER.AddSymbol(bdl, GAgent.Symbols);
  // set type to "BLUEPRINT" (there are other bundle types too)
  bdl.setType(EBundleType.BLUEPRINT);
  return bdl;
}

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestCompile(tests) {
  const entries = Object.entries(tests);
  console.group(...PR(`TEST: CompileScript (${entries.length} tests)`));
  entries.forEach((kv, ii) => {
    const [testName, testArgs] = kv;
    // workaround out-of-date typescript compiler that doesn't recognize spread
    const text = testArgs['text'].trim();
    const ctx = { ...testArgs['ctx'] }; // shallow copy object
    const stack = testArgs['stack'].slice(); // copy stack by value!!!
    // const { text, ctx, stack } = testArgs;
    console.group(...PR(`T${ii + 1} '${testName}'`));
    console.groupCollapsed('SOURCE TEXT');
    console.log(`%c${text}`, 'padding:4px 6px;background-color:LightYellow');
    console.groupEnd();
    const script = Scriptifier.tokenize(text);
    const program = CompileScript(script);
    const state = new SM_State(stack, ctx);
    const agent = new GAgent('CompilerTest');
    console.log('%cprogram:', 'color:brown', program);
    console.group(`EXEC '${testName}' (test agent+context)`);
    console.log('IN  stack:', state.stack, 'ctx:', state.ctx);
    program.forEach((op, idx) => {
      if (typeof op !== 'function')
        console.warn(`op ${idx} is not a function, got ${typeof op}`, op);
      op(agent, state);
    });
    console.log('OUT stack:', state.stack, 'ctx:', state.ctx);
    console.groupEnd();
    console.groupEnd();
  });
  console.groupEnd();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestCompileBlueprint(tests) {
  const entries = Object.entries(tests);
  console.group(...PR(`TEST: CompileBlueprint (${entries.length} tests)`));
  entries.forEach((kv, ii) => {
    const [testName, testArgs] = kv;
    // workaround out-of-date typescript compiler that doesn't recognize spread
    const text = testArgs['text'].trim();
    console.group(...PR(`T${ii + 1} '${testName}'`));
    console.groupCollapsed('SOURCE TEXT');
    console.log(`%c${text}`, 'padding:4px 6px;background-color:LightYellow');
    console.groupEnd();
    const script = Scriptifier.tokenize(text);
    const bdl = CompileBlueprint(script);
    const bdlName = bdl.name;
    const programs = bdl.getPrograms();
    console.group(...PR(`bundle:'${bdlName}'`));
    Object.entries(programs).forEach(([type, program]) => {
      const agent = new GAgent('CompilerTest');
      console.log('%cprogram:', 'color:brown', type, program);
      console.group(`EXEC '${testName}' (test agent+context)`);
      agent.exec(program);
      console.groupEnd();
    });
    console.groupEnd();
    console.groupEnd();
    console.groupEnd();
  });
  console.groupEnd();
}

/// CONSOLE TOOL INSTALL //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (DBG)
  UR.AddConsoleTool({
    'run_compiler_tests': () => {
      console.clear();
      TestCompile(ScriptTest);
    },
    'run_blueprint_tests': () => {
      console.clear();
      TestCompileBlueprint(BlueprintTest);
    }
  });
// UR.HookPhase('UR/APP_START', () => TestCompile(Script));

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { CompileScript, CompileBlueprint };
export {
  IsValidToken,
  UnpackToken,
  DecodeToken,
  DecodeTokenPrimitive,
  DecodeStatement
};
