/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  class that implements a keyword object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { TOpcode } from 'lib/t-smc';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export interface IKeywordConstructor {
  new (keyword?: string): SM_Keyword;
}

/** exported by the 'compile' method */
export interface ITemplatePrograms {
  template_define?: TOpcode[];
  template_defaults?: TOpcode[];
  template_conditions?: TOpcode[];
  agent_init?: TOpcode[];
}

/** two words separated by a single space */
type TupleString = string;

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
    throw Error(`${this.keyword}.compile() must be implemented by subclassers`);
  }

  /** override in subclass */
  render(parms: string[], children: string[]): any {
    throw Error(`${this.keyword}.render() must be implemented by subclassers`);
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
