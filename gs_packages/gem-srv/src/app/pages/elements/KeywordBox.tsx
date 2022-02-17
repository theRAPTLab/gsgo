/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  EditKeyword

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
// styles for rendering a row of wrapping buttons
// import { sButtonGrid, sButtonBreak } from './wizard-style';
// const sDel = { ...sButtonBreak, minWidth: '25%', maxWidth: '25%' };
// const sRTL = { ...sButtonGrid, direction: 'rtl' };

/// COMPONENT HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function KeywordBox(parentProps) {
  const { selection } = parentProps;
  const { scriptToken, linePos, lineNum, vmPageLine } = selection;
  const vTokens = WIZCORE.ValidateLine(vmPageLine);
  const vtok = vTokens[linePos - 1];
  const list = WIZCORE.GetTokenGUIData(vtok);

  const { lineScript } = vmPageLine;
  const text = WIZCORE.GetLineScriptText(lineScript);

  const sTopAlign = { verticalAlign: 'top' };
  const rows = [];
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
      <tr style={sTopAlign} key="status">
        <td>{text}</td>
      </tr>
    );
  const status = list.unitText ? 'PARSE OK' : 'PARSE ERROR';
  return (
    <>
      TEST KEYWORD BOX - {status}
      <form style={{ marginTop: '10px' }}>
        <table>
          <tbody>{rows}</tbody>
        </table>
      </form>
    </>
  );
}
