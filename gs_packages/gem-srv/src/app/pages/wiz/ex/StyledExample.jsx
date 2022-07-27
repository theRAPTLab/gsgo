/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Test rendering of background-style graphics for token display

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
// this should have been imported somewhere, probably the root component
// import '../../lib/css/gem-ui.css';

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** prototype SVG-based background styling of boxes */
export function StyledTokenTest() {
  return (
    <div className="testGraphics">
      <div className="gunit gk0" />
      <div className="gunit gk">
        <div className="glabel">keyword</div>
      </div>
      <div className="gunit gk1" />
      <div className="gunit ga0" />
      <div className="gunit ga">
        <div className="glabel">assign</div>
      </div>
      <div className="gunit ga1" />
      <br />
      <hr style={{ clear: 'left', marginTop: '40px' }} />
    </div>
  );
}
