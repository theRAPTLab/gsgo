/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is an example of a stacked flexbox page

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
///
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
///
import URLoginBar from '../blocks/URLoginBar';
import URSiteNav from '../blocks/URSiteNav';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// CUSTOM STYLES /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => ({
  pagemode: theme.urScreenPage,
  fixedHeight: {
    backgroundColor: '#ffe0e0',
    minHeight: '100px'
  },
  flexRow: {
    backgroundColor: '#e0e0ff',
    display: 'flex',
    flexFlow: 'row nowrap',
    flexGrow: 1
  },
  fixedWidth: {
    backgroundColor: '#d0d0ff',
    width: '200px'
  },
  flexWidth: {
    backgroundColor: 'white',
    flexGrow: 1
  }
}));

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Page(props) {
  const classes = useStyles();

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <Box className={classes.pagemode}>
      <URLoginBar />
      <URSiteNav />

      <Box className={classes.fixedHeight}>HEADER</Box>
      <Box className={classes.flexRow}>
        <Box className={classes.fixedWidth}>LEFT</Box>
        <Box className={classes.flexWidth}>MAIN</Box>
        <Box className={classes.fixedWidth}>RIGHT</Box>
      </Box>
      <Box className={classes.fixedHeight}>FOOTER</Box>
    </Box>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
