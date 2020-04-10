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
import BlockTabs from '../blocks/BlockTabs';
import ExampleBoxLayout from '../components/examples/ExBoxLayout';
import BlockTabView from '../blocks/BlockTabView';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Page(props) {
  const { store } = props;
  const { currentTab, currentRoute } = store.getRoute();
  if (DBG) console.log(`appstate tab:${currentTab} route:'${currentRoute}'`);

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <BlockTabs store={store}>
      <BlockTabView index={0} name="Select 1" store={store}>
        <ExampleBoxLayout label="1" />
      </BlockTabView>
      <BlockTabView index={1} name="select 2" store={store}>
        <ExampleBoxLayout label="2" />
      </BlockTabView>
      <BlockTabView index={2} name="Select 3" store={store}>
        Empty
      </BlockTabView>
    </BlockTabs>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
