/* eslint-disable @typescript-eslint/dot-notation */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert text to Script Units Tokens. It does not test the validity of then
  produced tokens.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

import {
  TScriptUnit,
  TSMCProgram,
  IToken,
  TSymbolData,
  EBundleType
} from 'lib/t-script.d';
import SM_State from 'lib/class-sm-state';
import SM_Bundle from 'lib/class-sm-bundle';

import { GetKeyword } from 'modules/datacore/dc-script-engine';
import { GetProgram } from 'modules/datacore/dc-named-methods';
import {
  BundleOut,
  SetBundleName,
  AddSymbol,
  BundleTag
} from 'modules/datacore/dc-script-bundle';
import GAgent from 'lib/class-gagent';

import { ParseExpression } from './class-expr-parser-v2';
import GScriptTokenizer, { UnpackToken } from './class-gscript-tokenizer-v2';
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
      console.log(...PR(`ERR: ${err} ${where}`), unit);
    }
    // got a single string, so is error
    if (typeof f === 'string')
      console.log(...PR(`ERR: '${f}' ${args.join(' ')}`), unit);
    return false;
  });
  return out;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility to return the 'decoded' value of a token */
function DecodeTokenPrimitiveNew(arg) {
  const [type, value] = UnpackToken(arg);
  if (type === undefined) {
    console.warn('unknown argument type:', arg);
    throw Error('unknown argument type');
  }
  if (type === 'comment') return `// ${value}`;
  return value;
}
/** old version of DecodeTokenPrimitive does not use gscript-tokenizer UnpackToken */
function DecodeTokenPrimitiveOld(arg) {
  const { directive, comment, line } = arg; // meta information
  const { identifier, value, string } = arg; // primitive values
  const { objref, program, block, expr } = arg; // req runtime eval
  if (directive) return arg; // directive = _pragma, cmd
  if (comment !== undefined) return `// ${comment}`;
  if (line !== undefined) return arg; // blank lines
  if (identifier !== undefined) return identifier;
  if (value !== undefined) return value;
  if (string !== undefined) return string;
  if (program === '') return arg; // happens during live typing
  if (program) return arg; // { program = string name of stored program }
  if (Array.isArray(block)) return arg; // { block = array of arrays of tok }
  if (objref) return arg; // { objref = array of string parts }
  if (expr === '') return arg; // happens during live typing
  if (expr) return arg; // { expr = string }
  console.warn('unknown argument type:', arg);
  throw Error('unknown argument type');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return 'expanded' version of argument, suitable for passing to a keyword
 *  compiler
 */
function DecodeTokenNew(tok: IToken): any {
  const [type, value] = UnpackToken(tok);
  if (type === undefined)
    throw Error(`DecodeToken invalid token ${JSON.stringify(tok)}`);
  if (type === 'identifier') return value;
  if (type === 'objref') return { objref: value };
  if (type === 'string') return value;
  if (type === 'value') return value;
  if (type === 'line') return value;
  if (type === 'expr') return { expr: ParseExpression(value) };
  if (type === 'comment') return { comment: value };
  if (type === 'directive') return '_pragma';
  if (type === 'block') return CompileScript(value);
  if (type === 'program') return GetProgram(value);
  throw Error(`DecodeToken unhandled type ${type}`);
}
/** old version of DecodeToken does not use gscript-tokenizer UnpackToken */
function DecodeTokenOld(tok: IToken): any {
  if (tok.comment !== undefined) return `// ${tok.comment}`; // compile will skip
  const arg = DecodeTokenPrimitiveOld(tok); // convert
  // check special types
  if (arg.directive) return '_pragma'; // { directive, cmd } for compile-time processing
  if (typeof arg.expr === 'string') {
    const ast = ParseExpression(arg.expr);
    return { expr: ast }; // runtime processing through Evaluate() required
  }
  if (Array.isArray(arg.objref)) return arg; // runtime processing required
  if (typeof arg.program === 'string') return GetProgram(arg.program); // runtime processing required
  if (arg.line !== undefined) return arg; // blank line, preserve token for compiler
  if (arg.block) return CompileScript(arg.block); // recursive compile

  // 6. otherwise this is a plain argument
  return arg;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given an TSMCProgram, agent, and state information (stack, ctx, flags)
 *  run all the instructions in the program. Agent and State objects are
 *  mutated by each instruction, and the mutated state stack will contain
 *  the output of the program, if any
 */
function r_Execute(smcode: TSMCProgram, agent: GAgent, state: SM_State): void {
  smcode.forEach(op => op(agent, state));
}

/// SUPPORT API ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a ScriptUnit, return the 'decoded' tokens as usable valuables when
 *  it is time to invoke a compiler function
 */
function DecodeStatement(toks: TScriptUnit): any[] {
  const dUnit: TScriptUnit = toks.map((tok, ii) => {
    if (ii === 0) {
      const arg = DecodeTokenNew(tok);
      if (typeof arg === 'object' && arg.comment) return '_comment';
      return arg;
    }
    return DecodeTokenNew(tok);
  });
  return dUnit;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** check that the passed decoded token is actually a keyword. This is called
 *  AFTER the statement tokens has been decoded as far as it can be by
 *  DecodeStatement()
 */
function is_Keyword(tok: any): boolean {
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
  if (!is_Keyword(kw)) return [];
  // otherwise, compile the statement!
  kwProcessor = GetKeyword(kw);
  if (!kwProcessor) kwProcessor = GetKeyword('keywordErr');
  const compiledStatement = kwProcessor.compile(kwArgs, idx);
  return compiledStatement;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a mirror of CompileStatement, extracts the symbol data as a separate pass
 *  so we don't have to rewrite the entire compiler and existing keyword code
 */
function SymbolizeStatement(statement: TScriptUnit, idx?: number): TSymbolData {
  const kwArgs = DecodeStatement(statement);
  let kw = kwArgs[0];
  if (kw === '') return {}; // blank lines emit no symbol info
  if (!is_Keyword(kw)) return { error: `bad keyword: '${kw}'` };
  const kwProcessor = GetKeyword(kw);
  if (!kwProcessor) return { error: `missing kwProcessor for: '${kw}'` };
  // may return empty object, but that just means there are no symbols produced
  return { ...kwProcessor.symbolize(kwArgs, idx) };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
/** CompileBlueprint parses # DIRECTIVES to set up a program bundle */
function CompileBlueprint(script: TScriptUnit[]): SM_Bundle {
  const fn = 'CompileBlueprint';
  let objcode;
  const bdl = new SM_Bundle();
  //
  if (!Array.isArray(script)) throw Error(`${fn}: bad script`);
  if (script.length === 0) return bdl;
  script.forEach((stm, ii) => {
    // special case 1: first line must be # BLUEPRINT directive
    if (ii === 0) {
      const [lead, kw, bpName, bpParent] = DecodeStatement(stm);
      if (lead === '_pragma' && kw.toUpperCase() === 'BLUEPRINT') {
        SetBundleName(bdl, bpName, bpParent);
        return;
      }
      throw Error(`${fn}: # BLUEPRINT must be first line in script`);
    }

    // special case 2: tag processing
    const [lead, kw, tagName, tagValue] = DecodeStatement(stm);
    if (lead === '_pragma' && kw.toUpperCase() === 'TAG') {
      BundleTag(bdl, tagName, tagValue);
      return;
    }

    // normal processing of statement
    objcode = CompileStatement(stm, ii);
    objcode = m_StripErrors(objcode, stm);
    // save objcode to current bundle section, which can be changed
    // through pragma PROGRAM
    BundleOut(bdl, objcode);
    // add symbol data
    const symbols = SymbolizeStatement(stm, ii);
    AddSymbol(bdl, symbols);
  }); // script forEach

  if (bdl.name === undefined) throw Error(`${fn}: missing BLUEPRINT directive`);
  bdl.setType(EBundleType.BLUEPRINT);
  console.log(bdl.name, bdl.symbols);
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
  DecodeTokenNew as DecodeToken,
  DecodeTokenPrimitiveNew as DecodeTokenPrimitive,
  DecodeStatement
};
