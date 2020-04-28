/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Example page with no navigation elements

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
///
import URSiteNav from '../blocks/URSiteNav';
import URLoginBar from '../blocks/URLoginBar';
import URTabbedView from '../blocks/URTabbedView';
import FlexBoxLayout from '../components/examples/FlexBoxLayout';

/// LOCAL STYLES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => ({
  pagemode: theme.urScreenPage,
  viewmode: theme.urScreenView
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
      <URTabbedView>
        <FlexBoxLayout label="self-terminated" store={store} />
        <div label="child">EMPTY TabView 2</div>
        <div label="full-height child" className={classes.viewmode}>
          <p>This is an example of a bunch of components stacked together.</p>
          <FlexBoxLayout store={store} />
        </div>
      </URTabbedView>
    </Box>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
