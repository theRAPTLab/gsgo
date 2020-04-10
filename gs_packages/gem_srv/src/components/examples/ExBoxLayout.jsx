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
import wireframeStyles from '../../modules/style/wireframing';

/// LOCAL STYLES FOR COMPONENT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme =>
  merge.all([
    {
      header: {
        color: 'red',
        height: '100px'
      },
      caption: {
        padding: theme.spacing(1)
      }
    },
    wireframeStyles(theme)
  ])
);

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ExBoxLayout() {
  /// compute class names from generated 'classes' css rules dictionary
  const classes = useStyles();
  const headerClasses = clsx(classes.wbArea, classes.header);

  /// RENDER //////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// NOTE: this example shows uses of local styles and Box props for sizing
  return (
    <>
      <Box p={1} className={headerClasses}>
        HEADER
      </Box>
      <Box display="flex" alignItems="stretch">
        <Box
          p={1}
          flexGrow={0}
          flexShrink={0}
          flexBasis={100}
          className={classes.wbControl}
        >
          LEFT
        </Box>
        <Box flexGrow={1} p={1} className={classes.wbViewport}>
          CENTER
        </Box>
        <Box
          p={1}
          flexGrow={0}
          flexShrink={0}
          flexBasis={100}
          className={classes.wbControl}
        >
          RIGHT
        </Box>
      </Box>
      <Typography variant="caption" className={classes.caption}>
        components/examples/ExBoxLayout
      </Typography>
    </>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ExBoxLayout; // functional component
