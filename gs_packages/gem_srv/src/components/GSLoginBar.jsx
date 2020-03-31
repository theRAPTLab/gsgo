/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
// material ui core
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
// material ui core
import { makeStyles, useTheme } from '@material-ui/core/styles';

/// CUSTOM STYLES FOR THIS COMPONENT //////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// create useStyles() hook with theme object included
/// the useStyles() hook also can receive a parameter for further customization
const useStyles = makeStyles(theme => ({
  control: { float: 'right' }
}));

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: global theme properties are passed in _app.js by <ThemeProvider>
/// See theme.js and theme-derived.js to customize theme properties
function LoginBar() {
  const classes = useStyles();
  // if you need read-only theme parameters directly in the component
  const theme = useTheme(); // property object of theme settings
  const [auth, setAuth] = React.useState(true);

  /// HANDLERS ////////////////////////////////////////////////////////////////
  const handleChange = event => {
    setAuth(event.target.checked);
  };

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <FormGroup className={classes.control}>
      <FormControlLabel
        control={
          <Switch
            checked={auth}
            onChange={handleChange}
            aria-label="login switch"
          />
        }
        label={auth ? 'logged-in' : 'logged-out'}
        labelPlacement="start"
        style={{ marginRight: theme.spacing(0) }}
      />
    </FormGroup>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default LoginBar; // functional component
