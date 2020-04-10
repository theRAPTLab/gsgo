/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Draw the tabs and align them with children

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import merge from 'deepmerge';
// material ui
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
// styling
import { makeStyles } from '@material-ui/core/styles';
import wireframeStyles from '../modules/style/wireframing';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

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
    id: `gem-subtab-${index}`,
    'aria-controls': `gem-subtabpanel-${index}`
  };
}

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: global theme properties are passed in _app.js by <ThemeProvider>
/// See theme.js and theme-derived.js to customize theme properties
function SubNavigation(props) {
  const classes = useStyles();
  const [subTabIndex, setSubTabIndex] = React.useState(0);
  const { children } = props;

  /// HANDLERS ////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const handleChange = (event, tabIndex) => {
    setSubTabIndex(tabIndex);
  };

  /// RENDER //////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// generate tab elements from children
  const tabs = React.Children.map(children, (child, index) => {
    const key = `sub-${index}`;
    return (
      <Tab
        key={key} // why? https://reactjs.org/docs/lists-and-keys.html#keys
        label={`${child.props.name}`}
        {...a11yProps(index)}
      />
    );
  });
  const proppedChildren = React.Children.map(children, child => {
    return React.cloneElement(child, { currentTab: subTabIndex });
  });

  return (
    <div className={classes.tabs}>
      <Tabs
        value={subTabIndex}
        onChange={handleChange}
        aria-label="GEMSTEP application modes"
        className={classes.tabs}
      >
        {tabs}
      </Tabs>
      {proppedChildren}
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SubNavigation; // functional component
