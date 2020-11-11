/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implement a "Keyword Dictionary" that manages the compile() and render()
  output for a particular script keyword. This module also exposes static
  methods for compiling and rendering source arrays

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { IScopeableCtor, TMethod } from 'lib/t-smc';
import { ScriptUnit, ISMCBundle, IKeyword, IKeywordCtor } from 'lib/t-script';
import { Parse, TokenizeToScriptUnit, TokenizeToSource } from './script-parser';
import { Evaluate } from './script-evaluator';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('KWDICT', 'TagDkRed');
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// these should be moved to DATACORE
const KEYWORDS: Map<string, IKeyword> = new Map();
const SMOBJS: Map<string, IScopeableCtor> = new Map();
const TESTS: Map<string, TMethod> = new Map();

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

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a Keyword Constructor function, add to the KEYWORDS dictionary */
function RegisterKeyword(Ctor: IKeywordCtor) {
  const kobj = new Ctor();
  KEYWORDS.set(kobj.keyword, kobj);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a SMObject, store in SMOBJS */
function RegisterSMObjectCtor(name: string, ctor: IScopeableCtor) {
  if (SMOBJS.has(name)) throw Error(`RegisterSMObjectCtor: ${name} exists`);
  SMOBJS.set(name, ctor);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** get the registered SMObject constructor by name */
function GetSMObjectCtor(name: string): IScopeableCtor {
  if (!SMOBJS.has(name)) throw Error(`GetSMObjectCtor: ${name} `);
  return SMOBJS.get(name);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterTest(name: string, smc: TMethod) {
  if (TESTS.has(name)) throw Error(`RegisterTest: ${name} exists`);
  TESTS.set(name, smc);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetTest(name: string) {
  if (!TESTS.has(name)) {
    console.log(...PR(`test '${name}' doesn't exist`));
  } else return TESTS.get(name);
}

/// CONVERTERS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** compile an array of ScriptUnit, representing one complete blueprint */
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
    // extract keyword first unit
    let cmdName = unit[0];
    // get keyword
    let cmdObj = KEYWORDS.get(cmdName);
    if (!cmdObj) {
      cmdObj = KEYWORDS.get('dbgError');
      cmdObj.keyword = cmdName;
    }
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
  });
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
    let cmdObj = KEYWORDS.get(keyword);
    if (!cmdObj) {
      cmdObj = KEYWORDS.get('dbgError');
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
export {
  RegisterKeyword, // Ctor => store in KEYWORDS table by keyword
  RegisterSMObjectCtor,
  GetSMObjectCtor,
  RegisterTest,
  GetTest
};
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
