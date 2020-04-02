/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Material UI Boxes Layout

  Boxes are styled using their built in props rather than using CSS styling.
  It is an alternative to using <Container> containing <Grid> elements.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import merge from 'deepmerge';

// material ui
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import wireframeStyles from '../modules/style/wireframing';

/// CUSTOM STYLES FOR COMPONENT ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => merge.all([{}, wireframeStyles(theme)]));

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: global theme properties are passed in _app.js by <ThemeProvider>
/// See theme.js and theme-derived.js to customize theme properties
function GSBoxLayout() {
  const classes = useStyles();

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <>
      <Box height={100} p={1} width="100%" className={classes.wbArea}>
        Top
      </Box>
      <Box display="flex" alignItems="stretch" height="100%">
        <Box
          p={1}
          flexGrow={0}
          flexShrink={0}
          flexBasis={100}
          className={classes.wbControl}
        >
          Item 1
        </Box>
        <Box flexGrow={1} p={1} className={classes.wbViewport}>
          Item 2
        </Box>
        <Box
          p={1}
          flexGrow={0}
          flexShrink={0}
          flexBasis={100}
          className={classes.wbControl}
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
