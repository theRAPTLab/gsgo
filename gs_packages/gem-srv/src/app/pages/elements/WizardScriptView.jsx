/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptView - Given a script_page array of renderable state, emit
  a clickable wizard GUI.

  THIS MODULE IS A PLACEHOLDER

  COMPONENT USAGE

    <ScriptView vmPage={this.state.script_page} />
    where script_page is defined in ac-wizcore

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import {
  TokenToString,
  UnpackToken,
  DecodeTokenPrimitive
} from 'script/transpiler-v2';
import * as WIZCORE from 'modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
// Whether to render blank lines that come from a ]] block, which has
// no visual equivalent. This will cause line numbers to be discontinuous, but
// will match the script_text line numbers
// See also COUNT_ALL_LINES for related behaviors
const DRAW_CLOSING_LINES = false;

// view styling
const sScriptView = {
  display: 'inline-list-item',
  whiteSpace: 'nowrap',
  overflowY: 'scroll',
  overflowX: 'none'
};

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
/** PLACEHOLDER: A line token is a blank line, so insert a blank div */
function GLineSpace() {
  return <div className="gwiz gtoken">&nbsp;</div>;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** PLACEHOLDER: script line numbers on the left, also provide the level
 *  padding for nested lines
 */
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
/** PLACEHOLDER: Wrapper for a GToken */
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
/** PLACEHOLDER: Representation of a script unit i.e. token. */
function GToken(props) {
  const { tokenKey, token, selected, position } = props;
  const [type, value] = UnpackToken(token); // simple values or object
  let label;
  switch (type) {
    case 'identifier':
      label = value;
      break;
    case 'objref':
      label = value.join('.');
      break;
    case 'string':
      label = `"${value}"`;
      break;
    case 'value':
      label = typeof value === 'boolean' ? `<${value}>` : Number(value);
      break;
    case 'boolean':
      label = `<${value}>`;
      break;
    default:
      label = TokenToString(token);
  }
  // blank line? Just emit a line space
  if (label === '') {
    return <GLineSpace />;
  }
  let classes = selected
    ? 'gwiz gtoken styleOpen selected'
    : 'gwiz gtoken styleOpen';
  if (type === 'identifier' && position === 0) classes += ' styleKey';
  classes += ` ${type}Type`;

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
    // console.log('DRAWING LINE', lineNum, script_page[lineNum - LINE_START_NUM]);

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
      if (DRAW_CLOSING_LINES) lineBuffer.push(<GLineSpace />);
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
    <div id="wizardView" className="wizardView" style={sScriptView}>
      {pageBuffer}
    </div>
  );
}
