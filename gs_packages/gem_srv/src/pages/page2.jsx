/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Example page with no navigation elements

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
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
      <FlexBoxLayout store={store} />
    </Box>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
