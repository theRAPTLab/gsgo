/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Edit Unknown

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from '../../../modules/appcore/ac-wizcore';

/// COMPONENT HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function Placeholder(props) {
  const { selection } = props;

  const { scriptToken: tok, lineNum, linePos, vmTokens } = selection;
  const argtype = tok._argtype || 'argtype?';
  return (
    <form>
      <label>
        Unimplemented Edit Box
        <br />
        argType: <code>{argtype}</code>
      </label>
      <span style={{ fontFamily: 'monospace' }}>{JSON.stringify(tok)}</span>
    </form>
  );
}
