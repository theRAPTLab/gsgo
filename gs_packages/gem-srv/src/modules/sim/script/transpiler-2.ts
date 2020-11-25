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
  GetBlueprint
} from 'modules/runtime-datacore';
import { ParseExpression } from 'lib/expr-parser';
import GScriptTokenizer from 'lib/class-gscript-tokenizer';
import * as DATACORE from 'modules/runtime-datacore';
// critical imports
import 'script/keywords/_all_keywords';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRNPLR', 'TagRed');
const scriptConverter = new GScriptTokenizer();
const LSEP = '\r'; // non-printing line sep character
//
const DBG = true;

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a text with multiline blocks, emit an array of strings corresponding
 *  to regular strings and << >> demarked lines. The output nodes are processed
 *  back into a single line with m_StitchifyBlocks(). Returns an array of
 *  string arrays.
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
    // note: inline << progName >> is handled by gscript-tokenizer
    const startBlock = str.slice(-2) === '<<';
    const endBlock = str.length === 2 && str.slice(0, 2) === '>>';
    const endStartBlock =
      str.length > 3 && startBlock && str.slice(0, 2) === '>>';

    // case 3 - adjacent blocks >> <<
    if (endStartBlock) {
      if (level === 1) {
        // we are in a block so push two '>>
        if (ASB) buffer.push('>>');
        nodes.push(buffer);
        if (ASB) buffer = ['<<'];
      }
      return;
    }
    // case 1 - start of a block ...<<
    if (startBlock) {
      level++;
      const sub = str.slice(0, str.length - 2).trim();
      if (sub.length > 0) buffer.push(sub);
      if (level === 1) {
        // trickiness
        if (buffer.length > 0) {
          nodes.push(buffer);
          buffer = [];
        }
      }
      if (ASB) buffer.push('<<');
      return;
    }
    // case 2 - end of a block >>...
    if (endBlock) {
      level--;
      if (ASB) buffer.push('>>');
      if (level === 0) {
        nodes.push(buffer);
        nodes.push('EOB');
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
  // (1) if the first element has a <<, it's a block and should be merged
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
    // if a node is not an array, then it's a special marker
    if (!Array.isArray(node)) {
      // skip 'EOB' markers, which are currently just to delineate blocks
      // in the nodes format
      if (node === 'EOB') return;
    }
    // nodes contains arrays of strings : 7
    // "blocks" are special case with node[0]==='<<'
    // "normal string segments" otherwise
    if (node[0] !== '<<') {
      node.forEach(item => lines.push(item));
    } else {
      let line = '';
      node.forEach((item, jj) => {
        // each item in the node is a string to be stitched together
        // the << and >> appear on their own lines
        if (jj === item.length - 2) {
          line += `${item} `;
          return;
        }
        if (item === '<<') {
          line += '<< ';
          return;
        }
        if (item === '>>') {
          line += '>> ';
          return;
        }
        if (item.slice(0, 2) === '//') {
          // skip comments
          return;
        }
        if (item.slice(-2) === '}}') {
          line += `${item}${LSEP} `; //
          return;
        }
        // add line delimiter ';' in safe place
        line += `${item}${LSEP} `;
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
  if (str.length === 0) return ['dbgError', 'empty line'];
  const toks = scriptConverter.tokenize(str);
  if (toks) unit.push(...toks);
  return unit;
}
function m_MergeBundleToProgram(bdl: ISMCBundle) {
  const { name, define, defaults, conditions, update } = bdl;
  const program = [];
  if (define) program.push(...define);
  if (defaults) program.push(...defaults);
  if (conditions) program.push(...conditions);
  if (update) program.push(...update);
  return program;
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
  '<<': (arg: string) => {
    if (arg.substring(arg.length - 2, arg.length) !== '>>') return arg;
    const prog: TOpcode[] = [];
    const extract = arg.substring(2, arg.length - 2).trim();
    const lines = m_SeparateBlockLines(extract);
    console.log(`converting "${extract}" into lines`, lines);
    // process all the block contents
    lines.forEach(line => {
      const ex = line.trim();
      const rawUnit = m_LineToScriptUnit(ex);
      const bundle = CompileRawUnit(rawUnit, 'SUB');
      const merged = m_MergeBundleToProgram(bundle);
      prog.push(...merged);
    });
    return prog;
  }
};
function m_SeparateBlockLines(str: string): string[] {
  const lines = [];
  let out = '';
  let idx = 0;
  let level = 0;
  let len = str.length;
  let ch;
  let chn;
  const OO = '<';
  const CC = '>';
  console.log('separating', str);

  while (idx < len) {
    ch = str.charAt(idx++);
    chn = str.charAt(idx);
    if (ch === OO && chn === OO) level++;
    if (ch === CC && chn === CC) level--;
    /*
      we want to separate lines
     */
    if (ch === LSEP && level < 1) {
      lines.push(out);
      out = '';
    }
    out += ch;
  }
  if (out.length > 0) lines.push(out);
  return lines;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Scan argument list and convert expression to an AST. This is called for
 *  each ScriptUnit line after the keyword
 */
function m_ExpandScriptUnit(unit: TScriptUnit): TScriptUnit {
  const modUnit: TScriptUnit = unit.map((arg, idx) => {
    // arg is an array of elements in the ScriptUnit
    // skip first arg, which is the keyword
    if (idx === 0) return arg;
    if (typeof arg !== 'string') return arg;
    const strTest = m_expanders[arg.substring(0, 2)];
    if (strTest) return strTest(arg);
    return arg;
  });
  return modUnit;
}

/// CONVERTERS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function CompileRawUnit(rawUnit: TScriptUnit, tag: string = ''): ISMCBundle {
  // extract keyword first unit, assume that . means Feature
  console.group('Expanding', rawUnit);
  let unit = m_ExpandScriptUnit(rawUnit);
  // detect comments, if they were not filtered out somehow
  // the should be filtered out
  if (unit[0] === '//') unit[0] = 'comment';
  if (unit[0] === '--') unit[0] = 'comment';
  // first array element is keyword aka 'kw'
  let kw = unit[0];
  if (tag) console.log(`...${tag}`, unit);
  else console.log('COMPILING', unit);
  let kwProcessor = GetKeyword(kw);
  // resume processing
  if (!kwProcessor) {
    console.log('err compile', kw[0]);
    kwProcessor = GetKeyword('dbgError');
    kwProcessor.keyword = kw[0];
  }
  console.groupEnd();
  // continue!
  const bundle = kwProcessor.compile(unit); // qbits is the subsequent parameters
  return bundle;
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
  if (DBG) {
    console.group(...PR('COMPILING SCRIPT'));
    const out = m_PrintScriptToText(units);
    console.log(`PARSING TEXT\n${out.trim()}`);
  }
  // START COMPILING //////////////////////////////////////////////////////////
  // this has to look through the output to determine what to compile
  units.forEach((unit, idx) => {
    const bundle = CompileRawUnit(unit); // qbits is the subsequent parameters
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
  if (DBG) console.log(...PR(`COMPILED ${bdl.name}`, bdl));
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
  const sourceStrings = m_StitchifyBlocks(m_ExtractBlocks(text));
  // was: const sourceStrings = text.split('\n');

  const scriptUnits = [];

  // now compile the updated strings
  sourceStrings.forEach(str => {
    str = str.trim();
    const unit = m_LineToScriptUnit(str); // invoke script tokenizer for line
    if (unit.length > 0 && unit[0] !== undefined) scriptUnits.push(unit);
  });

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
    console.groupEnd();
  }
  return SaveAgent(agent);
}

/// TEST CODE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const txt = DATACORE.GetDefaultText();
console.log(...PR('\nblocks parsed', m_ExtractBlocks(txt)));
console.log(...PR('\nrestitched', m_StitchifyBlocks(m_ExtractBlocks(txt))));

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
