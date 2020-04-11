/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
///
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
///
import BlockLoginBar from '../blocks/BlockLoginBar';
import BlockPageNav from '../blocks/BlockPageNav';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// CUSTOM STYLES /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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

      <Box className={classes.vfixed}>HEADER</Box>
      <Box className={classes.hstack}>
        <Box className={classes.hfixed}>LEFT</Box>
        <Box className={classes.hstretch}>MAIN</Box>
        <Box className={classes.hfixed}>RIGHT</Box>
      </Box>
      <Box className={classes.vfixed}>FOOTER</Box>
    </Box>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
