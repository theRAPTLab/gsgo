/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Root View of GEMSTEP Wireframe

  NOTE: this page runs from the server side, so we can't access objects like
  window or document, or manipulate the DOM. To debug, use the node debugger
  through VSCode.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';

import GSAppBar from '../src/components/GSAppBar';
import GSLoginBar from '../src/components/GSLoginBar';
import GSBoxLayout from '../src/components/GSBoxLayout';
import GSTabbedAppBar from '../src/components/GSTabbedAppBar';

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Main() {
  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <>
      <GSLoginBar />
      <GSTabbedAppBar />
    </>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Main; // functional component
