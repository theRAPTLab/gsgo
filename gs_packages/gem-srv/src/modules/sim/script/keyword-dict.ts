/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implement a "Keyword Dictionary" that manages the compile() and render()
  output for a particular script keyword. This module also exposes static
  methods for compiling and rendering source arrays

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { ScriptUnit, IAgentTemplate, IKeyword, IKeywordCtor } from 'lib/t-script';
import { Parse, ScriptifyString, ScriptifyText } from './script-parser';
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
    const cmdObj = KEYWORDS.get(cmdName);
    if (!cmdObj) throw Error(`COMPILE ERR: unknown command:"${cmdName}"`);
    const programs = cmdObj.compile(qbits); // qbits is the subsequent parameters
    if (DBG) console.log(unit, '->', programs);
    const {
      define: define,
      defaults: defaults,
      conditions: cond,
      init: init
    } = programs;
    if (define && define.length) program.define.push(...define);
    if (defaults && defaults.length) program.defaults.push(...define);
    if (cond && cond.length) program.conditions.push(...define);
    if (init && init.length) program.init.push(...define);
  });
  return program;
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
    const cmdObj = KEYWORDS.get(keyword);
    if (!cmdObj) {
      console.log(KEYWORDS);
      throw Error(`can't render ${index}:${keyword}`);
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
export { RegisterKeyword };
export { CompileSource, RenderSource, DecompileSource };
/// Parse creates AST from a string expression
/// ScriptifyString converts expression to ScriptUnit keywords
/// ScriptifyText parses a string of lines into ScriptUnit[]
export { Parse, ScriptifyString, ScriptifyText };
export { Evaluate };
