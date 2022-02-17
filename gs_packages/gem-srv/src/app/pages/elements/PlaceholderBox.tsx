/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Edit Unknown

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys';
import React from 'react';
import * as WIZCORE from 'modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('EditBox', 'TagRed');

/// COMPONENT HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** the subcomponent receives props instead of directly accessing WizCore
 *  so it will rerender based on what it receives, rather than what it
 *  retrieves
 */
export function PlaceholderBox(parentProps) {
  const { selection } = parentProps;
  const { scriptToken, linePos, lineNum, vmPageLine } = selection;
  const vTokens = WIZCORE.ValidateLine(vmPageLine);
  const vtok = vTokens[linePos - 1];
  const list = WIZCORE.GetTokenGUIData(vtok);
  const rows = [];

  const sTopAlign = { verticalAlign: 'top' };
  Object.keys(list).forEach(name => {
    const str = list[name];
    rows.push(
      <tr style={sTopAlign} key={name}>
        <td>{name}</td>
        <td>{str}</td>
      </tr>
    );
  });
  if (rows.length === 0)
    rows.push(
      <tr style={sTopAlign} key="meh">
        <td>Unimplemented Edit Box</td>
      </tr>
    );
  const status = list.unitText ? 'PARSE OK' : 'PARSE ERROR';
  return (
    <>
      TEST EDIT BOX - {status}
      <form style={{ marginTop: '10px' }}>
        <table>
          <tbody>{rows}</tbody>
        </table>
      </form>
    </>
  );
}
