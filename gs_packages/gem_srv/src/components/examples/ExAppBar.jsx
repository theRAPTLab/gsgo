/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import {
  Typography,
  // Appbar
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import GSLogo from '@material-ui/icons/SentimentVerySatisfied';
import GSTabbedLayout from './ExTabbedAppBar';

/// CUSTOM STYLES FOR THIS COMPONENT //////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// create useStyles() hook with theme object included
/// the useStyles() hook also can receive a parameter for further customization
const useStyles = makeStyles(theme => ({
  menuButton: {
    marginRight: theme.spacing(2)
  },
  title: {
    flexGrow: 1
  },
  toolbar: {
    minHeight: 36
  }
}));

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: global theme properties are passed in _app.js by <ThemeProvider>
/// See theme.js and theme-derived.js to customize theme properties
function GSAppBar() {
  // you may have some state to calculate based on useEffect, etc
  const computedState = { show: true };

  // calculate dynamic rules by passing state
  const classes = useStyles(computedState); // dictionary of { rule : jss classname }
  const [auth, setAuth] = React.useState(true);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  /// HANDLERS ////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const handleMenuOpen = event => {
    setAnchorEl(event.currentTarget);
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <AppBar position="static">
      <Toolbar className={classes.toolbar}>
        <IconButton
          edge="start"
          className={classes.menuButton}
          color="inherit"
          aria-label="menu"
          onClick={handleMenuOpen}
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
              onClick={handleMenuOpen}
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
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
              <MenuItem onClick={handleMenuClose}>My account</MenuItem>
            </Menu>
          </div>
        )}
      </Toolbar>
    </AppBar>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default GSAppBar; // functional component
