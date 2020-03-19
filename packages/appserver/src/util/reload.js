/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PRIVATE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let RELOAD_CHECK = 0;
let RELOAD_TIMER = null;

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Force Reload if another module was navigated to and we want to ensure the
    entire browser was refreshed so only one set of app modules is loaded.
    This counts on a simple counter...if it's called more than once
    (as would be the case with a secibd root view being mounted), it will
    reload.
/*/
const ReloadOnViewChange = () => {
  RELOAD_CHECK++;
  if (RELOAD_CHECK > 1) {
    if (RELOAD_TIMER) clearTimeout(RELOAD_TIMER);
    RELOAD_TIMER = setTimeout(() => {
      window.location.reload();
    }, 250);
  }
};

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE if you are exporting just one thing, Webpack with screw that up
/// unless you change the form to 'export default ReloadOnView'
/// If you are returning more than one thing, then use
/// export { ReloadOnView, AnotherThing, ... }
export default ReloadOnViewChange;
