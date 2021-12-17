/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WizardEdit is the edit box that appears when there is a valid selection
  of line and position in WIZCORE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from '../../../modules/appcore/ac-wizcore';
import { Keyword } from './EditKeyword';
import { Placeholder } from './EditPlaceholder';

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return component if valid line, null otherwise. used by DevWizard */
export function EditBox(/* props */) {
  let content = null;
  const sel = WIZCORE.SelectedToken();
  if (sel) {
    const { token: tok, lineNum, linePos, tokenList } = sel;
    if (linePos === 1 && tok.identifier !== undefined)
      content = <Keyword selection={sel} />;
    else content = <Placeholder selection={sel} />;
  }
  if (!content) return content;
  return (
    <div
      className="WizardEdit"
      onClick={event => WIZCORE.DispatchEditorClick(event)}
      style={{ backgroundColor: 'rgba(255, 166, 0, 0.10)', padding: '10px' }}
    >
      {content}
    </div>
  );
}
