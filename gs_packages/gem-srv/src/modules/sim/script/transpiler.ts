/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implement a "Keyword Dictionary" that manages the compile() and render()
  output for a particular script keyword. This module also exposes static
  methods for compiling and rendering TScriptUnit[] arrays

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import Agent from 'lib/class-agent';
import { TScriptUnit, TOpcode, EBundleType } from 'lib/t-script.d';
import {
  GetKeyword,
  SaveAgent,
  SaveBlueprint,
  GetBlueprint,
  AddToBundle
} from 'modules/runtime-datacore';
import { ParseExpression } from 'lib/expr-parser';
import GScriptTokenizer from 'lib/class-gscript-tokenizer-2';
import SM_Bundle from 'lib/class-sm-bundle';
import SM_State from 'lib/class-sm-state';
import * as DATACORE from 'modules/runtime-datacore';
// critical imports
import 'script/keywords/_all_keywords';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRNPLR', 'TagRed');
const scriptConverter = new GScriptTokenizer();
const COMPILER_AGENT = new Agent();
const COMPILER_STATE = new SM_State();
//
const DBG = true;

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a text with multiline blocks, emit an array of strings corresponding
 *  to regular strings and [[ ]] demarked lines. The output nodes are processed
 *  back into a single line with m_StitchifyBlocks(). Returns an array of
 *  string arrays.
 */
function m_ScriptifyText(text: string): { script: TScriptUnit[] } {
  const sourceStrings = text.split('\n');
  const script = scriptConverter.tokenize(sourceStrings);
  return script;
}
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
function m_Tokenify(item: any): any {
  const type = typeof item;
  if (type === 'string') {
    const subtype = item.substring(0, 2);
    if (subtype === '{{') return item;
    return `'${item}'`;
  }
  return item;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** EXPANDER TABLE */
const m_expanders = {
  '{{': (arg: string) => {
    if (arg.substring(arg.length - 2, arg.length) !== '}}') return arg;
    const ex = arg.substring(2, arg.length - 2).trim();
    const ast = ParseExpression(ex);
    return ast;
  },
  '[[': (arg: string) => {
    if (arg.substring(arg.length - 2, arg.length) !== ']]') return arg;
    return arg.substring(2, arg.length - 2).trim();
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Scan argument list and convert expression to an AST. This is called for
 *  each ScriptUnit line after the keyword
 */
function m_ExpandScriptUnit(unit: TScriptUnit): TScriptUnit {
  const modUnit: TScriptUnit = unit.map((arg, idx) => {
    // arg is an array of elements in the ScriptUnit
    // skip first arg, which is the keyword
    if (idx === 0) return arg;
    if (Array.isArray(arg)) {
      const script = scriptConverter.tokenize(arg);
      const objcode = CompileBlock(script);
      return objcode; // this is the compiled script
    }
    if (typeof arg !== 'string') return arg;
    const strTest = m_expanders[arg.substring(0, 2)];
    if (strTest) return strTest(arg);
    return arg;
  });
  return modUnit;
}

/// CONVERTERS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function CompileRawUnit(rawUnit: TScriptUnit, tag: string = ''): TOpcode[] {
  // extract keyword first unit, assume that . means Feature
  // console.group('Expanding', rawUnit);
  let kwProcessor;
  let unit = m_ExpandScriptUnit(rawUnit);
  // first array element is keyword aka 'kw'
  let kw = unit[0];
  // if (tag) console.log(`...${tag}`, unit);
  // else console.log('COMPILING', unit);
  // let's compile!
  if (typeof kw !== 'string') return [];
  kwProcessor = GetKeyword(kw);
  // resume processing
  if (!kwProcessor) {
    kwProcessor = GetKeyword('dbgOut');
    kwProcessor.keyword = kw[0];
  }
  // console.groupEnd();
  // continue!
  const compiledStatement = kwProcessor.compile(unit); // qbits is the subsequent parameters
  return compiledStatement;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Compile a script block, returning objcode */
function CompileBlock(units: TScriptUnit[]): TOpcode[] {
  const objcode = []; // holder for compiled code
  let out; // holder for compiled unit
  units.forEach((unit, idx) => {
    // skip all pragmas
    if (unit[0] === '#') return;
    // recursive compile through m_ExpandScriptUnit()
    out = CompileRawUnit(unit);
    // save the obj code
    objcode.push(...out); // spread the output functions and push 'em
  });
  return objcode;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function CompileToBundle(units: TScriptUnit[], bdl: SM_Bundle) {
  let objcode; // holder for compiled code
  let defined = false;
  units.forEach((unit, idx) => {
    // pragmas run the program directly to effect system change
    if (unit[0] === '#') {
      // (1A) is this a pragma directive? then execute its program
      // which could affect compiler state
      // see keywords/pragma.ts for all valid options
      objcode = CompileRawUnit(['pragma', ...unit.slice(1)]);
      objcode.forEach(op => op(COMPILER_AGENT, COMPILER_STATE));
      const results = COMPILER_STATE.stack;
      if (results[0] === 'defBlueprint') {
        if (!defined) {
          bdl.setName(unit[1]);
          defined = true;
          return;
        }
        throw Error(`#BLUEPRINT used more than once (got '${unit[1]})'`);
      }
      return;
    }
    if (unit[0] === 'defBlueprint') {
      // (1B) also scan for defBlueprint keywords to set the name
      if (!defined) {
        bdl.setName(unit[1]);
        defined = true;
        return;
      }
      throw Error(`defBlueprint used more than once (got '${unit[1]}')`);
    }
    // (2) otherwise compile the code
    objcode = CompileRawUnit(unit); // qbits is the subsequent parameters
    // (3) and then push this code into the passed bundle
    AddToBundle(bdl, objcode); // objcode is pushed into the bundle by this
  }); // units.forEach
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Compile an array of TScriptUnit, representing one complete blueprint
 *  proof of concept
 */
function CompileScript(units: TScriptUnit[]): SM_Bundle {
  const bdl: SM_Bundle = new SM_Bundle();
  // no units? just return empty bundle
  if (units.length === 0) return bdl;
  CompileToBundle(units, bdl);
  if (bdl.name === undefined) throw Error('CompileScript: missing defBlueprint');
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
    const keyword = unit[0];
    // comment processing
    if (keyword === '//') {
      sourceJSX.push(undefined); // no jsx to render for comments
      if (DBG) console.groupEnd();
      return;
    }
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
/** Given an array of ScriptUnits, produce a source text */
function TextifyScript(units: TScriptUnit[]): string {
  const lines = [];
  units.forEach((unit, index) => {
    if (DBG) console.log(index, unit);
    if (unit[0] === 'comment') unit[0] = '//';
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
  if (DBG) console.groupCollapsed(...PR(`SAVING BLUEPRINT for ${bdl.name}`));
  SaveBlueprint(bdl);
  // run conditional programming in template
  // this is a stack of functions that run in global context
  console.log('registering blueprint', bdl);
  // run all the pertinent global blueprint programs
  // initialize any global conditions
  const { condition } = bdl.getPrograms();
  if (condition) condition.forEach(regFunc => regFunc());
  if (DBG) console.groupEnd();
  return bdl;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MakeAgent(agentName: string, options?: { blueprint: string }) {
  const { blueprint } = options || {};
  const agent = new Agent(agentName);
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
// console.log(...PR('\nblocks parsed', m_ScriptifyText(txt)));
// console.log(...PR('\nrestitched', m_StitchifyBlocks(m_ScriptifyText(txt))));

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Script is TScriptUnit[], the base representation of gemscript
export {
  CompileScript, // TScriptUnit[] => ISM_Bundle
  RenderScript, // TScriptUnit[] => JSX
  TextifyScript, // TScriptUnit[] => produce source text from units
  m_ScriptifyText as ScriptifyText // exprs => TScriptUnit[]
};
/// for blueprint operations
export {
  MakeAgent, // BlueprintName => Agent
  RegisterBlueprint // TScriptUnit[] => ISM_Bundle
};
