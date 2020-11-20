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
import { IKeyword, ISMCBundle, TScriptUnit } from 'lib/t-script';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const styleIndex = {
  fontWeight: 'bold' as 'bold', // this dumb typescriptery css workaround
  backgroundColor: 'black',
  color: 'white',
  padding: '2px 4px',
  display: 'inline-block',
  minWidth: '1.25em',
  textAlign: 'right' as 'right' // this dumb typescriptery css workaround
};
const styleLine = { padding: '0.5em', borderBottom: '1px dotted gray' };
const styleContent = { padding: '0.5em' };
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
  //
  constructor(keyword: string) {
    if (typeof keyword !== 'string')
      throw Error('Keyword requires string, not undefined');
    else if (DBG) console.log('Keyword constructing:', keyword);
    this.keyword = keyword;
    this.args = [];
  }
  /** override in subclass */
  compile(args: any[]): ISMCBundle {
    throw Error(`${this.keyword}.compile() must be overridden by subclassers`);
  }
  /** override to output a serialized array representation for eventual reserialization */
  serialize(state: object): TScriptUnit {
    throw Error(`${this.keyword}.serialize() must be overridden by subclassers`);
  }
  /** override in subclass */
  jsx(index: number, srcLine: TScriptUnit, children?: any): any {
    // note that styleIndex below has to have weird typescript
    // stuff for originally hyphenated CSS properties so it doesn't
    // get marked by the linter as invalid CSS
    return (
      <div key={this.generateKey()} style={styleLine}>
        <span style={styleIndex}>{index}</span>
        <span style={styleContent}>{children}</span>
      </div>
    );
  }
  /// UTILITY METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** cheese key id generator (deprecated) */
  generateKey() {
    return ID_GENERATOR++;
  }
  /** return keyword */
  getName() {
    return this.keyword;
  }
  /** get topmost value of returned value, if it's an array or
   *  a value
   */
  topValue(thing: any): any {
    if (Array.isArray(thing)) return thing.shift();
    return thing;
  }
} // end of Keyword Class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
