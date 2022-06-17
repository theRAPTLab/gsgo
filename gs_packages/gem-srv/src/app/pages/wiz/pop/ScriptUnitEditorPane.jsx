/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptUnitEditor is the edit box that appears when there is a valid selection
  of line and position in WIZCORE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import { KeywordBox } from './KeywordBox';
import { PlaceholderBox } from './PlaceholderBox';
import { sScriptUnitEditor } from '../SharedElements';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns a token editing box based on the currently selected token
 *  as defined in WIZCORE. The ScriptUnitEditor appears when a token is clicked, and
 *  is used by DevWizard. */
export function ScriptUnitEditor(/* props */) {
  let content = null;
  const sel = WIZCORE.SelectedTokenInfo();
  // render a special keyword editor or token editor?
  if (sel) {
    const { scriptToken, selected_linenum, selected_linepos, vmPageLine } = sel;
    // (1) is this a keyword?
    if (selected_linepos === 1 && scriptToken.identifier !== undefined) {
      content = <KeywordBox selection={sel} />;
    } else {
      // (2) it is a token, so figure out arguments
      content = <PlaceholderBox selection={sel} />;
    }
    React.useEffect(() => {
      WIZCORE.ScrollLineIntoView();
    });
  }

  // RENDER ///////////////////////////////////////////////////////////////////
  if (!content) return null;
  return (
    <div
      className="ScriptUnitEditor"
      onClick={event => WIZCORE.DispatchEditorClick(event)}
      style={sScriptUnitEditor}
    >
      {content}
    </div>
  );
}
