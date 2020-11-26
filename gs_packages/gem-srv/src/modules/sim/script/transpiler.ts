/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implement a "Keyword Dictionary" that manages the compile() and render()
  output for a particular script keyword. This module also exposes static
  methods for compiling and rendering TScriptUnit[] arrays

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import Agent from 'lib/class-agent';
import { TScriptUnit, TOpcode, ISMCBundle } from 'lib/t-script';
import {
  GetKeyword,
  SaveAgent,
  SaveBlueprint,
  GetBlueprint,
  AddToBundle
} from 'modules/runtime-datacore';
import { ParseExpression } from 'lib/expr-parser';
import GScriptTokenizer from 'lib/class-gscript-tokenizer-2';
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
  return { script };
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
    console.log(
      `m_expanders: inline references are not yet implemented\n- ${arg}\n`
    );
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
      // program block
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
function CompileLoop(bdl: ISMCBundle, units: TScriptUnit[]) {
  units.forEach((unit, idx) => {
    if (unit[0] === 'defBlueprint') bdl.name = unit[1];
    if (unit[0] === '#') {
      // pragmas run the program directly to effect system change
      // for example setting the bundle output
      const runcode = CompileRawUnit(['pragma', ...unit.slice(1)]);
      runcode.forEach(op => op(COMPILER_AGENT, COMPILER_STATE));
    } else {
      // otherwise compile the code
      const objcode = CompileRawUnit(unit); // qbits is the subsequent parameters
      AddToBundle(bdl, objcode);
    }
  }); // units.forEach
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Compile an array of TScriptUnit, representing one complete blueprint
 *  proof of concept
 */
function CompileScript(units: TScriptUnit[]): ISMCBundle {
  const bdl: ISMCBundle = {
    name: undefined,
    define: [],
    defaults: [],
    conditions: [],
    update: []
  };
  if (!(units.length > 0)) return bdl;
  CompileLoop(bdl, units);
  if (bdl.name === undefined) throw Error('CompileScript: missing defBlueprint');
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** tokenizes the text line-by-line into ScriptUnit[]
 */
function ScriptifyText(text: string): TScriptUnit[] {
  // const sourceStrings = m_StitchifyBlocks(m_ScriptifyText(text));
  // was: const sourceStrings = text.split('\n');

  const scriptUnits = [];

  // // now compile the updated strings
  // sourceStrings.forEach(str => {
  //   str = str.trim();
  //   const unit = m_LineToScriptUnit(str); // invoke script tokenizer for line
  //   if (unit.length > 0 && unit[0] !== undefined) scriptUnits.push(unit);
  // });

  return scriptUnits;
}
/// BLUEPRINT UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterBlueprint(units: TScriptUnit[]): ISMCBundle {
  const bp = CompileScript(units);
  if (!(units.length > 0)) return bp;
  if (DBG) console.groupCollapsed(...PR(`SAVING BLUEPRINT for ${bp.name}`));
  SaveBlueprint(bp);
  // run conditional programming in template
  // this is a stack of functions that run in global context
  const { conditions } = bp;
  let out = [];
  conditions.forEach(regFunc => {
    out.push(regFunc());
  });
  if (DBG) console.groupEnd();

  return bp;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MakeAgent(agentName: string, options?: { blueprint: string }) {
  const { blueprint } = options || {};
  const agent = new Agent(agentName);
  // handle extension of base agent
  // TODO: doesn't handle recursive agent definitions
  if (blueprint !== undefined) {
    const bp = GetBlueprint(blueprint);
    if (!bp) throw Error(`agent blueprint for '${blueprint}' not defined`);
    // console.log(...PR(`Making '${agentName}' w/ blueprint:'${blueprint}'`));
    agent.setBlueprint(bp);
  }
  return SaveAgent(agent);
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
  CompileScript, // TScriptUnit[] => ISMCBundle
  RenderScript, // TScriptUnit[] => JSX
  TextifyScript, // TScriptUnit[] => produce source text from units
  ScriptifyText // exprs => TScriptUnit[]
};
/// for blueprint operations
export {
  MakeAgent, // BlueprintName => Agent
  RegisterBlueprint // TScriptUnit[] => ISMCBundle
};
/// for testing methods
export { m_ScriptifyText as ExtractifyBlocks };
