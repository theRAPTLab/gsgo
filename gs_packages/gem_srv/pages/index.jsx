/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Root View of GEMSTEP Wireframe

  NOTE: this page runs from the server side, so we can't access objects like
  window or document, or manipulate the DOM. To debug, use the node debugger
  through VSCode.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';

import GSAppBar from '../src/components/ExAppBar';
import GSLoginBar from '../src/components/ExLoginBar';
import GSBoxLayout from '../src/components/ExBoxLayout';
import GSTabbedAppBar from '../src/components/ExTabbedAppBar';
import GSTabbedView from '../src/components/ExTabbedView';
import GSView from '../src/components/ExView';

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Main() {
  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <>
      <GSLoginBar />
      <GSAppBar />
      <GSTabbedView>
        <GSView index={1} name="First Value">
          <GSBoxLayout />
        </GSView>
        <GSView index={2} name="Second View">
          Empty 2
        </GSView>
        <GSView index={3} name="Third View">
          Empty
        </GSView>
      </GSTabbedView>
    </>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Main; // functional component
