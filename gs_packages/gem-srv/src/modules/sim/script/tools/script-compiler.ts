/* eslint-disable @typescript-eslint/dot-notation */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert text to Script Units Tokens. It does not test the validity of then
  produced tokens.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

import { TScriptUnit, TSMCProgram, IToken } from 'lib/t-script.d';
import { GetKeyword } from 'modules/datacore/dc-script-engine';
import { GetProgram } from 'modules/datacore/dc-named-methods';
import { ParseExpression } from 'lib/expr-parser';
import GScriptTokenizer from 'script/tools/class-gscript-tokenizer-v2';
import SM_State from 'lib/class-sm-state';
import GAgent from 'lib/class-gagent';
import { Script } from './test-data/td-compiler';

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
function m_GetTokenValue(arg) {
  const {
    comment,
    token,
    objref,
    directive,
    value,
    string,
    program,
    block,
    expr,
    line
  } = arg;
  if (token !== undefined) {
    if (token === '#') return '_pragma';
    return token;
  }
  if (directive) return directive;
  if (value !== undefined) return value;
  if (string !== undefined) return string;
  if (comment) return comment;
  // special cases return as-is for later processing in art expander
  if (line !== undefined) return `// line:${line}`; // don't compile these!
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
export function r_ExpandArg(tok: IToken): any {
  if (tok.comment !== undefined) return '//'; // signal compiler to skip
  const arg = m_GetTokenValue(tok); // convert
  // check special types
  // 1. an expression
  if (typeof arg.expr === 'string') {
    const ast = ParseExpression(arg.expr);
    // replace expression string with AST
    arg.expr = ast;
    return arg;
  }
  // 2. a dotted object reference
  if (Array.isArray(arg.objref)) {
    // assume it is a valid context reference
    // context needs to be generated at runtime and swizzled to match
    // the syntax! e.g. agent.prop['x'] swizzled into agent.x somehow
    // so just return the arg as-is and assume runtime expander will
    // handle it
    return arg; // runtime processing required
  }
  // 3. program name
  if (typeof arg.program === 'string') {
    // named programs are resolved, replace with actual program
    arg.program = GetProgram(arg.program);
    return arg; // runtime processing required
  }
  // 4. block program is array of scriptunit array and has to be compiled
  if (arg.block) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const smc = CompileScript(arg.block); // recursive compile
    return smc;
  }
  // 5. it's a line (whitespace) and should be ignored
  if (arg.line !== undefined) {
    return `// line: ${arg.line}`;
  }
  // 6. otherwise this is a plain argument
  return arg;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a single unit of nodes of different types, run everything through
 *  the keyword compiler cycle
 */
function r_CompileStatement(units: TScriptUnit, idx?: number): TSMCProgram {
  let kwProcessor;
  // expand arguments
  const kwArgs = units.map((tok, ii) => {
    let arg = r_ExpandArg(tok);
    if (ii === 0 && arg === '#') arg = '_pragma';
    return arg;
  });
  // kwArgs contains normal js strings, numbers, or bools as well
  // as our special object types for expressions, blocks, objref...
  let kw = kwArgs[0];
  // let's compile!
  if (typeof kw !== 'string') return [];
  if (kw.startsWith('//')) return [];
  kwProcessor = GetKeyword(kw);
  if (!kwProcessor) kwProcessor = GetKeyword('keywordErr');
  const compiledStatement = kwProcessor.compile(kwArgs, idx); // qbits is the subsequent parameters
  return compiledStatement;
}

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Compile ScriptUnits into a single SMCProgram (TOpcode[])
 */
function CompileScript(script: TScriptUnit[]): TSMCProgram {
  const program: TSMCProgram = [];
  // null program
  if (script.length === 0) return [];
  // compile unit-by-unit
  let objcode: TSMCProgram;
  script.forEach((statement, ii) => {
    if (statement[0] === '#') {
      console.error(
        ...PR('CompileScript: skipping # directive; use CompileBlueprint instead')
      );
      return;
    }
    objcode = r_CompileStatement(statement, ii);
    objcode = m_CheckForError(objcode, statement);
    program.push(...objcode);
  });
  // an array of TOpcode functions aka SMC
  return program;
}

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestCompiler(tests) {
  const entries = Object.entries(tests);
  console.group(...PR(`TEST: CompileScript (${entries.length} tests)`));
  entries.forEach((kv, ii) => {
    const [testName, testArgs] = kv;
    // workaround out-of-date typescript compiler that doesn't recognize spread
    const text = testArgs['text'].trim();
    const ctx = testArgs['ctx'];
    const stack = testArgs['stack'];
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

/// CONSOLE TOOL INSTALL //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool({
  'compile_test': () => {
    console.clear();
    TestCompiler(Script);
  }
});
// UR.HookPhase('UR/APP_START', () => TestCompiler(Script));

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { CompileScript };
