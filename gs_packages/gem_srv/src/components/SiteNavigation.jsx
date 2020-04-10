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

/// PAGE NAVIGATION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ROUTES = [
  { label: 'Page 1', href: '/page1' },
  { label: 'Page 2', href: '/page2' },
  { label: 'Page 3', href: '/page3' }
];

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
      appbar: {
        alignItems: 'center'
      },
      sitenav: {
        padding: '6px 12px',
        minHeight: '48px',
        color: 'inherit',
        opacity: 0.5
      }
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

  // calculate page index from matching router with ROUTES structure
  const pageIndex = ROUTES.findIndex(page => page.href === router.pathname);
  const currentTab = pageIndex < 0 ? 0 : pageIndex;
  // set the current tab
  const [value, setValue] = React.useState(currentTab);

  // render cosmetic tab links
  // page navigation through nextjs is handled programmatically in
  // the onChange handler
  const TabLinks = ROUTES.map((page, index) => {
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
        onClick={event => {
          event.preventDefault();
        }}
      />
    );
  });

  // MUI <Tabs> component uses this state to determine what is highlighted
  // this is happening on client so setvalue never affects anything
  const handleChange = (event, newValue) => {
    setValue(newValue);

    const route = ROUTES[newValue];
    if (route) {
      console.log('change index', route.href);
      router.replace(route.href);
      if (typeof window === 'object' && window.STORE)
        window.STORE.currentTab = newValue;
    }
  };

  /// RENDER //////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  return (
    <AppBar position="static" className={classes.appbar}>
      <Grid container>
        <Grid item>
          <Typography variant="h6" className={classes.title}>
            GEM-STEP
          </Typography>
        </Grid>
        <Grid item>
          <Tabs
            variant="standard"
            value={value}
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
