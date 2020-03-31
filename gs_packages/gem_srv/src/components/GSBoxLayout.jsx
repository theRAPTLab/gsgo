/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';

// material ui
import Box from '@material-ui/core/Box';
import blue from '@material-ui/core/colors/blue';
import { makeStyles } from '@material-ui/core/styles';

/// CUSTOM STYLES FOR COMPONENT ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => ({
  blueBox: {
    backgroundColor: blue[50],
    padding: theme.spacing(1)
  },
  controlBox: {
    extend: 'blueBox',
    backgroundColor: blue[100]
  },
  viewBox: {
    extend: 'blueBox',
    backgroundColor: blue[200]
  }
}));

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: global theme properties are passed in _app.js by <ThemeProvider>
/// See theme.js and theme-derived.js to customize theme properties
function GSBoxLayout() {
  const classes = useStyles();

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <>
      <Box height={100} width="100%" className={classes.blueBox}>
        Top
      </Box>
      <Box display="flex" alignItems="stretch" height="100%">
        <Box
          p={1}
          flexGrow={0}
          flexShrink={0}
          flexBasis={100}
          className={classes.controlBox}
        >
          Item 1
        </Box>
        <Box flexGrow={1} p={1} className={classes.viewBox}>
          Item 2
        </Box>
        <Box
          p={1}
          flexGrow={0}
          flexShrink={0}
          flexBasis={100}
          className={classes.controlBox}
        >
          Item 3
        </Box>
      </Box>
    </>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default GSBoxLayout; // functional component
