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
const TESTLINE = 'prop agent.energyLevel setMin 0';

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns placeholder text line editor to do script processing of a line
 *  for testing purposes
 */
export function TextLineTester(/* props */) {
  /// DEFINE STATE ////////////////////////////////////////////////////////////
  const [input, setInput] = React.useState(TESTLINE);
  /// UI STATE MAINTENANCE ////////////////////////////////////////////////////
  function uiUpdateLine(e) {
    const line = e.target.value;
    setInput(line);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function processInput(e) {
    const fn = 'processInput:';
    const { validTokens, vmTokens, lineScript } = WIZCORE.WizardTestLine(input);
    LOG(...PR(`${fn}`, validTokens));
  }
  /// RENDER //////////////////////////////////////////////////////////////////
  const iStyle = { backgroundColor: 'white' };
  const bStyle = { width: '10%' };
  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <input type="text" value={input} onChange={uiUpdateLine} style={iStyle} />
      <button type="submit" onClick={processInput} style={bStyle}>
        TEST
      </button>
    </div>
  );
}
