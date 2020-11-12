/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implement a "Keyword Dictionary" that manages the compile() and render()
  output for a particular script keyword. This module also exposes static
  methods for compiling and rendering source arrays

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { ScriptUnit, ISMCBundle } from 'lib/t-script';
import { GetKeyword } from 'modules/runtime-datacore';
import { Parse, TokenizeToScriptUnit, TokenizeToSource } from './script-parser';
import { Evaluate } from './script-evaluator';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('KWDICT', 'TagDkRed');
const DBG = false;

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** ensures that line returns a tokenized array.
 *  NOTE that when returning a copy of the array, elements of the array
 *  are not duplicated. This is OK because the result of m_TokenQueue returns
 *  a structure that will be used as a queue
 */
function m_TokenQueue(input: string | any[]): any[] {
  if (typeof input === 'string') return input.split(' '); // tokenize
  if (Array.isArray(input)) return input.map(el => el); // return new array!!!
  throw Error(`ERR: can not tokenize input ${input}`);
}
/// CONVERTERS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** compile an array of ScriptUnit, representing one complete blueprint
 *  proof of concept
 */
function CompileSource(units: ScriptUnit[]): ISMCBundle {
  const bdl: ISMCBundle = {
    name: undefined,
    define: [],
    defaults: [],
    conditions: [],
    update: []
  };
  // this has to look through the output to determine what to compile
  units.forEach(unit => {
    // detect comments
    if (unit[0] === '//') return;
    // extract keyword first unit, assume that . means Feature
    let cmdName = unit[0].split('.');
    // handle regular keyword
    let cmdObj;
    if (cmdName.length === 1) {
      cmdObj = GetKeyword(cmdName[0]);
    } else if (cmdName.length === 2) {
      const [fname, method] = cmdName;
      cmdObj = GetKeyword('featureCall');
      unit = ['featureCall', fname, method, ...unit.slice(1)];
    } else console.warn(...PR('parsing error', unit[0]));
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
      else throw Error('CompileSource: multiple defBlueprint in source');
    }
    if (define) bdl.define.push(...define);
    if (defaults) bdl.defaults.push(...defaults);
    if (conditions) bdl.conditions.push(...conditions);
    if (update) bdl.update.push(...update);
  }); // units.forEach
  if (bdl.name === undefined) throw Error('CompileSource: missing defBlueprint');
  if (DBG) console.log(...PR(`compiled ${bdl.name}`));
  return bdl;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an array of ScriptUnits, return JSX keyword components for each line
 *  as rendered by the corresponding KeywordDef object
 */
function RenderSource(units: ScriptUnit[]): any[] {
  const sourceJSX = [];
  units.forEach((unit, index) => {
    if (DBG) console.log(index, unit);
    const keyword = unit[0];
    // comment processing
    if (keyword === '//') {
      sourceJSX.push(unit.join(' '));
      return;
    }
    let cmdObj;
    if (!keyword.includes('.')) cmdObj = GetKeyword(keyword);
    else {
      cmdObj = GetKeyword('featureCall');
      const [fname, method] = keyword.split('.');
      unit = ['featureCall', fname, method, ...unit.slice(1)];
    }
    if (!cmdObj) {
      cmdObj = GetKeyword('dbgError');
      cmdObj.keyword = keyword;
    }
    sourceJSX.push(cmdObj.render(index, unit));
  });
  return sourceJSX;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an array of ScriptUnits, produce a source text */
function DecompileSource(units: ScriptUnit[]): string {
  const lines = [];
  units.forEach((unit, index) => {
    if (DBG) console.log(index, unit);
    lines.push(`${unit.join(' ')}`);
  });
  return lines.join('\n');
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Source is ScriptUnit[], produced by GUI
export {
  CompileSource, // ScriptUnit[] => ISMCBundle
  RenderSource, // ScriptUnit[] => JSX
  DecompileSource // ScriptUnit[] => produce source text from units
};
/// for expression evaluation
export {
  Parse, // expr => AST
  Evaluate // (AST,context)=>computed value
  // MakeEvaluator // (AST,context)=> smc_program
};
/// for converting text to ScriptUnit Source
export {
  TokenizeToScriptUnit, // expr => ScriptUnit
  TokenizeToSource // exprs => ScriptUnit[]
};
