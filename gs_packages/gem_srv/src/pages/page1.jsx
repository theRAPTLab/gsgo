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
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import BlockTabView from '../blocks/BlockTabView';
import BlockTabs from '../blocks/BlockTabs';
import BlockLoginBar from '../blocks/BlockLoginBar';
import BlockPageNav from '../blocks/BlockPageNav';

import ExampleBoxLayout from '../components/examples/ExBoxLayout';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

const useStyles = makeStyles(theme => ({
  vstack: {
    backgroundColor: '#e0e0e0',
    display: 'flex',
    flexFlow: 'column nowrap',
    height: '100vh'
  },
  vfixed: {
    backgroundColor: '#ffe0e0',
    minHeight: '100px'
  },
  hstack: {
    backgroundColor: '#e0e0ff',
    display: 'flex',
    flexFlow: 'row nowrap',
    flexGrow: 1
  },
  hfixed: {
    backgroundColor: '#d0d0ff',
    width: '200px'
  },
  hstretch: {
    backgroundColor: 'white',
    flexGrow: 1
  }
}));
/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Page(props) {
  const { store } = props;
  const { currentTab, currentRoute } = store.getRoute();
  const classes = useStyles();
  if (DBG) console.log(`appstate tab:${currentTab} route:'${currentRoute}'`);

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <Box className={classes.vstack}>
      <BlockLoginBar />
      <BlockPageNav />
      <BlockTabs store={store} className={classes.vfixed}>
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
    </Box>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
