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
import { IKeyword, TOpcode, TScriptUnit } from 'lib/t-script';
import { GetFunction } from 'modules/datacore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const styleIndex = {
  fontWeight: 'bold' as 'bold', // this dumb typescriptery css workaround
  backgroundColor: 'black',
  color: 'white',
  padding: '2px 4px',
  marginTop: '-1px',
  minWidth: '1.25em',
  float: 'left' as 'left',
  textAlign: 'right' as 'right' // this dumb typescriptery css workaround
};
const styleLine = { borderTop: '1px dotted gray' };
const styleContent = { padding: '0.5em', overflow: 'hidden' };
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
  args: any[]; // document only. can have array[][] for alt signatures
  //
  constructor(keyword: string) {
    if (typeof keyword !== 'string')
      throw Error('Keyword requires string, not undefined');
    else if (DBG) console.log('Keyword constructing:', keyword);
    this.keyword = keyword;
    this.args = [];
  }
  /** override in subclass */
  compile(unit: TScriptUnit, idx?: number): TOpcode[] {
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
        <div style={styleIndex}>{index}</div>
        <div style={styleContent}>{children}</div>
      </div>
    );
  }
  /// UTILITY METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Key id generator used by the base jsx() wrapper to create unique
   *  keys so React doesn't complain. This is probably bad and inefficient
   *  but it works for now.
   */
  generateKey() {
    return ID_GENERATOR++;
  }
  /** return the name of this keyword */
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  getName() {
    return this.keyword;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** utility to return an array with non-functions, signaling to the caller
   *  thate there was an error to process. The linenumber idx is passed in
   *  from the caller invoking compile()
   */
  errLine(err: string, idx?: number) {
    if (idx !== undefined) return [err, idx];
    return [err];
  }
} // end of Keyword Class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
