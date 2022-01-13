/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Edit Unknown

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from '../../../modules/appcore/ac-wizcore';

/// COMPONENT HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function PlaceholderBox(props) {
  const { selection } = props;

  const { scriptToken: tok, lineNum, linePos, vmTokens } = selection;
  const argtype = tok._argtype || '<unknown argType>';
  console.log(JSON.stringify(tok, null, 2));
  return (
    <form>
      Unimplemented Edit Box
      <br />
      <table>
        <tbody>
          <tr>
            <td>argtype</td>
            <td>{argtype}</td>
          </tr>
          <tr>
            <td>tok</td>
            <td>{JSON.stringify(tok)}</td>
          </tr>
        </tbody>
      </table>
    </form>
  );
}
