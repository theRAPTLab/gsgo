/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implement a "Keyword Dictionary" that manages the compile() and render()
  output for a particular script keyword. This module also exposes static
  methods for compiling and rendering source arrays

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { ScriptUnit, IAgentTemplate, IKeyword, IKeywordCtor } from 'lib/t-script';
import { Parse, TokenizeToScriptUnit, TokenizeToSource } from './script-parser';
import { Evaluate } from './script-evaluator';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('KWDICT', 'TagDkRed');
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const KEYWORDS: Map<string, IKeyword> = new Map();

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
/** given a KeywordConstructor function, add to the KEYWORDS dictionary */
function RegisterKeyword(Ctor: IKeywordCtor) {
  const kobj = new Ctor();
  KEYWORDS.set(kobj.keyword, kobj);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** compile an array of ScriptUnit */
function CompileSource(units: ScriptUnit[]): IAgentTemplate {
  const program = {
    define: [],
    defaults: [],
    conditions: [],
    init: []
  };
  // this has to look through the output to determine what to compile
  units.forEach(unit => {
    const qbits = m_TokenQueue(unit);
    // extract keyword from front of qbits
    let cmdName = qbits.shift();
    // get keyword
    const cmdObj = KEYWORDS.get(cmdName) || KEYWORDS.get('dbgError');
    const programs = cmdObj.compile(qbits); // qbits is the subsequent parameters
    if (DBG) console.log(unit, '->', programs);
    const { define, defaults, conditions, init } = programs;
    if (define && define.length) program.define.push(...define);
    if (defaults && defaults.length) program.defaults.push(...define);
    if (conditions && conditions.length) program.conditions.push(...define);
    if (init && init.length) program.init.push(...define);
  });
  return program;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an array of ScriptUnits, return JSX keyword components for each line
 *  as rendered by the corresponding KeywordDef object
 */
function RenderSource(units: ScriptUnit[]): any[] {
  console.log(units);

  const sourceJSX = [];
  units.forEach((unit, index) => {
    if (DBG) console.log(index, unit);
    const keyword = unit[0];
    const cmdObj = KEYWORDS.get(keyword) || KEYWORDS.get('dbgError');
    sourceJSX.push(cmdObj.render(index, unit));
  });
  return sourceJSX;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an array of ScriptUnits, produce a source text */
function DecompileSource(units: ScriptUnit[]): string {
  console.log(units);
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
  RegisterKeyword // Ctor => store in KEYWORDS table by keyword
};
/// Source is ScriptUnit[], produced by GUI
export {
  CompileSource, // ScriptUnit[] => IAgentTemplate
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
