/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptView - Given a script_page array of renderable state, emit
  a clickable wizard GUI.

  COMPONENT USAGE

    <ScriptView vmPage={this.state.script_page} />
    where script_page is defined in ac-wizcore

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import {
  TokenToString,
  DecodeTokenPrimitive
} from '../../../modules/sim/script/transpiler-v2';
import * as WIZCORE from '../../../modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
// whether to render blank lines that come from a ]] block, which has
// no visual equivalent. This will cause line numbers to be discontinuous, but
// will match the script_text line numbers
const RENDER_BLOCK_CLOSE = false; // also see script-utilities COUNT_ALL_LINES

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

/// META ELEMENTS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GLineSpace() {
  return <div className="gwiz gtoken">&nbsp;</div>;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GLineNum(props) {
  const { lineNum, level } = props;
  const indent = level * 2;
  return (
    <div className="gwiz gtoken first" style={{ marginRight: `${indent}rem` }}>
      {lineNum}
    </div>
  );
}

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** wrapper for a GToken */
function GLine(props) {
  const { lineNum, level, children, selected } = props;
  const classes = selected ? 'gwiz gline selected' : 'gwiz gline';

  return (
    <>
      <div className={classes}>
        <GLineNum lineNum={lineNum} level={level} />
        {children}
      </div>
    </>
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** representation of a script unit i.e. token */
function GToken(props) {
  const { tokenKey, token, selected, position } = props;
  const dtok = DecodeTokenPrimitive(token); // simple values or object
  let label;

  if (typeof dtok !== 'object') label = dtok.toString();
  else if (Array.isArray(dtok)) label = dtok.join('.');
  else label = TokenToString(dtok);
  // blank line? Just emit a line space
  if (label === '') {
    return <GLineSpace />;
  }
  let classes = selected
    ? 'gwiz gtoken styleOpen selected'
    : 'gwiz gtoken styleOpen';
  if (token.identifier && position === 0) classes += ' styleKey';

  // if not, emit the token element
  return (
    <div className={classes} data-key={tokenKey}>
      {label}
    </div>
  );
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
export function ScriptView(props) {
  DBGTEXT = '';
  const { script_page } = props;
  const pageBuffer = [];
  const selTokId = WIZCORE.SelectedTokenId();
  const selLineNum = WIZCORE.SelectedLineNum();
  script_page.forEach(line => {
    const { lineNum, level, vmTokens } = line;
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
      if (RENDER_BLOCK_CLOSE) lineBuffer.push(<GLineSpace />);
    }
    //
    const num = String(lineNum).padStart(3, '0');
    //
    if (hasTokens || RENDER_BLOCK_CLOSE) {
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
    <div
      className="wizardView"
      style={{
        display: 'inline-list-item',
        whiteSpace: 'nowrap',
        overflowY: 'scroll',
        overflowX: 'none'
      }}
    >
      {pageBuffer}
    </div>
  );
}
