/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Draw the tabs and align them with children

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
    id: `gem-tab-${index}`,
    'aria-controls': `gem-tabpanel-${index}`
  };
}

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: global theme properties are passed in _app.js by <ThemeProvider>
/// See theme.js and theme-derived.js to customize theme properties
function GSTabbedView(props) {
  const classes = useStyles();
  const [tabIndex, setTabIndex] = React.useState(0);
  const { children } = props;

  /// HANDLERS ////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const handleChange = (event, tabIndex) => {
    setTabIndex(tabIndex); // REDUX HERE
  };

  /// RENDER //////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // generate tab elements
  const tabs = React.Children.toArray(children).map((element, index) => {
    return (
      <Tab
        key={index.toString()} // why? https://reactjs.org/docs/lists-and-keys.html#keys
        label={`${element.props.name}`}
        {...a11yProps(index)}
      />
    );
  });

  return (
    <div className={classes.tabs}>
      <Tabs
        value={tabIndex}
        onChange={handleChange}
        aria-label="GEMSTEP application modes"
        className={classes.tabs}
      >
        {tabs}
      </Tabs>
      {children}
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default GSTabbedView; // functional component
