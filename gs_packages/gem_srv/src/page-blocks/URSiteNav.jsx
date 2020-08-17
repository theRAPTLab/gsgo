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

import CONFIG from '../pages/_navmenu.json';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const { NAVMENU } = CONFIG;
const { laptop, ipad } = CONFIG.DEVICE;

/// CUSTOM STYLES FOR COMPONENT ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const useStyles = makeStyles(theme =>
  merge.all([
    {
      title: {
        paddingLeft: `${theme.spacing(1)}px`,
        paddingRight: `${theme.spacing(3)}px`,
        transform: 'translateY(25%)'
      },
      appbar: {},
      container: {},
      tabs: {}
    }
  ])
);

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: global theme properties are passed in _app.js by <ThemeProvider>
/// See theme.js and theme-derived.js to customize theme properties
function URSiteNav(props) {
  const classes = useStyles();
  const router = useRouter();
  const { title = CONFIG.SITE.title } = props;

  // calculate page index from matching router with NAVMENU structure
  const pageIndex = NAVMENU.findIndex(page => page.href === router.pathname);
  const currentTab = pageIndex < 0 ? false : pageIndex;
  // set the current tab
  const [tabIndex, setTabIndex] = React.useState(currentTab);

  // render cosmetic tab links
  // page navigation through nextjs is handled programmatically in
  // the onChange handler
  const TabLinks = NAVMENU.map((page, index) => {
    const style = {};
    const isSelected = router.pathname === page.href;
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
      router.push(route.href);
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
            {title}
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
export default URSiteNav; // functional component
