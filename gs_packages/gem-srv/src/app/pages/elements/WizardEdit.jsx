/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WizardEdit is the edit box that appears when there is a valid selection
  of line and position in WIZCORE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from '../../../modules/appcore/ac-wizcore';

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return component if valid line, null otherwise. used by DevWizard */
export function WizardEdit(/* props */) {
  const selection = WIZCORE.SelectedToken();
  if (selection) {
    const { token: tok, lineNum, linePos, tokenList } = selection;
    return (
      <div className="wizardEdit">
        <div style={{ backgroundColor: 'pink', padding: '10px' }}>
          SELECTION EDIT {lineNum} {linePos} {JSON.stringify(tok)}
          <br />
        </div>
      </div>
    );
  }
  return null;
}
