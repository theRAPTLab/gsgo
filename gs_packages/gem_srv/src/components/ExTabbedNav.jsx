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
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { makeStyles } from '@material-ui/core/styles';

import wireframeStyles from '../modules/style/wireframing';

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
      nexttab: {
        padding: '6px 12px',
        minHeight: '48px',
        color: 'inherit',
        opacity: 0.7
      }
    },
    wireframeStyles(theme)
  ])
);

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: global theme properties are passed in _app.js by <ThemeProvider>
/// See theme.js and theme-derived.js to customize theme properties
function GSTabbedNav(props) {
  const classes = useStyles();
  const router = useRouter();
  const [value, setValue] = React.useState(0);

  // MUI <Tabs> component uses this state to determine what is highlighted
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // MUI <Tab> use ids to identify which to select
  function a11yProps(index) {
    return {
      id: `nav-tab-${index}`,
      'aria-controls': `nav-tabpanel-${index}`
    };
  }

  // Use NextJS Link with MUI Button as <a> to handle routes
  function NextTab(props) {
    const { label, href } = props;
    const style = router.pathname === href ? { opacity: 1 } : { opacity: 0.7 };
    return (
      <Link href={href} passHref>
        <Button className={classes.nexttab} style={style} component="a">
          {label}
        </Button>
      </Link>
    );
  }

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
            <NextTab label="Page 1" href="/" {...a11yProps(0)} />
            <NextTab label="Page 2" href="/about" {...a11yProps(1)} />
            <NextTab label="Page 3" href="/extra" {...a11yProps(2)} />
          </Tabs>
        </Grid>
      </Grid>
    </AppBar>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default GSTabbedNav; // functional component
