/* eslint-disable @typescript-eslint/dot-notation */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert text to Script Units Tokens. It does not test the validity of then
  produced tokens.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

import { TScriptUnit, TSMCProgram, IToken, EBundleType } from 'lib/t-script.d';
import SM_State from 'lib/class-sm-state';
import SM_Bundle from 'lib/class-sm-bundle';

import { GetKeyword } from 'modules/datacore/dc-script-engine';
import { GetProgram } from 'modules/datacore/dc-named-methods';
import { AddToBundle, SetBundleName } from 'modules/datacore/dc-script-bundle';
import GAgent from 'lib/class-gagent';

import { ParseExpression } from './class-expr-parser-v2';
import GScriptTokenizer from './class-gscript-tokenizer-v2';
import { ScriptTest, BlueprintTest } from './test-data/td-compiler';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('COMPILE', 'TagDebug');
const Scriptifier = new GScriptTokenizer();

/// COMPILER SUPPORT FUNCTIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** parse-out strings in the code array, which are errors */
function m_CheckForError(code: TSMCProgram, unit: TScriptUnit, ...args: any[]) {
  const out = code.filter(f => {
    if (typeof f === 'function') return true;
    if (Array.isArray(f)) {
      // didn't get a function return, so it must be an error code
      const [err, line] = f as any[];
      const where = line !== undefined ? `line ${line}` : '';
      console.log(...PR(`ERR: ${err} ${where}`), unit);
    }
    if (typeof f === 'string')
      console.log(...PR(`ERR: '${f}' ${args.join(' ')}`), unit);
    return false;
  });
  return out;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility to return the 'decoded' value of a token */
function m_GetTokenValue(arg) {
  const { directive, comment, line } = arg; // meta information
  const { token, value, string } = arg; // primitive values
  const { objref, program, block, expr } = arg; // req runtime eval
  if (directive) return arg; // directive = _pragma, cmd
  if (comment) return comment;
  if (line !== undefined) return `// line:${line}`; // don't compile these!
  if (token !== undefined) return token;
  if (value !== undefined) return value;
  if (string !== undefined) return string;
  if (program) return arg; // { program = string name of stored program }
  if (Array.isArray(block)) return arg; // { block = array of arrays of tok }
  if (objref) return arg; // { objref = array of string parts }
  if (expr) return arg; // { expr = string }
  console.warn('unknown argument type:', arg);
  throw Error('unknown argument type');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return 'expanded' version of argument, suitable for passing to a keyword
 *  compiler
 */
export function r_DecodeToken(tok: IToken): any {
  if (tok.comment !== undefined) return '//'; // signal compiler to skip
  const arg = m_GetTokenValue(tok); // convert
  // check special types
  if (arg.directive) return '_pragma'; // { directive, cmd } for compile-time processing
  if (typeof arg.expr === 'string') {
    const ast = ParseExpression(arg.expr);
    return { expr: ast }; // runtime processing through Evaluate() required
  }
  if (Array.isArray(arg.objref)) return arg; // runtime processing required
  if (typeof arg.program === 'string') return GetProgram(arg.program); // runtime processing required
  if (arg.block) return CompileScript(arg.block); // recursive compile
  if (arg.line !== undefined) return `// line: ${arg.line}`;

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
    let arg = r_DecodeToken(tok);
    return arg;
  });
  return dUnit;
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
  if (typeof kw !== 'string') return []; // don't compile
  if (kw.startsWith('//')) return []; // don't compile
  kwProcessor = GetKeyword(kw);
  if (!kwProcessor) kwProcessor = GetKeyword('keywordErr');
  const compiledStatement = kwProcessor.compile(kwArgs, idx); // qbits is the subsequent parameters
  return compiledStatement;
} /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
    objcode = m_CheckForError(objcode, statement);
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
  const compilerAgent = new GAgent('CompilerAgent');
  const compilerState = new SM_State();
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
    // special case 2: run pragma compile-time scripts
    // ??? this does not seem to run snymore...maybe not necesary
    if (stm[0] === '#') {
      objcode = CompileStatement([{ directive: '#' }, ...stm.slice(1)]);
      r_Execute(objcode, compilerAgent, compilerState);
      const result = compilerState.stack.pop();
      if (result === '_blueprint')
        throw Error(`${fn}: extraneous BLUEPRINT directive`);
      return; // done with case 2
    }
    // normal processing of statement
    objcode = CompileStatement(stm, ii);
    objcode = m_CheckForError(objcode, stm);
    AddToBundle(bdl, objcode);
  }); // script forEach
  if (bdl.name === undefined) throw Error(`${fn}: missing BLUEPRINT directive`);
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
UR.AddConsoleTool({
  'compile_test': () => {
    console.clear();
    TestCompile(ScriptTest);
  },
  'blueprint_test': () => {
    console.clear();
    TestCompileBlueprint(BlueprintTest);
  }
});
// UR.HookPhase('UR/APP_START', () => TestCompile(Script));

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { CompileScript, CompileBlueprint };
export { DecodeStatement };
