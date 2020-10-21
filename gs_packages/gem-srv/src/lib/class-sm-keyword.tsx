/* eslint-disable react/prefer-stateless-function */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implement a "Keyword Object" base class that manages the compile() and
  render() output for a particular script keyword. This module also exposes
  static methods for compiling and rendering source arrays

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TOpcode } from 'lib/t-smc';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const KEYWORDS: Map<string, SM_Keyword> = new Map();

const DBG = false;
const PR = UR.PrefixUtil('SM_Keyword');

let RENDER_COUNTER = 0;
function m_GetIndex() {
  return RENDER_COUNTER++;
}

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
/** exported by the 'keywordObj' method */
export type KeywordObj = {
  index?: number; // used for reverse-mapping state changes from components
  keyword: string; // keyword of this object
  args: any[]; // values provided to the keyword
};

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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This generates an ever-increased ID for rendered React list elements.
 *  They are all unique because our rendering loop just rerenders the entire
 *  list into a GUI every time.
 */
let ID_GENERATOR = 0;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GenerateKey() {
  return ID_GENERATOR++;
}

/*///////////////////////////////// CLASS \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The SM_Keyword class is the base class for all GEMscript keywords.
  There is one keyword that begins a GEMscript source line, which is processed
  by the appropriate subclass that is defined to handle it.

  Each SM_Keyword implements:
  1. An array of strings that defines the name and type of each argument
     accepted by this keyword. This is used to help label the dropdown options
     for each GUI element and for documenting the keyword itself.
  2. A compiler() method that receives parameters specific to the keyword,
     which uses them to generate the correct smc program array that performs
     the function of this keyword. The smc program array is returned.
  3. A render() method that receives paramters specific to this keyword.
     It generates React elements that are the visual representation of an
     editable instance of this keyword.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
  compile(parms: any[]): ITemplatePrograms {
    throw Error(`${this.keyword}.compile() must be overridden by subclassers`);
  }

  keywordObj(parms: any[]): KeywordObj {
    throw Error(`${this.keyword}.keywordObj() must be overridden by subclassers`);
  }

  /** override in subclass */
  render(index: number, args: any[], children?: any[]): any {
    throw Error(`${this.keyword}.render() must be overridden by subclassers`);
  }

  /** cheese key id generator (deprecated) */
  generateKey() {
    return m_GenerateKey();
  }
} // end of SM_Keyword

/*////////////////////////////////// API \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  EXPORTED STATIC METHODS

  AddKeyword( KeywordConstructor )
    Adds a KeywordObj to the KEYWORD map, which maps keyword (string)
    to SM_Keyword instances for lookup.

  CompileTemplate( source ) returns ITemplatePrograms
    Given gemscript source, compiles and returns template program arrays that
    are used to instantiate an instance.

  RenderSource( source ) returns React.element
    Given gemscript source, renders the React elements that can be used
    to modify them in the GUI.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/** given a KeywordConstructor function, add to the KEYWORDS dictionary */
function AddKeyword(KeywordConstructor: IKeywordConstructor) {
  const kobj = new KeywordConstructor();
  KEYWORDS.set(kobj.keyword, kobj);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** compile an array of lines of code */
function CompileTemplate(source: string[] | any[][]) {
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
    if (!cmdObj) {
      throw Error(
        `COMPILE ERR: unknown command:"${cmdName}" parms:"${qbits.join(' ')}"`
      );
    }
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
/** First argument is the keyword and subsequent arguments are the parameters
 *  that will be passed to the keyword handling object
 */
function MakeKeywordObjs(source: any[]): KeywordObj[] {
  const temp: KeywordObj[] = [];
  source.forEach((line, index) => {
    const qbits = m_TokenQueue(line);
    // extract keyword from front of qbits
    let keyword = qbits.shift();
    // get keyword
    const cmdObj = KEYWORDS.get(keyword);
    if (!cmdObj)
      throw Error(`KEYOBJ ERR: "${keyword}" unknown, parms:"${qbits.join(' ')}"`);
    // this has {
    const kobj = cmdObj.keywordObj(qbits);
    kobj.index = index; // save index
    temp[index] = kobj;
  });
  return temp;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** render keyword objects into react components or whatever */
function RenderKeywordObjs(kobjs: KeywordObj[]) {
  const react = [];
  kobjs.forEach((kobj, index) => {
    const { keyword, args } = kobj;
    const cmdObj = KEYWORDS.get(keyword);
    if (!cmdObj) {
      console.log(`can't render ${index}:${keyword}`, kobj);
      return '';
    }
    // this has {
    const jsx = cmdObj.render(index, args);
    react.push(jsx);
  });
  return react;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see additional exports above
export const KEYGEN = {
  CompileTemplate,
  MakeKeywordObjs,
  RenderKeywordObjs,
  AddKeyword,
  UniqueKeyProp: m_GenerateKey
};
