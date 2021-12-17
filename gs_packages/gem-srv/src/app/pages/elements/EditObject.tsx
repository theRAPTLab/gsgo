/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  EditObject

  The expected selector is an SMObject that has props and methods.
  The SMObject can have 1 to 4 parts as an object ref!
  The fields for each part can pull from any place

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from '../../../modules/appcore/ac-wizcore';

/// COMPONENT HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function EditObject(props) {
  const { selection } = props;
  const { token: tok, lineNum, linePos, vmTokens } = selection;
  const { lineStatement } = vmTokens;
  const text = WIZCORE.GetLineScriptText(lineStatement);
  return (
    <form>
      <label>
        editing: <code>{text}</code> <br />
        <span style={{ fontSize: '1.5rem' }}>
          <strong>{tok.identifier}</strong> select object?
        </span>
      </label>
      <select defaultValue={0} name="select" required>
        <option>agentPropList</option>
        <option>FeatureList</option>
      </select>
      <select defaultValue={0} name="select" required>
        <option>agentPropList</option>
        <option>FeatureList</option>
      </select>
    </form>
  );
}
