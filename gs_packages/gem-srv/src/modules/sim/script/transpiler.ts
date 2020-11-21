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
const PR = UR.PrefixUtil('TRNPLR');
const scriptConverter = new GScriptTokenizer();
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
function m_ExpandArg(arg: any): any {
  // don't process anything other than strings
  if (typeof arg !== 'string') return arg;
  if (arg.substring(0, 2) !== '{{') return arg;
  if (arg.substring(arg.length - 2, arg.length) !== '}}') return arg;
  // got this far? we need to ParseExpression the expression into an ast
  const ex = arg.substring(2, arg.length - 2).trim();
  const ast = ParseExpression(ex);
  return ast;
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
function m_DeblockifyText(text: string) {
  const sourceStrings = text.split('\n');
  let level = 0;
  const nodes = [];
  let buffer = [];
  // first lets start scanning each line
  sourceStrings.forEach((str, idx) => {
    str = str.trim();
    if (DBG) console.log(`${idx} ${str} level:${level}\t`, buffer);
    if (str.length === 0) return;
    if (str.slice(0, 2) === '//') return;
    // block delimiters
    // note: inline [[ progName ]] is handled by gscript-tokenizer
    const startBlock = str.slice(-2) === '[[';
    const endBlock = str.slice(0, 2) === ']]';
    // case 3 - adjacent blocks
    if (endBlock && startBlock) {
      if (level === 1) {
        buffer.push(']]');
        nodes.push(buffer);
        buffer = ['[['];
      }
      return;
    }
    // case 1 - start of a block
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
      buffer.push('[[');
      return;
    }
    // case 2 - end of a block
    if (endBlock) {
      level--;
      buffer.push(']]');
      if (level === 0) {
        // closed outside [[ ]]? clear buffer
        nodes.push(buffer);
        buffer = [];
      }
      return;
    }
    // case 4 - normal line
    buffer.push(str);
  });
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
  // return a sequence
  return nodes;
}
function m_StitchifyBlocks(nodes) {
  let level = 0;
  let line = '';
  nodes.forEach((node, ii) => {
    /*/
    nodes are "normal string segments" and "blocks"
    if node.length is 1, then it's normal string
    otherwise, it's a block to stitch together
    /*/
    if (node.length === 1) {
      line += `${node[0]} `;
    } else {
      node.forEach((item, jj) => {
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
        if (item.slice(-2) === '}}') {
          line += `${item} `;
          return;
        }
        if (item.slice(0, 2) === '//') {
          // skip comments
          return;
        }
        line += `${item}; `;
      });
    }
  });
  return line;
}
/// - - -
const txt = `
onAgentPair Bee touches Honey {{ agent.prop('range') }} [[
  {{ agent.prop('x').increment }}
  [[ TEST:programName ]]
  setProp 'x' 0
  // the expression context passed is agent, subjectA, subjectAB
]]
// on Tick [[
//   agentProp x something
// ]]

`;
// console.log(...PR('\nblocks parsed', m_DeblockifyText(txt)));
console.log(...PR(`\n${m_StitchifyBlocks(m_DeblockifyText(txt))}`));
// console.log(...PR('\nsplits', txt.split(/\s*[;\n]+\s*/)));

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
    // first in array is keyword aka 'cmdName'
    // detect comments
    if (unit[0] === '//') unit[0] = 'comment';
    if (unit[0] === '--') unit[0] = 'comment';
    let cmdName = unit[0];
    let cmdObj = GetKeyword(cmdName);
    // resume processing
    if (!cmdObj) {
      cmdObj = GetKeyword('dbgError');
      cmdObj.keyword = cmdName[0];
    }
    // continue!
    const parms = unit.slice(1);
    const bundle = cmdObj.compile(parms); // qbits is the subsequent parameters
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
    let cmdObj = GetKeyword(keyword);
    if (!cmdObj) {
      cmdObj = GetKeyword('dbgError');
      cmdObj.keyword = keyword;
    }
    const jsx = cmdObj.jsx(index, unit);
    sourceJSX.push(jsx);
    out.push(`<${cmdObj.getName()} ... />\n`);
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
  /* HACK pc line endings would screw this, need more robust check */
  const sourceStrings = text.split('\n');
  // now compile the updated strings
  const scriptUnits = [];
  sourceStrings.forEach(str => {
    str = str.trim();
    const unit = m_LineToScriptUnit(str);
    if (unit.length && unit[0] !== undefined) scriptUnits.push(unit);
  });
  return scriptUnits;
}

/// BLUEPRINT UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterBlueprint(units: TScriptUnit[]): ISMCBundle {
  const bp = CompileScript(units);
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
