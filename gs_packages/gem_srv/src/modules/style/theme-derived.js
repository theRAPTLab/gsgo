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
  // set layout-related styles here
  const layoutJSS = {
    urFullScreenApp: {
      backgroundColor: '#e0e0e0',
      display: 'flex',
      flexFlow: 'column nowrap',
      height: '100vh'
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
  // make a global classname you can use directly instead of through
  // the classes dictionary (e.g. <div className='ursys'>)
  const globalClasses = {
    '@global': {
      '.ursys': {
        height: 100,
        width: 100,
        backgroundColor: 'blue'
      }
    }
  };
  // merge all styles together
  return merge.all([
    theme,
    layoutJSS,
    componentJSS,
    globalProperties,
    globalClasses
  ]);
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default addDerivedStyles;
