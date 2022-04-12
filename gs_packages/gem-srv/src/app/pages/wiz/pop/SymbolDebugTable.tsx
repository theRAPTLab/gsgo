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
function SymbolDebugTable(svm_data) {
  const rows = [];

  const gArray = WIZCORE.UnpackViewData(svm_data);
  // gArray contains [ unitText, [ symbolType, { items | arg | ], ... ]
  const [ut, ...lists] = gArray;
  rows.push(
    <tr style={sTopAlign} key={ut}>
      <td>unitText</td>
      <td>{ut}</td>
    </tr>
  );
  lists.forEach(list => {
    let strb = [];
    const [symType, symData] = list;
    symData.forEach(item => {
      if (item === ut) strb.push(`***${item}***`);
      else strb.push(item);
    });
    // add to rows
    rows.push(
      <tr style={sTopAlign} key={symType}>
        <td>{symType}</td>
        <td>{strb.join(', ')}</td>
      </tr>
    );
  });

  // THIS VERSION walks the keys of the validation data, whereas
  // the previous version uses the UnpackViewData() utility
  //
  // GetTokenGUIData parses a validationToken and passes it to SymbolDebugTable
  // Each returned prop has form { text, items }, but the type of items
  // is an array of strings for keywords and TSymbolData for everything else
  // except for method arguments, which only returns arg: 'argName:argType'
  // Also unitText returns a string.
  // Object.keys(svm_data).forEach(name => {
  //   let strb = [];
  //   const gList = svm_data[name]; // { text, items|arg } || string unitText
  //   const { text, items, arg } = gList;

  //   if (name === 'unitText') {
  //     strb.push(unitText);
  //   } else if (items !== undefined) {
  //     items.forEach(item => {
  //       // keywords array?
  //       if (item === unitText) strb.push(`***${item}***`);
  //       else strb.push(item);
  //     });
  //   } else if (arg) {
  //     strb.push(`${arg.name}:${arg.type}`);
  //   } else strb.push(text || 'unexpected gdata decode error');
  //   rows.push(
  //     <tr style={sTopAlign} key={name}>
  //       <td>{name}</td>
  //       <td>{strb.join(', ')}</td>
  //     </tr>
  //   );
  // });

  return (
    <table style={{ marginBottom: 0 }}>
      <tbody>{rows}</tbody>
    </table>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SymbolDebugTable;
