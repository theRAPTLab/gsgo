/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React from 'react';
import UR from '@gemstep/ursys/client';
import { sHead } from '../wiz/SharedElements';

/** implement the dev header at the top of DEV test files */
function DevHeader(props) {
  const { label, version } = props;
  return (
    <header style={sHead}>
      <div style={{ fontSize: '32px', float: 'left' }}>{label}</div>
      <div
        style={{
          fontSize: '14px',
          lineHeight: '16px',
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          paddingLeft: '8px'
        }}
      >
        {version}
        <br />
        {UR.ConnectionString()}
      </div>
    </header>
  );
}

export { DevHeader };
