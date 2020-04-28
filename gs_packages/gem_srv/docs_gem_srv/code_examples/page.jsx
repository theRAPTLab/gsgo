/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Example page with Page Navigation
  Copy this to the src/pages directory

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';

import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import URSiteNav from '../blocks/URSiteNav';

/// LOCAL STYLES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => ({
  pagemode: theme.urScreenPage, // required for full-page screen apps
  example: {
    padding: `${theme.spacing(1)}px`
  }
}));

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Page() {
  const classes = useStyles(); //

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <Box className={classes.pagemode}>
      <URSiteNav />
      <div className={classes.example}>
        <p>Put whatever you want here</p>
      </div>
    </Box>
  );
}
/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
