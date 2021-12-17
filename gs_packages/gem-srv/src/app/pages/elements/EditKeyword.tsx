/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  EditKeyword

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from '../../../modules/appcore/ac-wizcore';

/// COMPONENT HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function Keyword(props) {
  const { selection } = props;
  const { token: tok, lineNum, linePos, tokenList } = selection;
  const { lineStatement } = tokenList;
  const text = WIZCORE.GetLineScriptText(lineStatement);
  return (
    <form>
      <label>
        editing: <code>{text}</code> <br />
        <span style={{ fontSize: '1.5rem' }}>
          <strong>{tok.identifier}</strong> select new keyword?
        </span>
      </label>
      <select id="select" defaultValue={0} name="select" required>
        <option>Select…</option>
        <option>prop</option>
        <option>call</option>
        <option>if</option> <option>when</option> <option>onEvent</option>
      </select>
    </form>
  );
}
