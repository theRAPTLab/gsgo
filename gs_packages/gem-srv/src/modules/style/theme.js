/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  theme.js is for customizing the Material UI default theme, which implements
  the following standard Material Design properties:

    breakpoints   overrides    shadows      transitions
    direction     palette      shape        typography
    mixins        props        spacing      zIndex

  This theme is used on the <ThemeProvider> wrapper in _app.js, and thus
  is available in all React components with the right MUI mojo.

  There are three contexts where you would use these values:

  1. Global Theme Styling - affects all MUI components
  2. Additional Parameters - available through theme object
  3. Local Computed Styles - available through theme object

  There are different approaches used depending on whether you are using Hooks
  or Classes.  See our best practices example docs, or look through this repo
  for example uses.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import createTheme from '@material-ui/core/styles/createTheme';
import { red, indigo, deepOrange } from '@material-ui/core/colors';
import addDerivedStyles from './theme-derived';

/// DEFINE MUI THEME //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const baseTheme = createTheme({
  // global change MD default parameters
  palette: {
    primary: indigo,
    secondary: deepOrange,
    error: {
      main: red.A400
    }
  },
  // global change MUI css for built-in components
  overrides: {
    MuiTab: {}
  }
});

/// ADD OUR CUSTOM STYLES /////////////////////////////////////////////////////
/// AND EXPORT            /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default addDerivedStyles(baseTheme);
