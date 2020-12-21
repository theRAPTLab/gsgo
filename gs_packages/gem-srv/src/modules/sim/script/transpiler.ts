/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implement a "Keyword Dictionary" that manages the compile() and render()
  output for a particular script keyword. This module also exposes static
  methods for compiling and rendering TScriptUnit[] arrays

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import Agent from 'lib/class-agent';
import { TScriptUnit, TOpcode, TInstance, EBundleType } from 'lib/t-script.d';
import {
  GetKeyword,
  SaveAgent,
  SaveBlueprint,
  GetBlueprint,
  AddToBundle,
  AddGlobalCondition,
  SetBundleName
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
const scriptConverter = new GScriptTokenizer();
const COMPILER_AGENT = new Agent();
const COMPILER_STATE = new SM_State();
//
const DBG = false;

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_PrintScriptToText(units: TScriptUnit[]): string {
  let out = '\n';
  units.forEach(unit => {
    unit.forEach(item => {
      out += `${item} `;
    });
    out = `${out.trim()}\n`;
  });
  return out;
}
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
/** argument expansion table for {{ expr }} and [[ progName ]] strings
 *  returning expanded AST and compacted [[progName]] which will be
 *  dereferenced later during keyword.compile() cycle
 */
const r_expander = {
  // {{ expression }}
  '{{': (arg: string) => {
    if (arg.substring(arg.length - 2, arg.length) !== '}}') return arg;
    const ex = arg.substring(2, arg.length - 2).trim();
    const ast = ParseExpression(ex);
    return ast;
  },
  // [[ programName ]] return compacted version of [[programname]]
  // it will be expanded in the keyword compiler to lookup name
  '[[': (arg: string) => {
    if (arg.substring(arg.length - 2, arg.length) !== ']]') return arg;
    return `[[${arg.substring(2, arg.length - 2).trim()}]]`;
  }
  // note: [[ lines of code ]] are captured in scriptConverter.tokenizer()
  // before r_CompileBlock is called on them
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Compile a script block, returning objcode */
function r_CompileBlock(units: TScriptUnit[]): TOpcode[] {
  const objcode = []; // holder for compiled code
  let code; // holder for compiled unit
  units.forEach((unit, idx) => {
    // skip all pragmas
    if (unit[0] === '#') return;
    // recursive compile through r_ExpandArgs()
    code = r_CompileUnit(unit, idx); // recursive!
    code = m_CheckForError(code, unit);
    objcode.push(...code);
  });
  return objcode;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Scan argument list and convert expression to an AST. This is called for
 *  each ScriptUnit line after the keyword.
 */
function r_ExpandArgs(unit: TScriptUnit): TScriptUnit {
  const modUnit: TScriptUnit = unit.map((arg, idx) => {
    // arg is an array of elements in the ScriptUnit
    // skip first arg, which is the keyword
    if (idx === 0) return arg;
    if (Array.isArray(arg)) {
      const script = scriptConverter.tokenize(arg);
      if (DBG) console.group('recursive compile', idx, unit);
      const objcode = r_CompileBlock(script);
      if (DBG) console.groupEnd();
      return objcode; // this is the compiled script
    }
    if (typeof arg !== 'string') return arg;
    const strTest = r_expander[arg.substring(0, 2)];
    if (strTest) return strTest(arg);
    return arg;
  });
  return modUnit;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function r_CompileUnit(rawUnit: TScriptUnit, idx?: number): TOpcode[] {
  // extract keyword first unit, assume that . means Feature
  // console.group('Expanding', rawUnit);
  let kwProcessor;
  let unit = r_ExpandArgs(rawUnit); // recursive!
  // first array element is keyword aka 'kw'
  let kw = unit[0];
  // let's compile!
  if (typeof kw !== 'string') return [];
  kwProcessor = GetKeyword(kw);
  if (!kwProcessor) kwProcessor = GetKeyword('keywordErr');
  const compiledStatement = kwProcessor.compile(unit, idx); // qbits is the subsequent parameters
  return compiledStatement;
}

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Main ScriptUnit Compiler */
function CompileScript(units: TScriptUnit[]) {
  let objcode; // holder for compiled code

  if (!Array.isArray(units))
    throw Error(`CompileScript can't compile '${typeof units}'`);
  const bdl: SM_Bundle = new SM_Bundle();
  // no units? just return empty bundle
  if (units.length === 0) return bdl;

  units.forEach((unit, idx) => {
    // Special Case 1: make sure the very first scriptunit is a
    // # BLUEPRINT directive
    if (idx === 0) {
      const [lead, kw, bpName, bpParent] = unit;
      if (lead === '#' && kw.toUpperCase() === 'BLUEPRINT') {
        // set global bundle state so it's accessible from keyword
        // compilers via CompilerState()
        SetBundleName(bdl, bpName, bpParent);
        return; // done, so exit this loop
      }
      throw Error('# BLUEPRINT directive must be first line in text');
    }

    // Special Case 2: is pragma? replace # with _pragma and exec
    if (unit[0] === '#') {
      objcode = r_CompileUnit(['_pragma', ...unit.slice(1)]);
      // the _pragma keyword returns code to be run immediately,
      // not part of the template, so run it now and inespect
      // the results
      COMPILER_STATE.reset();
      objcode.forEach(op => op(COMPILER_AGENT, COMPILER_STATE));
      const results = COMPILER_STATE.stack;
      // check for duplicate blueprint declaration (error condition)
      if (results[0] === '_blueprint') {
        throw Error(`# BLUEPRINT used more than once (got '${unit[1]})'`);
      } // if results[0]...
      return; // done, so exit this loop
    }

    // Normal case: otherwise compile a normal keyword
    if (DBG) console.group('upper level compile', idx, unit);
    objcode = r_CompileUnit(unit, idx); // qbits is the subsequent parameters
    if (DBG) console.groupEnd();
    objcode = m_CheckForError(objcode, unit);
    // FINALLY push this unit's code into the passed bundle and repeat
    AddToBundle(bdl, objcode); // objcode is pushed into the bundle by this
  }); // units.forEach
  if (bdl.name === undefined)
    throw Error('CompileScript: Missing #BLUEPRINT directive');
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a text with multiline blocks, emit an array of strings corresponding
 *  to regular strings and [[ ]] demarked lines. The output nodes are processed
 *  back into a single line with m_StitchifyBlocks(). Returns an array of
 *  string arrays.
 */
function ScriptifyText(text: string): TScriptUnit[] {
  const sourceStrings = text.split('\n');
  const script = scriptConverter.tokenize(sourceStrings);
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

/// BLUEPRINT UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterBlueprint(units: TScriptUnit[]): SM_Bundle {
  const bdl: SM_Bundle = CompileScript(units);
  if (!(units.length > 0)) return bdl;
  if (DBG) console.group(...PR(`SAVING BLUEPRINT for ${bdl.name}`));
  SaveBlueprint(bdl);
  // run conditional programming in template
  // this is a stack of functions that run in global context
  console.log('registering blueprint', bdl);
  // initialize global programs in the bundle
  const { condition, event } = bdl.getPrograms();
  AddGlobalCondition(bdl.name, condition);
  if (DBG) console.groupEnd();
  return bdl;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Utility to make an Agent. This has to be done in a module outside of
 *  dc-agents, because datacore modules must be pure definition
 */
function MakeAgent(instanceDef: TInstance) {
  const { blueprint, name } = instanceDef;
  const agent = new Agent(name);
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
  // compile to script units
  ScriptifyText, // text w/ newlines => TScriptUnit[]
  CompileScript, // combine scriptunits through m_CompileBundle
  // convert script units to other form
  TextifyScript, // TScriptUnit[] => produce source text from units
  RenderScript // TScriptUnit[] => JSX for wizards
};
/// for blueprint operations
export {
  MakeAgent, // BlueprintName => Agent
  RegisterBlueprint // TScriptUnit[] => ISM_Bundle
};
