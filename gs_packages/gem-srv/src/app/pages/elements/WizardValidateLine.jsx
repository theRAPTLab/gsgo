/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WizardValidateLineBox

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TestLine', 'TagPurple');
const LOG = console.log;
const TESTLINE = 'prop energyLevel setTo 0';

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns placeholder text line editor to do script processing of a line
 *  for testing purposes
 */
export function ValidateLineBox(/* props */) {
  /// DEFINE STATE ////////////////////////////////////////////////////////////
  const [input, setInput] = React.useState(TESTLINE);
  const [status, setStatus] = React.useState();

  /// UI STATE MAINTENANCE ////////////////////////////////////////////////////
  function uiUpdateLine(e) {
    const line = e.target.value;
    setInput(line);
  }
  /// COMPONENT EVENT HANDLERS ////////////////////////////////////////////////
  const processInput = e => {
    e.preventDefault();
    console.group(...PR('validating...'));
    LOG(`%c${input}`, 'font-size:1.1rem');
    const { validTokens } = WIZCORE.WizardTestLine(input);
    let errorIndex = validTokens.findIndex(vt => vt.error !== undefined);
    if (errorIndex < 0) setStatus('');
    else {
      const { code, info } = validTokens[errorIndex].error;
      setStatus(`${code} error in tok ${errorIndex} - ${info}`);
    }
    console.groupEnd();
  };
  const handleKeypress = e => {
    if (e.key === 'Enter') {
      processInput(e);
      e.target.select();
    }
  };

  /// RENDER COMPONENTS ///////////////////////////////////////////////////////
  const iStyle = { backgroundColor: 'white', margin: 0 };
  const bStyle = { margin: 0 };
  return (
    <>
      <div
        style={{
          width: '100%',
          display: 'inline-grid',
          gridTemplateColumns: '150px 1fr 175px',
          columnGap: '10px',
          rowGap: 0,
          alignItems: 'center'
        }}
      >
        <tt style={{ color: 'gray' }}>SINGLE LINE DEBUG</tt>
        <input
          type="text"
          value={input}
          onChange={uiUpdateLine}
          onKeyPress={handleKeypress}
          style={iStyle}
        />
        <button type="submit" onClick={processInput} style={bStyle}>
          CHECK CONSOLE
        </button>
      </div>
      <div style={{ marginLeft: '160px', color: 'red' }}>{status}</div>
    </>
  );
}
