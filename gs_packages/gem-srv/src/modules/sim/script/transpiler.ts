/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implement a "Keyword Dictionary" that manages the compile() and render()
  output for a particular script keyword. This module also exposes static
  methods for compiling and rendering TScriptUnit[] arrays

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import Agent from 'lib/class-agent';
import { TScriptUnit, ISMCBundle } from 'lib/t-script';
import {
  GetKeyword,
  SaveAgent,
  SaveBlueprint,
  GetBlueprint
} from 'modules/runtime-datacore';
import { ParseExpression } from 'lib/expr-parser';
import GScriptTokenizer from 'lib/class-gscript-tokenizer';
// critical imports
import 'script/keywords/_all_keywords';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRNPLR', 'TagRed');
const scriptConverter = new GScriptTokenizer();
const DBG = true;

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
/** tokenizes a line of text, returning a ScriptUnit */
function m_LineToScriptUnit(line: string): TScriptUnit {
  const str = line.trim();
  const unit = [];
  if (!str.length) return ['dbgError', 'empty line'];
  const toks = scriptConverter.tokenize(str);
  if (toks) unit.push(...toks);
  return unit;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const m_expanders = {
  '{{': (arg: string) => {
    if (arg.substring(arg.length - 2, arg.length) !== '}}') return arg;
    const ex = arg.substring(2, arg.length - 2).trim();
    const ast = ParseExpression(ex);
    return ast;
  },
  '[[': (arg: string) => {
    if (arg.substring(arg.length - 2, arg.length) !== ']]') return arg;
    const block = arg.substring(2, arg.length - 2).trim();
    console.log(...PR('ExpandArg: block expansion not implemented'));
    return block;
  }
};
/** given an argument check if it is either an expression or program block */
function m_ExpandArg(arg: any): any {
  // don't process anything other than strings
  if (typeof arg !== 'string') return arg;
  const strTest = m_expanders[arg.substring(0, 2)];
  if (strTest) return strTest(arg);
  return arg;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Scan argument list and convert expression to an AST. This is called for
 *  each ScriptUnit line after the keyword
 */
function m_ExpandScriptUnit(unit: TScriptUnit): TScriptUnit {
  const res: TScriptUnit = unit.map((arg, idx) => {
    // arg is an array of elements in the ScriptUnit
    // skip first arg, which is the keyword
    if (idx === 0) return arg;
    return m_ExpandArg(arg);
  });
  return res;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a text with multiline blocks, emit an array of strings corresponding
 *  to regular strings and [[ ]] demarked lines. The output nodes are processed
 *  back into a single line with m_StitchifyBlocks()
 */
function m_ExtractBlocks(text: string): Array<string[]> {
  const sourceStrings = text.split('\n');
  let level = 0;
  const nodes = [];
  let buffer = [];
  // "add sub brackets" to output
  const ASB = true;
  // first lets start scanning each line
  sourceStrings.forEach((str, idx) => {
    str = str.trim();
    if (str.length === 0) return;
    if (str.slice(0, 2) === '//') return;
    // block delimiters
    // note: inline [[ progName ]] is handled by gscript-tokenizer
    const startBlock = str.slice(-2) === '[[';
    const endBlock = str.slice(0, 2) === ']]';

    // case 3 - adjacent blocks ]] [[
    if (endBlock && startBlock) {
      if (level === 1) {
        if (ASB) buffer.push(']]');
        nodes.push(buffer);
        if (ASB) buffer = ['[['];
      }
      return;
    }
    // case 1 - start of a block ...[[
    if (startBlock) {
      level++;
      const sub = str.slice(0, str.length - 2).trim();
      if (sub.length) buffer.push(sub);
      if (level === 1) {
        if (buffer.length) {
          nodes.push(buffer);
          buffer = [];
        }
      }
      if (ASB) buffer.push('[[');
      return;
    }
    // case 2 - end of a block ]]...
    if (endBlock) {
      level--;
      if (ASB) buffer.push(']]');
      if (level === 0) {
        nodes.push(buffer);
        buffer = [];
      }
      return;
    }
    // case 4 - non-marker line
    buffer.push(str);
  });
  // cleanup
  if (buffer.length > 0) nodes.push(buffer);
  if (level !== 0) {
    console.log(
      ...PR(
        `error: unbalanced block level ${
          // eslint-disable-next-line no-nested-ternary
          level > 0 ? '+' : level < 0 ? '' : ' '
        }${level}`
      )
    );
    return undefined;
  }
  // at this point, the nodes array contains arrays of strings
  // (1) if the first element has a [[, it's a block and should be merged
  // (2) otherwise, it's regular strings
  return nodes;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given the node output of m_ExtractBlocks, re-stitch them back into
 *  text suitable for CompileScript(). Semi-colons are inserted to demarque
 *  line breaks for recursive blocked script compilation. The result is a
 *  single long string.
 */
function m_StitchifyBlocks(nodes: Array<string[]>): string[] {
  const lines = [];
  nodes.forEach((node, ii) => {
    // nodes contains arrays of strings :
    // "blocks" are special case with node[0]==='[['
    // "normal string segments" otherwise
    if (node[0] !== '[[') {
      node.forEach(item => lines.push(item));
    } else {
      let line = '';
      node.forEach((item, jj) => {
        // each item in the node is a string to be stitched together
        // the [[ and ]] appear on their own lines
        if (jj === item.length - 2) {
          line += `${item} `;
          return;
        }
        if (item === '[[') {
          line += '[[ ';
          return;
        }
        if (item === ']]') {
          line += ']] ';
          return;
        }
        if (item.slice(0, 2) === '//') {
          // skip comments
          return;
        }
        // add line delimiter ';' in safe place
        line += `${item}; `;
      });
      if (lines.length > 0) {
        lines[lines.length - 1] += ` ${line.trim()}`;
        // let lastLine = lines[lines.length - 1];
        // console.log(`modifying '${lastLine}' with '${line}`);
      }
    }
  });
  return lines;
}

/// CONVERTERS ////////////////////////////////////////////////////////////////
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
  if (DBG) {
    console.groupCollapsed(...PR(`COMPILING ${units[1]}`));
    const out = m_PrintScriptToText(units);
    console.log(`SCRIPT\n${out.trim()}`);
  }
  // START COMPILING //////////////////////////////////////////////////////////
  // this has to look through the output to determine what to compile
  units.forEach((rawUnit, idx) => {
    // extract keyword first unit, assume that . means Feature
    let unit = m_ExpandScriptUnit(rawUnit);
    // detect comments, if they were not filtered out somehow
    // the should be filtered out
    if (unit[0] === '//') unit[0] = 'comment';
    if (unit[0] === '--') unit[0] = 'comment';
    // first array element is keyword aka 'kw'
    let kw = unit[0];
    let kwProcessor = GetKeyword(kw);
    // resume processing
    if (!kwProcessor) {
      kwProcessor = GetKeyword('dbgError');
      kwProcessor.keyword = kw[0];
    }
    // continue!
    const bundle = kwProcessor.compile(unit); // qbits is the subsequent parameters
    if (DBG) console.log(unit, '->', bundle);
    const { name, define, defaults, conditions, update } = bundle;
    if (name) {
      if (bdl.name === undefined) bdl.name = name;
      else throw Error('CompileScript: multiple defBlueprint in source');
    }
    if (define) bdl.define.push(...define);
    if (defaults) bdl.defaults.push(...defaults);
    if (conditions) bdl.conditions.push(...conditions);
    if (update) bdl.update.push(...update);
  }); // units.forEach
  if (bdl.name === undefined) throw Error('CompileScript: missing defBlueprint');
  if (DBG) console.log(...PR(`compiled ${bdl.name}`));
  if (DBG) console.groupEnd();
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
  if (DBG) console.groupCollapsed(...PR(`RENDERING ${units[0][1]}`));
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
  const sourceStrings = m_StitchifyBlocks(m_ExtractBlocks(text));
  // was: const sourceStrings = text.split('\n');

  const scriptUnits = [];

  // now compile the updated strings
  sourceStrings.forEach(str => {
    str = str.trim();
    const unit = m_LineToScriptUnit(str); // invoke script tokenizer for line
    if (unit.length && unit[0] !== undefined) scriptUnits.push(unit);
  });

  return scriptUnits;
}
/// BLUEPRINT UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterBlueprint(units: TScriptUnit[]): ISMCBundle {
  const bp = CompileScript(units);
  if (!(units.length > 0)) return bp;
  SaveBlueprint(bp);
  // run conditional programming in template
  // this is a stack of functions that run in global context
  const { conditions } = bp;
  let out = [];
  if (DBG) console.groupCollapsed(...PR(`CONDITIONS for ${bp.name}`));
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
    console.groupEnd();
  }
  return SaveAgent(agent);
}

/// TEST CODE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const txt = `
// definitions
defBlueprint "Bunny"
addProp frame Number 2
// conditions
onAgentPair Bee touches Honey {{ agent.prop('range') }} [[
  {{ agent.prop('x').increment }}
  [[ TEST:testName ]]
  setProp 'x' 0
  // the expression context passed is agent, subjectA, subjectAB
]]
addProp sprite "bunny.json"
on Tick [[
  agentProp 'x' something
]] [[
  agentProp "y" something else
]]
onAgent Bee [[
  // return boolean
  agentProp x lessThan 0
]] [[
  PROGRAM:programName
]]
// definitions
useFeature Movement
// defaults
prop skin 'bunny.json'
// runtime
featureCall Movement jitterPos -5 5
// condition test 1
addTest BunnyTest {{ agent.prop('frame').value }}
ifTest BunnyTest {{ agent.prop('x').setTo(global.LibMath.sin(global._frame()/10)*100) }}
// condition test 2
ifExpr {{ global.LibMath.random() < 0.01 }} {{ agent.prop('y').setTo(100) }} {{ agent.prop('y').setTo(0) }}
`;
// console.log(...PR('\nblocks parsed', m_ExtractBlocks(txt)));
// console.log(...PR('\nrestitched', m_StitchifyBlocks(m_ExtractBlocks(txt))));
// console.log(...PR('\nsplits', txt.split(/\s*[;\n]+\s*/)));

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
