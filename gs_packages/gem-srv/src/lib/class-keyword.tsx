/*///////////////////////////////// CLASS \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Keyword class is the base class for all GEMscript keywords.
  There is one keyword that begins a GEMscript source line, which is processed
  by the appropriate subclass that is defined to handle it.

  Each Keyword implements:
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

import React from 'react';
import { IKeyword, ISMCBundle, ScriptUnit } from 'lib/t-script';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HACK: used to generate ever-increasing ID for rendering. They are all unique
 *  because our rendering loop just rerenders the entire list into a GUI every
 *  time. This is probably not the way to do it efficiently in React.
 */
let ID_GENERATOR = 0;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class Keyword implements IKeyword {
  keyword: string;
  args: string[];
  req_scope: Set<string>;
  key_scope: Set<string>;
  //
  constructor(keyword: string) {
    if (typeof keyword !== 'string')
      throw Error('Keyword requires string, not undefined');
    else if (DBG) console.log('Keyword constructing:', keyword);
    this.keyword = keyword;
    this.args = [];
    this.req_scope = new Set();
    this.key_scope = new Set();
  }
  /** override in subclass */
  compile(args: any[]): ISMCBundle {
    throw Error(`${this.keyword}.compile() must be overridden by subclassers`);
  }
  /** override to output a serialized array representation for eventual reserialization */
  serialize(state: object): ScriptUnit {
    throw Error(`${this.keyword}.serialize() must be overridden by subclassers`);
  }
  /** override in subclass */
  render(index: number, state: object, children?: any[]): any {
    throw Error(`${this.keyword}.render() must be overridden by subclassers`);
  }
  /** cheese key id generator (deprecated) */
  generateKey() {
    return ID_GENERATOR++;
  }
} // end of Keyword

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
