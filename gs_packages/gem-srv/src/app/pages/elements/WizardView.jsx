/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WizardView - Given a script_page array of renderable state, emit
  a clickable wizard GUI.

  COMPONENT USAGE

    <WizardView vmPage={this.state.script_page} />
    where script_page is defined in ac-wizcore

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import {
  TokenToString,
  DecodeTokenPrimitive
} from '../../../modules/sim/script/transpiler-v2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

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
  const { lineNum } = props;
  const numLabel = `R${lineNum}`;
  return <div className="gwiz gtoken first">{numLabel}</div>;
}

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** wrapper for a GToken */
function GLine(props) {
  const { lineNum, level, children } = props;
  const indent = level * 2 + 4;
  return (
    <>
      <div className="gwiz gline" style={{ marginLeft: `${indent}em` }}>
        <GLineNum lineNum={lineNum} />
        {children}
      </div>
    </>
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** representation of a script unit i.e. token */
function GToken(props) {
  const { tokenId, token } = props;

  const dtok = DecodeTokenPrimitive(token);
  let label;

  if (typeof dtok !== 'object') label = dtok;
  else label = TokenToString(dtok);
  // blank line? Just emit a line space
  if (label === '') {
    return <GLineSpace />;
  }
  // if not, emit the token element
  return (
    <div className="gwiz gtoken styleOpen" data-tokenid={tokenId}>
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
export function WizardView(props) {
  DBGTEXT = '';
  const { vmPage } = props;
  const pageBuffer = [];

  vmPage.forEach(line => {
    const { lineNum, level, tokenList } = line;
    const lineBuffer = [];
    // iterate over tokenList if it exists
    if (tokenList.length > 0) {
      tokenList.forEach(tokInfo => {
        const { lineNum: num, token, linePos: pos } = tokInfo;
        let label;
        const dtok = DecodeTokenPrimitive(token);
        if (typeof dtok !== 'object') label = dtok;
        else label = TokenToString(token);
        const tokId = `${num},${pos}`;
        lineBuffer.push(
          <GToken key={u_Key()} label={label} tokenId={tokId} token={token} />
        );
        DBGTEXT += `{${tokId}} `;
      });
    } else {
      lineBuffer.push(<GLineSpace />);
    }
    //
    const num = String(lineNum).padStart(3, '0');
    //
    pageBuffer.push(
      <GLine key={u_Key()} lineNum={num} level={level}>
        {lineBuffer}
      </GLine>
    );
    DBGTEXT += '\n';
  });
  if (DBG) {
    console.groupCollapsed('Wizard DBG');
    console.log(DBGTEXT);
  }
  return pageBuffer;
}
