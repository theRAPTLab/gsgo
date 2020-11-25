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
  ExpandScriptUnit,
  Tokenize,
  TokenizeToScriptUnit,
  TokenizeToSource
} from 'lib/script-parser';
import { Evaluate } from 'lib/script-evaluator';
// critical imports
import 'script/keywords/_all_keywords';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRNPLR');
const DBG = true;

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
  if (DBG) console.groupCollapsed(...PR(`COMPILING ${units[1]}`));
  let out = '\n';
  units.forEach(unit => {
    unit.forEach(item => {
      out += `${item} `;
    });
    out = `${out.trim()}\n`;
  });
  if (DBG) console.log(`SOURCE\n${out.trim()}`);
  // this has to look through the output to determine what to compile
  units.forEach((rawUnit, idx) => {
    // detect comments
    if (rawUnit[0] === '//') return;
    // extract keyword first unit, assume that . means Feature
    let unit = ExpandScriptUnit(rawUnit);
    // first in array is keyword aka 'cmdName'
    let cmdName = unit[0];
    let cmdObj = GetKeyword(cmdName);
    // resume processing
    if (!cmdObj) {
      cmdObj = GetKeyword('unknownKeyword');
      unit.splice(1, 0, false); // insert 'repeat:false' into unknown keyword.
      cmdObj.keyword = cmdName;
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
  if (DBG) console.groupEnd();
  return bdl;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an array of ScriptUnits, return JSX keyword components for each line
 *  as rendered by the corresponding KeywordDef object
 */
function RenderSource(units: TScriptUnit[]): any[] {
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
      cmdObj = GetKeyword('unknownKeyword');
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
};
/// for converting text to TScriptUnit Source
export {
  TokenizeToScriptUnit, // expr => TScriptUnit
  TokenizeToSource // exprs => TScriptUnit[]
};
