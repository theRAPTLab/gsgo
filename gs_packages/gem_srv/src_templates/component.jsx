/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Example Component using theme from <ThemeProvider> that is defined in
  _app.js in local styles.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// react
import React from 'react';
/// material ui
import Typography from '@material-ui/core/IconButton';
import { makeStyles, useTheme } from '@material-ui/core/styles';
/// local imports

/// LOCAL STYLES DECLARATIONS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// note: global theme overrides are in theme.js and theme-derived.js
const useStyles = makeStyles(theme => ({
  myRule: {
    // ex: theme-derived rule
    padding: theme.spacing(1),
    // ex: computed rule
    color: state => (state.counter > 0 ? 'black' : 'red')
  }
}));

/// FUNCTIONAL COMPONENT //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MyComponent(props) {
  /// STATEFUL DECLARATIONS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// ex: use of hooks
  const [counter, setCounter] = React.useState(0);
  const [anchorEl, setAnchorEl] = React.useState(null);
  /// ex: use of jss rule-value-function plugin (calculated styles)
  const classes = useStyles({ counter }); // computed rule receives param
  /// ex: get theme object if you need its parameters, or have added some
  const theme = useTheme(); // property object of theme settings
  /// ex: props can also be passed from parent component
  if (props) console.log('props', { ...props });

  /// HANDLERS ////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// CODESTYLE: use const for local handlers, function for components
  const handleClick = event => {
    setCounter(counter + 1);
    setAnchorEl(event.currentTarget);
  };

  /// RENDER //////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// note: you can refer to classes, theme, counter, anchorEl below
  /// note: apply styles to 'className to modify existing theme styles
  /// note: apply styles to 'classes' to replacing existing theme styles
  /// note: or apply 'style' inline style object
  return (
    <>
      <Typography className={classes.myRule} onClick={handleClick}>
        This is my component. It was clicked {counter} times. The theme.spacing(1)
        is {theme.spacing(1)} pixels.
        {anchorEl ? 'Anchor element clicked!' : ''}
      </Typography>
    </>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default MyComponent; // your functional component
