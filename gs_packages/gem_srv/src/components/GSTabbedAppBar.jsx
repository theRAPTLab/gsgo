/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';

// material ui
import Box from '@material-ui/core/Box';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import GSLogo from '@material-ui/icons/SentimentVerySatisfied';
import MenuIcon from '@material-ui/icons/Menu';

import blue from '@material-ui/core/colors/blue';
import { makeStyles } from '@material-ui/core/styles';

/// CUSTOM STYLES FOR COMPONENT ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper
  },
  tabs: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.secondary
  },
  blueBox: {
    backgroundColor: blue[50],
    padding: theme.spacing(1)
  },
  controlBox: {
    extend: 'blueBox',
    backgroundColor: blue[100]
  },
  viewBox: {
    extend: 'blueBox',
    backgroundColor: blue[200]
  }
}));

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </Typography>
  );
}

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
function GSTabbedLayout() {
  const classes = useStyles();
  const [tabIndex, setTabIndex] = React.useState(0);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [auth, setAuth] = React.useState(true);

  const open = Boolean(anchorEl);

  /// HANDLERS ////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const handleMenu = event => {
    setAnchorEl(event.currentTarget);
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const handleChange = (event, tabIndex) => {
    setTabIndex(tabIndex);
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const handleClose = () => {
    setAnchorEl(null);
  };

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar className={classes.toolbar}>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
            onClick={handleMenu}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            GEM-STEP
          </Typography>
          {auth && (
            <div>
              <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <GSLogo />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
                open={open}
                onClose={handleClose}
              >
                <MenuItem onClick={handleClose}>About GEMSTEP</MenuItem>
                <MenuItem onClick={handleClose}>Connection Info</MenuItem>
              </Menu>
            </div>
          )}
        </Toolbar>
        <Tabs
          value={tabIndex}
          onChange={handleChange}
          aria-label="simple tabs example"
          className={classes.tabs}
        >
          <Tab label="Item One" {...a11yProps(0)} />
          <Tab label="Item Two" {...a11yProps(1)} />
          <Tab label="Item Three" {...a11yProps(2)} />
        </Tabs>
      </AppBar>
      <TabPanel value={tabIndex} index={0}>
        Item One
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        Item Two
      </TabPanel>
      <TabPanel value={tabIndex} index={2}>
        Item Three
      </TabPanel>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default GSTabbedLayout; // functional component
