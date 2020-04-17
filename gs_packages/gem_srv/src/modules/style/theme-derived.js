/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is where you can define additional global styles anhd properties that
  will be propagated under the theme object available to all components.

  addDerivedStyles() accepts a theme object created with createMuiTheme, and
  returns a decorated object. You can create your derived properties using
  the values in the theme object.

  The following reserved property names are defined by createMuiTheme() and
  will already be set when addDerivedStyles() is invoked by theme.js

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
 *  extra parameters. The categories below are merely suggestions.
 *  example:
 *  const theme = useTheme();
 *  <div style={theme.property}/>
 */
const addDerivedStyles = theme => {
  const fontMargin = theme.typography.htmlFontSize;

  // set layout-related styles here
  // the properties here (e.g. layoutJSS) are just for labeling clarity
  // and are not part of any system configuration
  const layoutJSS = {
    urFullScreenApp: {
      backgroundColor: '#e0e0e0',
      display: 'flex',
      flexFlow: 'column nowrap',
      height: '100vh',
      overflow: 'hidden'
    },
    urFullScreenView: {
      display: 'flex',
      flexFlow: 'column nowrap',
      flexGrow: 1
    },
    urApp: {
      display: 'block'
    }
  };
  // provide additional MUI overrides
  const componentJSS = {};
  // other styles of application-wide interest
  // for individual components, use local makeStyles/useStyles/useTheme
  // conventions
  const globalProperties = {};
  // merge all styles together
  return merge.all([theme, layoutJSS, componentJSS, globalProperties]);
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default addDerivedStyles;
