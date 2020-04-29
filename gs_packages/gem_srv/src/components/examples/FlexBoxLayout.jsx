/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Example MUI Box-based Layout

  Boxes are styled using their built in props rather than using CSS styling.
  It is an alternative to using <Container> containing <Grid> elements.

  For styling, you have a choice between using local styles OR using built-in
  Box properties. Be sure to read up on CSS FlexBox to understand how this
  layout is constructed

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import merge from 'deepmerge';
import clsx from 'clsx';

// material ui
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

/// LOCAL STYLES FOR COMPONENT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme =>
  merge.all([
    {
      header: {
        color: 'red'
      },
      flexRow: {
        display: 'flex',
        flexFlow: 'row nowrap',
        flexGrow: 1
      },
      left: {
        minWidth: '100px'
      },
      right: {
        minWidth: '100px'
      },
      caption: {
        padding: theme.spacing(1)
      }
    }
  ])
);

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function FlexBoxLayout() {
  /// compute class names from generated 'classes' css rules dictionary
  const classes = useStyles();

  /// RENDER //////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// return a stack compatible with flex-flow:'column nowrap'
  return (
    <>
      <Box p={1} className={clsx(classes.wbArea, classes.header)}>
        HEADER
      </Box>
      <Box className={classes.flexRow}>
        <Box p={1} className={clsx(classes.wbControl, classes.left)}>
          LEFT
        </Box>
        <Box flexGrow={1} p={1} className={classes.wbViewport}>
          CENTER
        </Box>
        <Box p={1} className={clsx(classes.wbControl, classes.right)}>
          RIGHT
        </Box>
      </Box>
      <Typography variant="caption" className={classes.caption}>
        components/examples/FlexBoxLayout
      </Typography>
    </>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default FlexBoxLayout; // functional component
