/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WizardTestLine

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from '../../../modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TestLine', 'TagPurple');
const LOG = console.log;
const TESTLINE = 'prop agent.energyLevel setTo 0';

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns placeholder text line editor to do script processing of a line
 *  for testing purposes
 */
export function ValidateLine(/* props */) {
  /// DEFINE STATE ////////////////////////////////////////////////////////////
  const [input, setInput] = React.useState(TESTLINE);
  /// UI STATE MAINTENANCE ////////////////////////////////////////////////////
  function uiUpdateLine(e) {
    const line = e.target.value;
    setInput(line);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function processInput(e) {
    const { validTokens, vmTokens, lineScript } = WIZCORE.WizardTestLine(input);
    console.group(...PR('validation result'));
    LOG(`%c${input}`, 'font-weight:600;font-size:larger');
    validTokens.forEach(t => LOG(t));
    console.groupEnd();
  }
  /// RENDER //////////////////////////////////////////////////////////////////
  const iStyle = { backgroundColor: 'white', margin: 0 };
  const bStyle = { margin: 0 };
  return (
    <div
      style={{
        width: '100%',
        display: 'inline-grid',
        gridTemplateColumns: '150px 1fr 150px',
        columnGap: '10px',
        rowGap: 0,
        alignItems: 'center'
      }}
    >
      <tt style={{ color: 'gray' }}>SINGLE LINE DEBUG</tt>
      <input type="text" value={input} onChange={uiUpdateLine} style={iStyle} />
      <button type="submit" onClick={processInput} style={bStyle}>
        VALIDATE
      </button>
    </div>
  );
}
