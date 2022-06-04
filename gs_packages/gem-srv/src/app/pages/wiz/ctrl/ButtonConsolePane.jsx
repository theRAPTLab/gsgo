/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ButtonConsole - a floating window panel where I'm stuffing button
  controls for now

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import { sButtonConsole, buttonStyle } from '../SharedElements';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ButtonConsole');
const LOG = console.log;

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function ButtonConsole(/* props */) {
  // define state
  const [modeD, setModeD] = React.useState(0);
  const [status, setStatus] = React.useState('UI STATE');
  const { dev_or_user } = WIZCORE.State();
  const modeLabelC = dev_or_user ? 'ScriptText' : 'ScriptView';
  const modeLabelD = modeD ? 'Mode D1' : 'Mode D0';

  // define local event handlers
  const toggleC = () => {
    WIZCORE.SendState({ dev_or_user: 1 - dev_or_user });
  };
  const toggleD = () => {
    setModeD(1 - modeD);
  };
  // derive styles
  const sModeButtonC = {
    ...buttonStyle,
    minWidth: '120px',
    backgroundColor: dev_or_user ? 'red' : ''
  };
  const sModeButtonD = {
    ...buttonStyle,
    minWidth: '100px',
    backgroundColor: modeD ? 'red' : ''
  };
  // render
  return (
    <div id="ButtonConsole" style={sButtonConsole}>
      <div
        style={{ display: 'inline-grid', height: '50px', alignItems: 'center' }}
      >
        <tt style={{ whiteSpace: 'nowrap' }}>{status}</tt>
      </div>
      <button type="button" style={sModeButtonC} onClick={() => toggleC()}>
        {modeLabelC}
      </button>
      {/* <button type="button" style={sModeButtonD} onClick={() => toggleD()}>
        {modeLabelD}
      </button>
      <button type="button" style={buttonStyle}>
        Fire A
      </button>
      <button type="button" style={buttonStyle}>
        Step -
      </button>
      <button type="button" style={buttonStyle}>
        Step +
      </button>
      <button type="button" style={buttonStyle}>
        Submit
      </button> */}
    </div>
  );
}
