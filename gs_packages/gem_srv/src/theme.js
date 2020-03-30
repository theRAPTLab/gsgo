/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  theme.js is for customizing the Material UI default theme, which implements
  the following standard Material Design properties:

  breakpoints   overrides    shadows      transitions
  direction     palette      shape        typography
  mixins        props        spacing      zIndex

  See theme-extra.js for custom styles used by this application

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import { createMuiTheme } from '@material-ui/core/styles';
import { red } from '@material-ui/core/colors';
import withExtraStyles from './theme-extras';

/// DEFINE MUI THEME //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const baseTheme = createMuiTheme({
  palette: {
    primary: {
      main: '#556cd6'
    },
    secondary: {
      main: '#19857b'
    },
    error: {
      main: red.A400
    },
    background: {
      default: '#fff'
    }
  }
});

/// ADD OUR CUSTOM STYLES /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default withExtraStyles(baseTheme);
