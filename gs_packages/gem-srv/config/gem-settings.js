/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global application-specific constants

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const Path = require('path');
// export everything that's already in the global config
const GSCONFIG = require('../../../gsgo-settings');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PACKAGE_NAME = 'GEM_SRV';
const RUNTIME_DIRNAME = 'runtime';
const RUNTIME_PATH = Path.join(__dirname, `../${RUNTIME_DIRNAME}`);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ...GSCONFIG,
  // overrides
  PACKAGE_NAME,
  RUNTIME_DIRNAME,
  RUNTIME_PATH // used only by servers
};
