/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert text to Script Units Tokens. It does not test the validity of then
  produced tokens.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

import { TScriptUnit, TSMCProgram } from 'lib/t-script.d';
import { GetKeyword } from 'modules/datacore/dc-script-engine';
import { GetProgram } from 'modules/datacore/dc-named-methods';
import { ParseExpression } from 'lib/expr-parser';
import GScriptTokenizer from 'lib/class-gscript-tokenizer-dbg';
import { Blocks } from './test-blockscripts';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('COMPILE', 'TagDebug');
const Scriptifier = new GScriptTokenizer();
const DBG = true;

/// COMPILER SUPPORT FUNCTIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** parse-out strings in the code array, which are errors */
function m_CheckForError(code: TSMCProgram, unit: TScriptUnit, ...args) {
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
    token,
    objref,
    directive,
    value,
    string,
    comment,
    program,
    block,
    expr
  } = arg;
  if (token !== undefined) {
    if (token === '#') return '_pragma';
    return token;
  }
  if (directive) return directive;
  if (value !== undefined) return value;
  if (string !== undefined) return string;
  if (comment) return comment;
  // special cases
  if (program) return arg; // { program = string name of stored program }
  if (objref) return arg; // { objref = array of string parts }
  if (block) return arg; // { block = array of ScriptUnits }
  if (expr) return arg; // { expr = string }
  console.warn('unknown argument type:', arg);
  throw Error('unknown argument type');
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Scan argument list and process different types of arguments
 *  before they are passed to a keyword compiler.
 */
export function r_ExpandArgs(unit: TScriptUnit): TScriptUnit {
  if (!Array.isArray(unit)) console.warn(...PR('unit is not array', unit));
  const modUnit: TScriptUnit = unit.map((item, idx) => {
    // internal checks
    if (Array.isArray(item)) {
      console.warn('r_ExpandArgs: err caused by', item);
      throw Error('unexpected array argument; should be obj');
    }
    if (typeof item !== 'object')
      throw Error('all units should be an argument node');
    // arg is an array of elements in the ScriptUnit.
    // r_DecodeArg converts the node into plain types and
    // special types that require their own processing
    if (item.comment !== undefined) return '//'; // signal compiler to skip
    const arg = m_GetTokenValue(item); // convert
    // special case first keyword
    if (idx === 0) {
      if (arg === '#') return '_pragma';
      return arg;
    }
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
      return arg;
    }
    // 3. program name
    if (typeof arg.program === 'string') {
      // named programs are resolved, replace with actual program
      arg.program = GetProgram(arg.program);
      return arg;
    }
    // 4. program block is an array of scriptUnits
    if (Array.isArray(arg.block)) {
      return r_CompileBlock(arg.block);
      // do nothing here because Compiler will handle the block
    }
    // 5. otherwise this is a plain argment OR an array of ScriptUnits
    return arg;
  });
  return modUnit;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Compile a script block, returning objcode */
function r_CompileBlock(units: TScriptUnit[]): TSMCProgram {
  const objcode = []; // holder for compiled code
  let code; // holder for compiled unit
  units.forEach((unit, idx) => {
    // skip all pragmas
    if (unit[0].directive) return; // skip directives, which are never in blocks
    if (unit[0].comment) return; // skip comments
    // recursive compile through r_r_ExpandArgs()
    code = r_CompileUnit(unit, idx); // recursive!
    code = m_CheckForError(code, unit);
    objcode.push(...code);
  });
  return objcode;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a single unit of nodes of different types, run everything through
 *  the keyword compiler cycle
 */
function r_CompileUnit(rawUnit: TScriptUnit, idx?: number): TSMCProgram {
  // extract keyword first unit, assume that . means Feature
  let kwProcessor;
  let unit = r_ExpandArgs(rawUnit); // recursive!
  // after this, units contains normal js strings, numbers, or bools as well
  // as our special object types for expressions, blocks, objref...
  let kw = unit[0];
  // let's compile!
  if (typeof kw !== 'string') return [];
  if (kw === '//') return [];
  kwProcessor = GetKeyword(kw);
  if (!kwProcessor) kwProcessor = GetKeyword('keywordErr');
  const compiledStatement = kwProcessor.compile(unit, idx); // qbits is the subsequent parameters
  return compiledStatement;
}

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Compile ScriptUnits into a single SMCProgram (TOpcode[])
 */
export function CompileScript(units: TScriptUnit[]): TSMCProgram {
  const program: TSMCProgram = [];
  // null program
  if (units.length === 0) return [];
  // compile unit-by-unit
  let objcode: TSMCProgram;
  units.forEach((unit, idx) => {
    if (unit[0] === '#') return;
    objcode = r_CompileUnit(unit, idx);
    objcode = m_CheckForError(objcode, unit);
    console.log(...PR(idx, objcode));
    program.push(...objcode);
  });
  // an array of TOpcode functions aka SMC
  return program;
}

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestCompiler(tests) {
  console.group(...PR('TEST: CompileScript'));
  Object.entries(tests).forEach(kv => {
    const [testName, testArray] = kv;
    // const [text, expect] = testArray; // ts parser too old to handle spread
    const text = testArray[0].trim();
    console.group(...PR('compile tests'));
    console.log(text);
    const sourceStrings = text.split('\n');
    const script = Scriptifier.tokenize(sourceStrings);
    const program = CompileScript(script);
    console.groupEnd();
  });
  console.groupEnd();
}
UR.HookPhase('UR/APP_RUN', () => {
  // TestCompiler(Blocks);
});
