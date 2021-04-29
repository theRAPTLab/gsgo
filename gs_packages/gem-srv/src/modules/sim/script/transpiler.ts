/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implement a "Keyword Dictionary" that manages the compile() and render()
  output for a particular script keyword. This module also exposes static
  methods for compiling and rendering TScriptUnit[] arrays

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import GAgent from 'lib/class-gagent';
import { TScriptUnit, TOpcode, TInstance, EBundleType } from 'lib/t-script.d';
import { SaveAgent, DeleteAgent } from 'modules/datacore/dc-agents';
import { AddToBundle, SetBundleName } from 'modules/datacore/dc-script-bundle';
import {
  GetKeyword,
  GetBlueprint,
  SaveBlueprint
} from 'modules/datacore/dc-script-engine';
import { GetProgram } from 'modules/datacore/dc-named-methods';
import { ParseExpression } from 'lib/expr-parser';
import GScriptTokenizer from 'lib/class-gscript-tokenizer';
import SM_Bundle from 'lib/class-sm-bundle';
import SM_State from 'lib/class-sm-state';
import * as DATACORE from 'modules/datacore';
// critical imports
import 'script/keywords/_all_keywords';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRNPLR', 'TagDebug');
const scriptifier = new GScriptTokenizer();
const COMPILER_AGENT = new GAgent('CompilerAgent');
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
function ScriptToConsole(units: TScriptUnit[], lines: string[] = []) {
  let str = [];
  let blkn = 0;
  let offset = 0;
  units.forEach((arr, idx) => {
    str = [];
    blkn = 0;
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
        blkn = 1 + block.length;
      }
      if (expr) str.push(expr);
    });
    const out = str.join(' ');
    let line = lines[idx + offset];
    if (line !== undefined) line = line.trim();
    if (line === undefined) console.log('OK:', out);
    else if (blkn > 0) {
      console.log(`%cSKIPPING BLOCK MATCHING:\n${out}`, 'color:#aaa');
      offset += blkn;
    } else if (line !== out)
      console.log(
        `%cMISMATCH %c SOURCE vs DECOMPILED UNITS\n  source: ${line}\n  decomp: %c${out}`,
        'color:red',
        'color:auto',
        'background-color:yellow'
      );
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a text with multiline blocks, emit an array of strings corresponding
 *  to regular strings and [[ ]] demarked lines. The output nodes are processed
 *  back into a single line with m_StitchifyBlocks(). Returns an array of
 *  string arrays.
 */
function ScriptifyText(text: string): TScriptUnit[] {
  if (text === undefined) return [];
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
      // Orig Call
      // This was broken with the new script unit object model.
      // It would return '{token: value}' instead of `value`
      // if (uidx === 0) toks.push(tok);
      // else toks.push(m_Tokenify(tok));

      // HACK Fix to work around new object model
      // This will probably break with nested expressions
      // toks.push(tok.token || tok.value || tok.string);

      // HACK 2 Return ANY token value
      // This assumes there is only ONE value in the object
      const vals = Object.values(tok);
      if (vals.length > 0) toks.push(vals[0]);
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
function CompileText(text: string = ''): TScriptUnit[] {
  const units = ScriptifyText(text);
  const program: TScriptUnit[] = [];

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
function CompileBlueprint(units: TScriptUnit[]): SM_Bundle {
  let objcode; // holder for compiled code

  if (!Array.isArray(units))
    throw Error(`CompileBlueprint can't compile '${typeof units}'`);
  const bdl: SM_Bundle = new SM_Bundle();
  // no units? just return empty bundle
  if (units.length === 0) return bdl;
  units.forEach((unit, idx) => {
    // Special Case 1: special properties for first keyword
    if (idx === 0) {
      // expand arguments from tokens to primitive types
      const [lead, kw, bpName, bpParent] = r_ExpandArgs(unit);
      // a. is # (pragma)
      if (lead === '_pragma' && kw.toUpperCase() === 'BLUEPRINT') {
        // set global bundle state so it's accessible from keyword
        // compilers via CompilerState()
        SetBundleName(bdl, bpName, bpParent);
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
  if (bdl.name === undefined) {
    throw Error('CompileBlueprint: Missing #BLUEPRINT directive');
  }
  bdl.setType(EBundleType.BLUEPRINT);
  return bdl;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * A brute force method of retrieving the blueprint name from a script
 * Compiles raw scriptText to determine the blueprint name
 * @param {string} script
 */
function ExtractBlueprintName(script) {
  const source = ScriptifyText(script);
  const bundle = CompileBlueprint(source); // compile to get name
  return bundle.name;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * A brute force method of retrieving the blueprint properties from a script
 * Compiles raw scriptText to determine the blueprint properties
 * @param {string} script
 * @return {Object[]} [...{name, type, defaultValue, isFeatProp}]
 */
function ExtractBlueprintProperties(script) {
  // HACK in built in properties -- where should these be looked up?
  // 1. Start with built in properties
  let properties = [
    { name: 'x', type: 'number', defaultValue: 0, isFeatProp: false },
    { name: 'y', type: 'number', defaultValue: 0, isFeatProp: false },
    { name: 'zIndex', type: 'number', defaultValue: 0, isFeatProp: false },
    { name: 'skin', type: 'string', defaultValue: 'onexone', isFeatProp: false },
    { name: 'scale', type: 'number', defaultValue: 1, isFeatProp: false },
    { name: 'scaleY', type: 'number', defaultValue: 1, isFeatProp: false },
    { name: 'alpha', type: 'number', defaultValue: 1, isFeatProp: false },
    { name: 'isInert', type: 'boolean', defaultValue: false, isFeatProp: false },
    { name: 'text', type: 'string', defaultValue: '', isFeatProp: false },
    { name: 'meter', type: 'number', defaultValue: 0, isFeatProp: false },
    { name: 'meterClr', type: 'number', defaultValue: 0, isFeatProp: false },
    {
      name: 'meterLarge',
      type: 'boolean',
      defaultValue: false,
      isFeatProp: false
    }

    // Don't allow wizard to set built-in skin property directly.
    // This should be handled via `featCall Costume setCostume` because that
    // call properly initializes the frameCount.
    // { name: 'skin', type: 'string', defaultValue: 'bunny.json', isFeatProp: true }
  ];
  // 2. Brute force deconstruct added properties
  //    by walking down script and looking for `addProp`
  if (!script) return properties; // During update script can be undefined
  const scriptUnits = ScriptifyText(script);
  scriptUnits.forEach(unit => {
    if (unit[0] && unit[0].token === 'addProp') {
      properties.push({
        name: unit[1].token,
        type: unit[2].token.toLowerCase(),
        defaultValue: unit[3].value,
        isFeatProp: false
      });
    }
  });
  return properties;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * A brute force method of retrieving the blueprint properties from a script
 * Compiles raw scriptText to determine the blueprint property types
 * Used by PanelScript to generate property menus
 * @param {string} script
 * @return {map} [ ...{name: {name, type, defaultValue, isFeatProp}]
 */
function ExtractBlueprintPropertiesMap(script) {
  const properties = this.ExtractBlueprintProperties(script);
  const map = new Map();
  properties.forEach(p => map.set(p.name, p));
  return map;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * A brute force method of retrieving the blueprint properties from a script
 * Compiles raw scriptText to determine the blueprint property types
 * Used by PanelScript to generate property menus
 * @param {string} script
 * @return {map} [ ...{name: type}]
 */
function ExtractBlueprintPropertiesTypeMap(script) {
  const properties = this.ExtractBlueprintProperties(script);
  const map = new Map();
  properties.forEach(p => map.set(p.name, p.type));
  return map;
}

/**
 * A brute force method of checking to see if the script has a directive
 * Used by project-data.InstanceAdd to check for the presence of
 * '# PROGRAM INIT' to decide whether or not to replace
 * the init script.
 * @param script
 * @param directive
 * @returns boolean
 */
function HasDirective(script: string, directive: string) {
  if (!script) return false; // During update script can be undefined
  const units = ScriptifyText(script);
  let result = false;
  units.forEach(rawUnit => {
    const unit = r_ExpandArgs(rawUnit);
    if (unit.length !== 3) return; // we're expecting `# PROGRAM xxx` so length = 3
    if (unit[0] === '_pragma' && unit[1] === 'PROGRAM' && unit[2] === directive)
      result = true;
  });
  return result;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an array of ScriptUnits, return JSX keyword components for each line
 *  as rendered by the corresponding KeywordDef object
 *  @param {array} options -- { isEditable }
 */
function RenderScript(units: TScriptUnit[], options: any[]): any[] {
  const sourceJSX = [];
  if (!(units.length > 0)) return sourceJSX;
  let out = [];
  if (DBG) console.groupCollapsed(...PR('RENDERING SCRIPT'));
  units.forEach((rawUnit, index) => {
    let unit = r_ExpandArgs(rawUnit);
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
    const jsx = kwProcessor.jsx(index, unit, options);
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
    // First deregister the blueprint if it exists
    // RemoveGlobalCondition(bdl.name); // deprecatd in script-xp
    SaveBlueprint(bdl);
    // run conditional programming in template
    // this is a stack of functions that run in global context
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
  const agent = new GAgent(name, String(instanceDef.id));
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RemoveAgent(instanceDef: TInstance) {
  DeleteAgent(instanceDef);
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
  RemoveAgent,
  RegisterBlueprint, // TScriptUnit[] => ISM_Bundle
  ExtractBlueprintName,
  ExtractBlueprintProperties,
  ExtractBlueprintPropertiesMap,
  ExtractBlueprintPropertiesTypeMap,
  HasDirective
};
