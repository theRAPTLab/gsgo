/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Root View of GEMSTEP Wireframe

  NOTE: this page runs from the server side, so we can't access objects like
  window or document, or manipulate the DOM. To debug, use the node debugger
  through VSCode.

  PROBLEM: There's no way to trigger hook effects OUTSIDE of a component.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import {
  decrementCounter,
  incrementCounter
} from '../redux/actions/counterActions';

import GSAppBar from '../src/components/ExAppBar';
import GSLoginBar from '../src/components/ExLoginBar';
import GSBoxLayout from '../src/components/ExBoxLayout';
import GSTabbedAppBar from '../src/components/ExTabbedAppBar';
import GSTabbedView from '../src/components/ExTabbedView';
import GSView from '../src/components/ExView';

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Main(props) {
  const { store } = props;
  console.log('index got store', store);

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <>
      <GSLoginBar />
      <GSAppBar />
      <GSTabbedView store={store}>
        <GSView index={0} name="First Value" store={store}>
          <GSBoxLayout label="1" />
        </GSView>
        <GSView index={1} name="Second View" store={store}>
          <GSBoxLayout label="2" />
        </GSView>
        <GSView index={2} name="Third View" store={store}>
          Empty
        </GSView>
      </GSTabbedView>
    </>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Main; // functional component
