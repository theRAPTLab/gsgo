/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import merge from 'deepmerge';

// material ui
import Typography from '@material-ui/core/Typography';
// styling
import { makeStyles } from '@material-ui/core/styles';
import wireframeStyles from '../modules/style/wireframing';

/// CUSTOM STYLES FOR COMPONENT ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme =>
  merge.all([
    {
      root: {}
    },
    wireframeStyles(theme)
  ])
);

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: global theme properties are passed in _app.js by <ThemeProvider>
/// See theme.js and theme-derived.js to customize theme properties
function SubView(props) {
  //
  const classes = useStyles();
  const { children, index, currentTab } = props;

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <Typography
      component="div"
      role="tabpanel"
      id={`gem-subtab-${index}`}
      aria-labelledby={`gem-subtab-${index}`}
      className={classes.root}
      hidden={currentTab !== index}
    >
      {children}
    </Typography>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SubView; // functional component
