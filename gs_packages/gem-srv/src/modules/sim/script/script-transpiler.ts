/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implement a "Keyword Dictionary" that manages the compile() and render()
  output for a particular script keyword. This module also exposes static
  methods for compiling and rendering source arrays

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
import {
  Parse,
  Tokenize,
  TokenizeToScriptUnit,
  TokenizeToSource
} from './script-parser';
import { Evaluate } from './script-evaluator';
// critical imports
import 'script/keywords/_all';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRNPLR');
const DBG = true;

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Scan argument list and convert expression to an AST. This is called for
 *  each ScriptUnit line after the keyword
 */
function m_Expressify(unit: TScriptUnit): TScriptUnit {
  const res: TScriptUnit = unit.map((arg, idx) => {
    // arg is an array of elements in the ScriptUnit
    // skip first arg, which is the keyword
    if (idx === 0) return arg;
    // don't process anything other than strings
    if (typeof arg !== 'string') return arg;
    if (arg.substring(0, 2) !== '{{') return arg;
    if (arg.substring(arg.length - 2, arg.length) !== '}}') return arg;
    // got this far? we need to parse the expression into an ast
    const ex = arg.substring(2, arg.length - 2).trim();
    const ast = Parse(ex);
    return ast;
  });
  return res;
}

/// CONVERTERS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Compile an array of TScriptUnit, representing one complete blueprint
 *  proof of concept
 */
function CompileSource(units: TScriptUnit[]): ISMCBundle {
  const bdl: ISMCBundle = {
    name: undefined,
    define: [],
    defaults: [],
    conditions: [],
    update: []
  };
  console.log(...PR('COMPILING', units));
  // this has to look through the output to determine what to compile
  units.forEach((rawUnit, idx) => {
    // detect comments
    if (rawUnit[0] === '//') return;
    // extract keyword first unit, assume that . means Feature
    let unit = m_Expressify(rawUnit);
    // first in array is keyword aka 'cmdName'
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
function RenderSource(units: TScriptUnit[]): any[] {
  const sourceJSX = [];
  units.forEach((unit, index) => {
    if (DBG) console.log(...PR('rendering', index, unit));
    const keyword = unit[0];
    // comment processing
    if (keyword === '//') {
      sourceJSX.push(unit.join(' '));
      return;
    }
    let cmdObj = GetKeyword(keyword);
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
function DecompileSource(units: TScriptUnit[]): string {
  const lines = [];
  units.forEach((unit, index) => {
    if (DBG) console.log(index, unit);
    lines.push(`${unit.join(' ')}`);
  });
  return lines.join('\n');
}

/// BLUEPRINT UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterBlueprint(units: TScriptUnit[]): ISMCBundle {
  const bp = CompileSource(units);
  SaveBlueprint(bp);
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

    console.log(...PR(`Making '${agentName}' w/ blueprint:'${blueprint}'`));
    agent.setBlueprint(bp);
    console.groupEnd();
  }
  return SaveAgent(agent);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Source is TScriptUnit[], produced by GUI
export {
  CompileSource, // TScriptUnit[] => ISMCBundle
  RenderSource, // TScriptUnit[] => JSX
  DecompileSource // TScriptUnit[] => produce source text from units
};
/// for blueprint operations
export {
  MakeAgent, // BlueprintName => Agent
  RegisterBlueprint // TScriptUnit[] => ISMCBundle
};
/// for expression evaluation
export {
  Tokenize, // expr => AST
  Evaluate // (AST,context)=>computed value
  // MakeEvaluator // (AST,context)=> smc_program
};
/// for converting text to TScriptUnit Source
export {
  TokenizeToScriptUnit, // expr => TScriptUnit
  TokenizeToSource // exprs => TScriptUnit[]
};
