/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Example page with LoginBar, PageNav, and SubPage navigation

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

/// LOCAL STYLES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => ({
  pagemode: theme.urFullScreenApp
}));

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Page(props) {
  const { store } = props;
  const classes = useStyles();

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <Box className={classes.pagemode}>
      <BlockLoginBar />
      <BlockPageNav />
      <BlockTabs store={store}>
        <BlockTabView index={0} label="Select 1" store={store}>
          <ExampleBoxLayout />
        </BlockTabView>
        <BlockTabView index={1} label="Select 2" store={store}>
          <ExampleBoxLayout />
        </BlockTabView>
        <BlockTabView index={2} label="Select 3" store={store}>
          Empty
        </BlockTabView>
      </BlockTabs>
    </Box>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
