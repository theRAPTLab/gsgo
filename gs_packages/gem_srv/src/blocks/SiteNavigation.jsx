/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tabbed Navigation Appbar

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import merge from 'deepmerge';

// material ui
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { useRouter } from 'next/router';

import { makeStyles } from '@material-ui/core/styles';

import APPSTATE from '../modules/appstate';
import wireframeStyles from '../modules/style/wireframing';

import CONFIG from '../site-config';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const { NAVMENU } = CONFIG;

/// CUSTOM STYLES FOR COMPONENT ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const useStyles = makeStyles(theme =>
  merge.all([
    {
      title: {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(3),
        transform: 'translateY(25%)'
      },
      appbar: {},
      container: {},
      tabs: {}
    },
    wireframeStyles(theme)
  ])
);

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: global theme properties are passed in _app.js by <ThemeProvider>
/// See theme.js and theme-derived.js to customize theme properties
function SiteNavigation() {
  const classes = useStyles();
  const router = useRouter();

  // calculate page index from matching router with NAVMENU structure
  const pageIndex = NAVMENU.findIndex(page => page.href === router.pathname);
  const currentTab = pageIndex < 0 ? 0 : pageIndex;
  // set the current tab
  const [tabIndex, setTabIndex] = React.useState(currentTab);

  // render cosmetic tab links
  // page navigation through nextjs is handled programmatically in
  // the onChange handler
  const TabLinks = NAVMENU.map((page, index) => {
    const style = {};
    const isSelected = router.pathname === page.href;
    if (isSelected) APPSTATE.setRoute(index, page.href);

    style.opacity = isSelected ? { opacity: 1 } : { opacity: 0.7 };
    const key = `site-nav-${index}`;
    return (
      <Tab
        label={page.label}
        key={key}
        component="a"
        style={{ minWidth: '100px' }}
        onClick={event => {
          event.preventDefault();
        }}
      />
    );
  });

  // MUI <Tabs> component uses this state to determine what is highlighted
  // but we programmatically for page route through next/router
  const handleChange = (event, newIndex) => {
    setTabIndex(newIndex);
    const route = NAVMENU[newIndex];
    if (route) {
      if (DBG) console.log('change index', route.href);
      router.replace(route.href);
      APPSTATE.setRoute(newIndex, route.href);
    }
  };

  /// RENDER //////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  return (
    <AppBar position="static" className={classes.appbar}>
      <Grid container justify="space-between" className={classes.container}>
        <Grid item>
          <Typography variant="h6" className={classes.title}>
            GEM-STEP
          </Typography>
        </Grid>
        <Grid item>
          <Tabs
            className={classes.tabs}
            value={tabIndex}
            onChange={handleChange}
            aria-label="Page Navigation"
          >
            {TabLinks}
          </Tabs>
        </Grid>
      </Grid>
    </AppBar>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SiteNavigation; // functional component
