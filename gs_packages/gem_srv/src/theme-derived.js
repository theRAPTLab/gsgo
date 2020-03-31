/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is where you can define additional global properties that will be
  propagated under the theme object available to all components.

  addDerivedStyles accepts a theme object created with createMuiTheme, and
  returns a decorated object. You can create your derived properties using
  the values in the theme object.

  DO NOT USE the following reserved property names, as they are part of MUI
  theming. If you need to modify them, do so in theme.js

    breakpoints   overrides    shadows      transitions
    direction     palette      shape        typography
    mixins        props        spacing      zIndex

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

import merge from 'deepmerge';

/// MERGE STYLES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Merge a MuiTheme (assumed to be created with createMuiTheme) with
 *  extra parameters.
 */
const addDerivedStyles = theme => {
  // set layout-related styles here
  const layoutStyles = {
    root: '',
    container: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gridGap: theme.spacing(3)
    }
  };
  // provide additional MUI overrides
  const componentStyles = {
    paper: {
      padding: theme.spacing(1),
      textAlign: 'center',
      color: theme.palette.text.secondary,
      whiteSpace: 'nowrap',
      marginBottom: theme.spacing(1)
    },
    divider: {
      margin: theme.spacing(2, 0)
    }
  };
  // other styles of application-wide interest
  // for individual components, use local makeStyles/useStyles/useTheme
  // conventions
  const globalStyles = {};
  // merge all styles together
  return merge.all([theme, layoutStyles, componentStyles, globalStyles]);
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default addDerivedStyles;
