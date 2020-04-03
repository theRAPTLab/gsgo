/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import merge from 'deepmerge';

// material ui
import Box from '@material-ui/core/Box';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';

import { makeStyles } from '@material-ui/core/styles';

import wireframeStyles from '../modules/style/wireframing';

/// CUSTOM STYLES FOR COMPONENT ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const useStyles = makeStyles(theme =>
  merge.all([
    {
      tabs: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.secondary
      }
    },
    wireframeStyles(theme)
  ])
);

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: global theme properties are passed in _app.js by <ThemeProvider>
/// See theme.js and theme-derived.js to customize theme properties
function ExView(props) {
  const classes = useStyles();
  const { children, index, view, ...other } = props;
  // const { currentTab } = store; // REDUX HERE
  const currentTab = 1;

  /// RENDER //////////////////////////////////////////////////////////////////

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={currentTab !== index} // REDUX HERE
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {view}
      {children}
    </Typography>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ExView; // functional component
