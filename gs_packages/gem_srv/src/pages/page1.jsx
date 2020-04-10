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

import APPSTATE from '../modules/appstate';

import GSTabbedView from '../components/examples/ExTabbedView';
import GSBoxLayout from '../components/examples/ExBoxLayout';
import GSView from '../components/examples/ExView';

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Main(props) {
  const { store } = props;
  const { currentTab, currentRoute } = store.getRoute();
  console.log(`appstate tab:${currentTab} route:'${currentRoute}'`);

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <GSView index={0} name="box" store={store}>
      <GSBoxLayout label="1" />
    </GSView>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Main; // functional component
