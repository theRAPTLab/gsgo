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
/** Returns a token editing box based on the currently selected token
 *  as defined in WIZCORE. The EditBox appears when a token is clicked, and
 *  is used by DevWizard.
 */
export function EditBox(/* props */) {
  let content = null;

  // SETUP ////////////////////////////////////////////////////////////////////
  const sel = WIZCORE.SelectedTokenInfo();
  if (sel) {
    const { scriptToken: tok, lineNum, linePos, vmTokens } = sel;
    // (1) is this a keyword?
    if (linePos === 1 && tok.identifier !== undefined)
      content = <Keyword selection={sel} />;
    else {
      // (2) it is a token, so figure out arguments

      content = <Placeholder selection={sel} />;
    }
  }

  // RENDER ///////////////////////////////////////////////////////////////////
  if (!content) return null;
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
