/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  class that implements a keyword object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TOpcode } from 'lib/t-smc';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const KEYWORDS: Map<string, SM_Keyword> = new Map();
const DBG = true;
const PR = UR.PrefixUtil('SM_Keyword');

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface IKeywordConstructor {
  new (keyword?: string): SM_Keyword;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** exported by the 'compile' method */
export interface ITemplatePrograms {
  template_define?: TOpcode[];
  template_defaults?: TOpcode[];
  template_conditions?: TOpcode[];
  agent_init?: TOpcode[];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** two words separated by a single space */
type TupleString = string;

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** receives an actual line of code like 'defTemplate Bee' */
function m_CompileLine(line: string): ITemplatePrograms {
  const bits = line.split(' '); // tokenize
  // what is the command?
  let cmdName = bits.shift();
  // how do we compile it?
  const cmdObj = KEYWORDS.get(cmdName);
  if (!cmdObj) {
    throw Error(
      `smc_error( 'ERR: unknown command:"${cmdName}" parms:"${bits.join(' ')}" )`
    );
  }
  return cmdObj.compile(bits); // bits is the subsequent parameters
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** render an actual line of code like 'defTemplate Bee' */
function m_RenderLine(line) {
  const bits = line.split(' '); // tokenize
  // what is the command?
  let cmdName = bits.shift();
  // how do we compile it?
  const cmdObj = KEYWORDS.get(cmdName);
  if (!cmdObj)
    return [
      `smc_error( 'ERR: unknown command:"${cmdName}" parms:"${bits.join(' ')}" )`
    ];
  return cmdObj.render(bits); // bits is the subsequent parameters
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** base class for all keyword definitions */
export class SM_Keyword {
  keyword: string;
  args: string[];
  req_scope: Set<string>;
  key_scope: Set<string>;
  //
  constructor(keyword: string) {
    if (typeof keyword !== 'string')
      throw Error('SM_Keyword requires string, not undefined');
    else if (DBG) console.log('SM_Keyword constructing:', keyword);
    this.keyword = keyword;
    this.args = [];
    this.req_scope = new Set();
    this.key_scope = new Set();
  }

  /** override in subclass */
  compile(parms: string[]): ITemplatePrograms {
    throw Error(`${this.keyword}.compile() must be overridden by subclassers`);
  }

  /** override in subclass */
  render(parms: string[], children?: string[]): any {
    throw Error(`${this.keyword}.render() must be overridden by subclassers`);
  }
} // end of SM_Keyword

/// STATIC CLASS METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** compile an array of lines of code */
function CompileSource(source: string[]) {
  const output = {
    template_define: [],
    template_defaults: [],
    template_conditions: [],
    agent_init: []
  };
  //  source.forEach(line => output.push(...m_CompileLine(line)));
  // this has to look through the output to determine what to compiler
  source.forEach(line => {
    const programs = m_CompileLine(line);
    console.log(line, '->', programs);
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
    return output;
  });
  console.log(...PR('program output (definition, defaults, conditions)'));
  output.template_define.forEach(statement =>
    console.log('definition:', statement)
  );
  output.template_defaults.forEach(statement =>
    console.log('defaults:  ', statement)
  );
  output.template_conditions.forEach(statement =>
    console.log('conditions:', statement)
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** render a source array into react components or whatever */
function RenderSource(source: string[]) {
  const react = [];
  source.forEach(line => {
    const jsx = m_RenderLine(line);
    react.push(jsx);
  });
  console.log(...PR('JSX output (would require correct order in source)'));
  react.forEach(component => console.log(component));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a KeywordConstructor function, add to the KEYWORDS dictionary */
function AddKeyword(KeywordConstructor: IKeywordConstructor) {
  const kobj = new KeywordConstructor();
  KEYWORDS.set(kobj.keyword, kobj);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see additional exports above
export const KEYGEN = {
  CompileSource,
  RenderSource,
  AddKeyword
};
