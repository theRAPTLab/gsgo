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

import wireframeStyles from '../../modules/style/wireframing';

/// CUSTOM STYLES FOR COMPONENT ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const useStyles = makeStyles(theme => merge.all([wireframeStyles(theme)]));

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: global theme properties are passed in _app.js by <ThemeProvider>
/// See theme.js and theme-derived.js to customize theme properties
function ExView(props) {
  //
  const classes = useStyles();
  const { children, index, view, store, ...other } = props;
  const { currentTab } = store;
  // const { currentTab } = store; // REDUX HERE
  console.log('exview got store', store || 'nothing');

  /// RENDER //////////////////////////////////////////////////////////////////

  console.log(`currentTab ${currentTab}`);

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={currentTab !== index} // REDUX HERE
      id={`gem-tabpanel-${index}`}
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
