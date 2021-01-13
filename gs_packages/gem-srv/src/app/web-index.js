/*///////////////////////////////// NOTES \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NOTE: this file is the ENTRY POINT designated in wp.pack.webapp.js

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// SYSTEM-WIDE LANGUAGE EXTENSIONS ///////////////////////////////////////////
/// These are loaded in init to make sure they are available globally!
/// You do not need to copy these extensions to your own module files
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import System from './boot/SystemInit'; // URSYS bootloader

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = '[WebIndexJS]';

/// HOT MODULE RELOADING //////////////////////////////////////////////////////
/*/- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\*\
    HMR is a Webpack feature. Generally you write a handler:
    module.hot.accept('./library.js',()=>{ ..do something.. });

    To enable HMR in Webpack, need to an additional entry point to the
    utility code in webpack-hot-middleware/client:
    entryFiles = ['./web-index.js', 'webpack-hot-middleware/client?reload=true'];

    Since actual hot module swapping handling is tricky, the code below
    lazily assumes that it should reload the entire application when the
    source files are ready
\*\- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - /*/
if (module.hot) {
  // not doing this:
  // module.hot.accept(deps,callback);

  module.hot.addStatusHandler(status => {
    // reload entire if ANY change occurs
    if (status === 'ready') {
      window.location.reload();
    } else console.log(PR, 'HMR status:', status);
  });
} else {
  console.log(`${PR} HMR support is not enabled`);
}

/// JAVASCRIPT GLOBAL INJECTION ///////////////////////////////////////////////
/*/- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\*\
    Global FLAG strings or booleans can be injected at runtime via
    webpack.DefinePlugin. Override eslint complaints with the 'global'
    comment. Note that webpack doesn't actually inject an object, but
    does STRING REPLACEMENT before writing the file.

    To insert more complex objects, this is done at the webserver level.
    Look in server-express.js for template handlers.
\*\- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - /*/
/* global COMPILED_BY */
if (COMPILED_BY) {
  console.log(PR, 'COMPILED_BY:', COMPILED_BY);
} else {
  const doc = document.getElementById('app-container');
  const err = 'missing COMPILED_BY define (not critical)';
  doc.appendChild(document.createTextNode(err));
  console.log(err);
}

/// INITIALIZE GEMSTEP ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
System.Init();
