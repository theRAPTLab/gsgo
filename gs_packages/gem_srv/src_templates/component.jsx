/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Example Component using theme from <ThemeProvider> that is defined in
  _app.js in local styles.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
// material ui core
import Typography from '@material-ui/core/IconButton';

import { makeStyles, useTheme } from '@material-ui/core/styles';

/// CUSTOM STYLES FOR COMPONENT ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// This makes a 'useStyles hook' with theme object passed-in.
/// The useStyles() hook also can receive a parameter for further customization.
/// Format is JSS { camelCaseCSS : 'values' }
const useStyles = makeStyles(theme => ({
  myRule: {
    // ex: theme-derived rule
    padding: theme.spacing(1),
    // ex: computed rule
    color: state => (state.counter > 0 ? 'black' : 'red')
  }
}));

/// EXAMPLE COMPONENT /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: global theme properties are passed in _app.js by <ThemeProvider>
/// See theme.js and theme-derived.js to customize theme properties
function MyComponent() {
  // ex: create state hook
  const [counter, setCounter] = React.useState(0);
  const [anchorEl, setAnchorEl] = React.useState(null);
  // ex: calculate dynamic rules by passing state
  const classes = useStyles({ counter }); // computed rule receives param
  // ex: get theme if needed for some reason
  const theme = useTheme(); // property object of theme settings

  /// HANDLERS ////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// CODESTYLE: use const for local handlers, function for components
  const handleClick = event => {
    setCounter(counter + 1);
    setAnchorEl(event.currentTarget);
  };

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <Typography className={classes.myRule} onClick={handleClick}>
      This is my component. It was clicked {counter} times. The theme.spacing(1)
      is {theme.spacing(1)} pixels.
      {anchorEl ? 'Anchor element clicked!' : ''}
    </Typography>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default MyComponent; // functional component
