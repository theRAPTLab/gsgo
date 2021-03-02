/*///////////////////////////////// CLASS \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  KeywordCollapsible

  Extends Keyword so that we can display minimized jsx input forms
  for setting properties in InstanceEditor.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from 'lib/class-keyword';
import { TScriptUnit } from 'lib/t-script';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const styleIndex = {
  fontWeight: 'bold' as 'bold', // this dumb typescriptery css workaround
  backgroundColor: 'rgba(0,255,255,0.1)',
  color: 'rgba(0,255,255,0.2)',
  padding: '2px 4px',
  marginTop: '-1px',
  minWidth: '1.25em',
  float: 'left' as 'left',
  textAlign: 'right' as 'right' // this dumb typescriptery css workaround
};
const styleLine = { borderTop: '1px dotted rgba(255,255,255,0.2)' };
const styleContent = { padding: '0 0.5em 0.5em 0.5em', overflow: 'hidden' };

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HACK: used to generate ever-increasing ID for rendering. They are all unique
 *  because our rendering loop just rerenders the entire list into a GUI every
 *  time. This is probably not the way to do it efficiently in React.
 */
let ID_GENERATOR = 0;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Key id generator used by the base jsx() wrapper to create unique
 *  keys so React doesn't complain. This is probably bad and inefficient
 *  but it works for now.
 */
function m_GenerateKey() {
  return ID_GENERATOR++;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class KeywordCollapsible extends Keyword {
  /** override in subclass */
  jsx(index: number, srcLine: TScriptUnit, children?: any): any {
    // note that styleIndex below has to have weird typescript
    // stuff for originally hyphenated CSS properties so it doesn't
    // get marked by the linter as invalid CSS

    // NOTE: key is generated with EVERY jsx call
    // Ben's workaround to prevent generating a new component with each data update
    // However, this breaks if new lines are added to the script.
    // const key = index;

    const key = m_GenerateKey();
    console.log('KEY is', key);

    let jsx;
    if (children && children.props && children.props.isEditable) {
      jsx = (
        <div key={key} style={styleLine}>
          <div style={styleIndex}>{index}</div>
          <div style={styleContent}>{children}</div>
        </div>
      );
    } else {
      jsx = <span key={key}>{children}</span>;
    }
    return jsx;
  }
} // end of KeywordCollapsible Class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default KeywordCollapsible; // default export: import KeywordCollapsible
