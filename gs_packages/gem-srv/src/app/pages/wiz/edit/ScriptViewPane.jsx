/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptView - Given a script_page array of renderable state, emit
  a clickable wizard GUI.

  COMPONENT USAGE

    <ScriptView vmPage={this.state.script_page} />
    where script_page is defined in ac-wizcore

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useEffect } from 'react';
import { TokenToString, DecodeTokenPrimitive } from 'script/transpiler-v2';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import { GLine, GBlankLine, GToken, sScriptView } from '../SharedElements';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
// Whether to render blank lines that come from a ]] block, which has
// no visual equivalent. This will cause line numbers to be discontinuous, but
// will match the script_text line numbers
// See also SHOW_EMPTY_STATEMENTS for related behaviors
const DRAW_CLOSING_LINES = false;

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const KEY_BITS = -1 + 2 ** 16;
let KEY_COUNTER = 0;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Generates a sequential key index for React lists that increments and wraps
 *  back to 0 after 16 bits exceeded. The output is a 4-digit hex string.
 *  This assumes that no more than 65536 elements are rendered at a time,
 *  which is pretty safe bet :-) We have to do this because our script_page
 *  elements do not have unique ids.
 */
function u_Key(prefix = '') {
  const hex = KEY_COUNTER.toString(16).padStart(4, '0');
  if (++KEY_COUNTER > KEY_BITS) KEY_COUNTER = 0;
  return `${prefix}${hex}`;
}

/// COMPONENT EXPORTS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** React component to render a token and accept props from PrintToken()
 *  generator. We want to grab the specific token reference associated with
 *  this token so we can updated it then WIZCORE.SendState() it. But how???
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let DBGTEXT = '';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function ScriptViewPane(props) {
  // collect resources for rendering
  DBGTEXT = '';
  const { script_page } = props;
  const pageBuffer = [];
  const selTokId = WIZCORE.SelectedTokenId();
  const selLineNum = WIZCORE.SelectedLineNum();

  // a page is an array of line viewmodel data
  // the line has token viewmodel data plus line metdata
  script_page.forEach(line => {
    const { lineNum, level, vmTokens } = line;
    // console.log('DRAWING LINE', lineNum, script_page[lineNum - SCRIPT_PAGE_INDEX_OFFSET]);

    const lineBuffer = [];
    const hasTokens = vmTokens.length > 0;
    // iterate over vmTokens if it exists
    if (hasTokens) {
      vmTokens.forEach((tokInfo, idx) => {
        const { scriptToken, tokenKey } = tokInfo;
        const dtok = DecodeTokenPrimitive(scriptToken);
        const label =
          typeof dtok !== 'object' ? dtok : TokenToString(scriptToken);
        const selected = tokenKey === selTokId;
        lineBuffer.push(
          <GToken
            key={u_Key()}
            position={idx}
            selected={selected}
            label={label}
            tokenKey={tokenKey}
            token={scriptToken}
          />
        );
        DBGTEXT += `{${tokenKey}} `;
      });
    } else {
      // insert a blank line into the liner buffer
      // eslint-disable-next-line no-lonely-if
      if (DRAW_CLOSING_LINES) lineBuffer.push(<GBlankLine />);
    }
    //
    const num = String(lineNum).padStart(3, '0');
    //
    if (hasTokens || DRAW_CLOSING_LINES) {
      const selected = selLineNum === lineNum;

      pageBuffer.push(
        <GLine key={u_Key()} selected={selected} lineNum={num} level={level}>
          {lineBuffer}
        </GLine>
      );

      DBGTEXT += '\n';
    }
    //
  });
  if (DBG) {
    console.groupCollapsed('Wizard DBG');
    console.log(DBGTEXT);
  }
  return (
    <div id="ScriptWizardView" style={sScriptView}>
      {pageBuffer}
    </div>
  );
}
