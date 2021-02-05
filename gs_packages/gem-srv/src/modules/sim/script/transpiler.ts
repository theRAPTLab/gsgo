/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implement a "Keyword Dictionary" that manages the compile() and render()
  output for a particular script keyword. This module also exposes static
  methods for compiling and rendering TScriptUnit[] arrays

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import GAgent from 'lib/class-gagent';
import { TScriptUnit, TOpcode, TInstance, EBundleType } from 'lib/t-script.d';
import {
  GetKeyword,
  SaveAgent,
  SaveBlueprint,
  GetBlueprint,
  AddToBundle,
  SetBundleName,
  GetProgram
} from 'modules/datacore';
import { ParseExpression } from 'lib/expr-parser';
import GScriptTokenizer from 'lib/class-gscript-tokenizer';
import SM_Bundle from 'lib/class-sm-bundle';
import SM_State from 'lib/class-sm-state';
import * as DATACORE from 'modules/datacore';
// critical imports
import 'script/keywords/_all_keywords';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRNPLR', 'TagRed');
const scriptifier = new GScriptTokenizer();
const COMPILER_AGENT = new GAgent();
const COMPILER_STATE = new SM_State();
//
const DBG = false;

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** used by TextifyScript(), which turns ScriptUnits back into text source */
function m_Tokenify(item: any): any {
  const type = typeof item;
  if (type === 'string') {
    const subtype = item.substring(0, 2);
    if (subtype === '{{') return item;
    return `'${item}'`;
  }
  return item;
}

/// COMPILER SUPPORT FUNCTIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** parse-out strings in the code array, which are errors */
function m_CheckForError(code: TOpcode[], unit: TScriptUnit, ...args) {
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
/** Compile a script block, returning objcode */
function r_CompileBlock(units: TScriptUnit[]): TOpcode[] {
  const objcode = []; // holder for compiled code
  let code; // holder for compiled unit
  units.forEach((unit, idx) => {
    // skip all pragmas
    if (unit[0].directive) return; // skip directives, which are never in blocks
    if (unit[0].comment) return; // skip comments
    // recursive compile through r_ExpandArgs()
    code = r_CompileUnit(unit, idx); // recursive!
    code = m_CheckForError(code, unit);
    objcode.push(...code);
  });
  return objcode;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Convert a string with a period in it */
function r_dotify(arg: string) {
  console.log('dotify', arg);
  return { arg };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function r_DecodeArg(arg) {
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
  if (token) {
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
  if (block) return arg; // { block = array of lines }
  if (expr) return arg; // { expr = string }
  console.warn('unknown argument type:', arg);
  throw Error('unknown argument type');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Scan argument list and process different types of arguments
 *  before they are passed to a keyword compiler.
 */
function r_ExpandArgs(unit: TScriptUnit): TScriptUnit {
  const modUnit: TScriptUnit = unit.map((item, idx) => {
    // internal checks
    if (Array.isArray(item))
      throw Error('unexpected array argument; should be obj');
    if (typeof item !== 'object')
      throw Error('all units should be an argument node');
    // arg is an array of elements in the ScriptUnit.
    // r_DecodeArg converts the node into plain types and
    // special types that require their own processing
    if (item.comment !== undefined) return '//'; // signal compiler to skip
    const arg = r_DecodeArg(item);
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
    // 4. program block
    if (Array.isArray(arg.block)) {
      // compile program block recursively, returning object code
      const script = scriptifier.tokenize(arg.block);
      if (DBG) console.group('recursive compile', idx, unit);
      const objcode = r_CompileBlock(script);
      if (DBG) console.groupEnd();
      return objcode; // this is the compiled script
    }
    // 5. otherwise this is a plain argment
    return arg;
  });
  return modUnit;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a single unit of nodes of different types, run everything through
 *  the keyword compiler cycle
 */
function r_CompileUnit(rawUnit: TScriptUnit, idx?: number): TOpcode[] {
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
/** Utility to dump node format of script */
function ScriptToConsole(units: TScriptUnit[]) {
  let str = [];
  units.forEach(arr => {
    str = [];
    arr.forEach(item => {
      const {
        token,
        objref,
        directive,
        value,
        string,
        comment,
        block,
        expr
      } = item;
      if (token) str.push(token);
      if (objref) {
        str.push(objref.join('.'));
      }
      if (directive) str.push(directive);
      if (value) str.push(value);
      if (string) str.push(`"${string}"`);
      if (comment) str.push(`// ${comment}`);
      if (block) {
        str.push('[[');
        block.forEach(line => str.push(line));
        str.push(']]');
      }
      if (expr) str.push(expr);
    });
    console.log(str.join(' '));
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a text with multiline blocks, emit an array of strings corresponding
 *  to regular strings and [[ ]] demarked lines. The output nodes are processed
 *  back into a single line with m_StitchifyBlocks(). Returns an array of
 *  string arrays.
 */
function ScriptifyText(text: string): TScriptUnit[] {
  const sourceStrings = text.split('\n');
  const script = scriptifier.tokenize(sourceStrings);
  return script;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an array of ScriptUnits, produce a source text */
function TextifyScript(units: TScriptUnit[]): string {
  const lines = [];
  units.forEach((unit, index) => {
    if (DBG) console.log(index, unit);
    if (unit[0] === '_comment') unit[0] = '//';
    const toks = [];
    unit.forEach((tok, uidx) => {
      if (uidx === 0) toks.push(tok);
      else toks.push(m_Tokenify(tok));
    });
    lines.push(`${toks.join(' ')}`);
  });
  return lines.join('\n');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Compile a source text and return compiled TMethod. Similar to
 *  CompileBlueprint but does not handle directives or build a bundle. Used
 *  for generating code snippets on-the-fly.
 */
function CompileText(text: string = '') {
  const units = ScriptifyText(text);
  const program = [];

  if (!Array.isArray(units))
    throw Error(`CompileText can't compile '${typeof units}'`);
  if (units.length === 0) return [];
  let objcode;
  units.forEach((unit, idx) => {
    if (unit[0] === '#') return;
    objcode = r_CompileUnit(unit, idx);
    objcode = m_CheckForError(objcode, unit);
    program.push(...objcode);
  });
  return program;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Main ScriptUnit Compiler */
function CompileBlueprint(units: TScriptUnit[]) {
  let objcode; // holder for compiled code

  if (!Array.isArray(units))
    throw Error(`CompileBlueprint can't compile '${typeof units}'`);
  const bdl: SM_Bundle = new SM_Bundle();
  // no units? just return empty bundle
  if (units.length === 0) return bdl;
  units.forEach((unit, idx) => {
    // Special Case 1: special properties for first keyword
    if (idx === 0) {
      const [lead, kw, bpName, bpParent] = unit;
      // a. is # (pragma)
      if (lead.directive === '#' && kw.token.toUpperCase() === 'BLUEPRINT') {
        // set global bundle state so it's accessible from keyword
        // compilers via CompilerState()
        SetBundleName(bdl, bpName.token, bpParent);
        return; // done, so exit this loop
      }
      throw Error('# BLUEPRINT directive must be first line in text');
    }
    // Special Case 2: check very first keyword of subsequent lines
    // if it is a #, replace with _pragma and then exec code
    if (unit[0] === '#') {
      objcode = r_CompileUnit(['_pragma', ...unit.slice(1)]);
      // the _pragma keyword returns code to be run immediately during
      // compilation and is not part of the template blueprint, but it
      // uses the SMC function signature.
      // Run it now using COMPILER_STATE and pull the results from the
      // stack
      COMPILER_STATE.reset();
      objcode.forEach(op => op(COMPILER_AGENT, COMPILER_STATE));
      const results = COMPILER_STATE.stack;
      // check 1: duplicate blueprint declaration (error condition)
      // which shouldn't happen because this block runs only after the
      // first line was processed, and only the first line can declar
      // a blueprint name
      if (results[0] === '_blueprint') {
        throw Error(`# BLUEPRINT used more than once (got '${unit[1]})'`);
      } // if results[0]...
      return; // done, so exit this loop
    } // end special cases

    // Normal case: otherwise compile a normal keyword
    if (DBG) console.group('upper level compile', idx, unit);
    objcode = r_CompileUnit(unit, idx); // generate functions from keywords!
    if (DBG) console.groupEnd();
    objcode = m_CheckForError(objcode, unit);
    // FINALLY push this unit's code into the passed bundle and repeat
    AddToBundle(bdl, objcode); // objcode is pushed into the bundle by this
  }); // units.forEach
  if (bdl.name === undefined)
    throw Error('CompileBlueprint: Missing #BLUEPRINT directive');
  bdl.setType(EBundleType.BLUEPRINT);
  return bdl;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an array of ScriptUnits, return JSX keyword components for each line
 *  as rendered by the corresponding KeywordDef object
 */
function RenderScript(units: TScriptUnit[]): any[] {
  const sourceJSX = [];
  if (!(units.length > 0)) return sourceJSX;
  let out = [];
  if (DBG) console.groupCollapsed(...PR('RENDERING SCRIPT'));
  units.forEach((unit, index) => {
    if (unit.length === 0) return;
    let keyword = unit[0];
    // comment processing
    if (keyword === '//') {
      sourceJSX.push(undefined); // no jsx to render for comments
      if (DBG) console.groupEnd();
      return;
    }
    if (keyword === '#') keyword = '_pragma';
    let kwProcessor = GetKeyword(keyword);
    if (!kwProcessor) {
      kwProcessor = GetKeyword('dbgError');
      kwProcessor.keyword = keyword;
    }
    const jsx = kwProcessor.jsx(index, unit);
    sourceJSX.push(jsx);
    out.push(`<${kwProcessor.getName()} ... />\n`);
  });

  if (DBG) console.log(`JSX (SIMULATED)\n${out.join('')}`);
  if (DBG) console.groupEnd();
  return sourceJSX;
}

/// BLUEPRINT UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterBlueprint(bdl: SM_Bundle): SM_Bundle {
  // ensure that bundle has at least a define and name
  if (bdl.type === EBundleType.INIT) {
    return undefined;
  }
  if (bdl.define && bdl.type === EBundleType.BLUEPRINT) {
    if (DBG) console.group(...PR(`SAVING BLUEPRINT for ${bdl.name}`));
    SaveBlueprint(bdl);
    // run conditional programming in template
    // this is a stack of functions that run in global context
    console.log(`registering blueprint '${bdl.name}'`);
    // initialize global programs in the bundle
    const { condition, event } = bdl.getPrograms();
    //  AddGlobalCondition(bdl.name, condition); // deprecated in script-xp branch
    if (DBG) console.groupEnd();
    return bdl;
  }
  console.log(bdl);
  throw Error('not blueprint');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Utility to make an Agent. This has to be done in a module outside of
 *  dc-agents, because datacore modules must be pure definition
 */
function MakeAgent(instanceDef: TInstance) {
  const { blueprint, name } = instanceDef;
  const agent = new GAgent(name);
  // handle extension of base agent
  // TODO: doesn't handle recursive agent definitions
  if (typeof blueprint === 'string') {
    const bdl = GetBlueprint(blueprint);
    if (!bdl) throw Error(`agent blueprint for '${blueprint}' not defined`);
    // console.log(...PR(`Making '${agentName}' w/ blueprint:'${blueprint}'`));
    agent.setBlueprint(bdl);
    return SaveAgent(agent);
  }
  throw Error(`MakeAgent(): bad blueprint name ${blueprint}`);
}

/// TEST CODE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const txt = DATACORE.GetDefaultText();
// console.log(...PR('\nblocks parsed', ScriptifyText(txt)));
// console.log(...PR('\nrestitched', m_StitchifyBlocks(ScriptifyText(txt))));

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Script is TScriptUnit[], the base representation of gemscript
export {
  ScriptToConsole, // print-out text rep of units
  ScriptifyText, // text w/ newlines => TScriptUnit[]
  CompileText, // text w/ newlines => TSMCProgram
  CompileBlueprint, // combine scriptunits through m_CompileBundle
  TextifyScript, // TScriptUnit[] => produce source text from units
  RenderScript // TScriptUnit[] => JSX for wizards
};
/// for blueprint operations
export {
  MakeAgent, // BlueprintName => Agent
  RegisterBlueprint // TScriptUnit[] => ISM_Bundle
};
