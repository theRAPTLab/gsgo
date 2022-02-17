/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SymbolDebugTable

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from 'modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const sTopAlign = { verticalAlign: 'top' };

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** WORK IN PROGRESS
 *  do not use this directly as a model for implementing your own components
 *  or you will deeply regret it in the future :-)
 */
function SymbolDebugTable(gData) {
  const rows = [];
  const unitText = gData.unitText;
  // go through all the keys and make a row for each

  // GetTokenGUIData parses a validationToken and passes it to SymbolDebugTable
  // Each returned prop has form { text, items }, but the type of items
  // is an array of strings for keywords and TSymbolData for everything else
  // except for method arguments, which only returns arg: 'argName:argType'
  // Also unitText returns a string.
  Object.keys(gData).forEach(name => {
    let str = '';
    const gList = gData[name]; // { text, items|arg } || string unitText
    const { text, items, arg } = gList;
    if (name === 'unitText') {
      str = unitText;
    } else if (items !== undefined) {
      // keywords array?
      if (Array.isArray(items))
        items.forEach(item => {
          if (item === unitText) str += `***${item}***, `;
          else str += `${item}, `;
        });
      // TSymbolData object?
      else if (typeof items === 'object')
        Object.keys(items).forEach(item => {
          if (item === unitText) str += `***${item}***, `;
          else str += `${item}, `;
        });
    } else if (arg) {
      str = arg;
    } else str = text || 'unexpected gdata decode error';
    rows.push(
      <tr style={sTopAlign} key={name}>
        <td>{name}</td>
        <td>{str}</td>
      </tr>
    );
  });

  return (
    <table style={{ marginBottom: 0 }}>
      <tbody>{rows}</tbody>
    </table>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SymbolDebugTable;
