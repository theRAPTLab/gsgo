/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Example page with LoginBar, PageNav, and SubPage navigation

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import URPageTabPanel from '../blocks/URPageTabPanel';
import URPageTabs from '../blocks/URPageTabs';
import URLoginBar from '../blocks/URLoginBar';
import URSiteNav from '../blocks/URSiteNav';

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
      <URLoginBar />
      <URSiteNav />
      <URPageTabs store={store}>
        <URPageTabPanel index={0} label="Select 1" store={store}>
          <ExampleBoxLayout />
        </URPageTabPanel>
        <URPageTabPanel index={1} label="Select 2" store={store}>
          <ExampleBoxLayout />
        </URPageTabPanel>
        <URPageTabPanel index={2} label="Select 3" store={store}>
          Empty
        </URPageTabPanel>
      </URPageTabs>
    </Box>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
