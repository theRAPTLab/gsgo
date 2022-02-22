/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptUnitEditor is the edit box that appears when there is a valid selection
  of line and position in WIZCORE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import { KeywordBox } from './KeywordBox';
import { PlaceholderBox } from './PlaceholderBox';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns a token editing box based on the currently selected token
 *  as defined in WIZCORE. The ScriptUnitEditor appears when a token is clicked, and
 *  is used by DevWizard.
 */
export function ScriptUnitEditor(/* props */) {
  // render a special keyword editor or token editor?
  let content = null;
  const sel = WIZCORE.SelectedTokenInfo();
  if (sel) {
    const { scriptToken, lineNum, linePos, vmPageLine } = sel;
    // (1) is this a keyword?
    if (linePos === 1 && scriptToken.identifier !== undefined) {
      content = <KeywordBox selection={sel} />;
    } else {
      // (2) it is a token, so figure out arguments
      content = <PlaceholderBox selection={sel} />;
    }
  }

  // RENDER ///////////////////////////////////////////////////////////////////
  if (!content) return null;
  return (
    <div
      className="ScriptUnitEditor"
      onClick={event => WIZCORE.DispatchEditorClick(event)}
      style={{ backgroundColor: 'rgba(255, 166, 0, 0.10)', padding: '10px' }}
    >
      {content}
    </div>
  );
}
