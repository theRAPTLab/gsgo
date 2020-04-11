/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Example page with LoginBar, PageNav, and SubPage navigation

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
///
import URSiteNav from '../blocks/URSiteNav';
import URLoginBar from '../blocks/URLoginBar';
import URPageTabs from '../blocks/URPageTabs';
import URPageTabPanel from '../blocks/URPageTabPanel';
///
import FlexBoxLayout from '../components/examples/FlexBoxLayout';

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
          <FlexBoxLayout store={store} />
        </URPageTabPanel>
        <URPageTabPanel index={1} label="Select 2" store={store}>
          EMPTY URPageTabPanel 2
        </URPageTabPanel>
        <URPageTabPanel index={2} label="Select 3" store={store}>
          EMPTY URPageTabPanel 3
        </URPageTabPanel>
      </URPageTabs>
    </Box>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
