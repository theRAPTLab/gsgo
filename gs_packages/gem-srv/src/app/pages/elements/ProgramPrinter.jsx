/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptUnit to JSX Renderer - Given a source tokenList for a program, return
  an array of array of JSX elements

  COMPONENT USAGE

    <PrintProgram program={scriptUnits} />

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import {
  TokenToString,
  DecodeTokenPrimitive
} from '../../../modules/sim/script/transpiler-v2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let CHEESE_KEY = 0;
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function u_Key(prefix = '') {
  const key = `${prefix}${CHEESE_KEY}`;
  CHEESE_KEY++;
  return key;
}

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
function GLineNum(props) {
  const { lineNum } = props;
  return <div className="gwiz gtoken first">{lineNum}</div>;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GToken(props) {
  const { token, dispatcher, data } = props;

  if (token === undefined) {
    return <div className="gwiz gtoken blank">&nbsp;</div>;
  }
  const dtok = DecodeTokenPrimitive(token);
  let label;

  if (typeof dtok !== 'object') label = dtok;
  else label = TokenToString(dtok);

  return (
    <div
      className="gwiz gtoken styleOpen"
      onClick={dispatcher}
      data={data}
      key={u_Key('tok')}
    >
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
    // iterate over tokenList
    if (tokenList.length === 0) {
      lineBuffer.push(<GToken />);
      DBGTEXT += '[NO LIST]';
    } else {
      tokenList.forEach(tokInfo => {
        const { lineNum: num, token, linePos: pos } = tokInfo;
        let label;
        const dtok = DecodeTokenPrimitive(token);
        if (typeof dtok !== 'object') label = dtok;
        else label = TokenToString(token);
        const data = `${num}:${pos}`;
        lineBuffer.push(<GToken label={label} data={data} token={token} />);
        DBGTEXT += `{${data}} `;
      });
    }
    //
    const num = String(lineNum).padStart(3, '0');
    //
    pageBuffer.push(
      <GLine lineNum={num} level={level}>
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
