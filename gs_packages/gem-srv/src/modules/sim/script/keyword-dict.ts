/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implement a "Keyword Dictionary" that manages the compile() and render()
  output for a particular script keyword. This module also exposes static
  methods for compiling and rendering source arrays

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { ScriptUnit, IAgentTemplate, IKeyword, IKeywordCtor } from 'lib/t-script';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('KWDICT', 'TagDkRed');
const DBG = true;
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
/** compile an array of lines of code */
function CompileSource(source: ScriptUnit[]): IAgentTemplate {
  const output = {
    template_define: [],
    template_defaults: [],
    template_conditions: [],
    agent_init: []
  };
  // source.forEach(line => output.push(...m_CompileLine(line)));
  // this has to look through the output to determine what to compiler
  source.forEach(line => {
    const qbits = m_TokenQueue(line);
    // extract keyword from front of qbits
    let cmdName = qbits.shift();
    // get keyword
    const cmdObj = KEYWORDS.get(cmdName);
    if (!cmdObj) throw Error(`COMPILE ERR: unknown command:"${cmdName}"`);
    const programs = cmdObj.compile(qbits); // qbits is the subsequent parameters
    if (DBG) console.log(line, '->', programs);
    const {
      template_define: define,
      template_defaults: defaults,
      template_conditions: cond,
      agent_init: init
    } = programs;
    if (define && define.length) output.template_define.push(...define);
    if (defaults && defaults.length) output.template_defaults.push(...define);
    if (cond && cond.length) output.template_conditions.push(...define);
    if (init && init.length) output.agent_init.push(...define);
  });
  return output;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an array of source lines, return JSX keyword components for each line
 *  as rendered by the corresponding KeywordDef object
 */
function RenderSource(source: ScriptUnit[]): any[] {
  const sourceJSX = [];
  source.forEach((srcLine, index) => {
    console.log(index, srcLine);
    const keyword = srcLine[0];
    const cmdObj = KEYWORDS.get(keyword);
    if (!cmdObj) throw Error(`can't render ${index}:${keyword}`);
    sourceJSX.push(cmdObj.render(index, srcLine));
  });
  return sourceJSX;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { RegisterKeyword, CompileSource, RenderSource };
