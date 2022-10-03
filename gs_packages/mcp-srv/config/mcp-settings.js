/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MAIN CONTROL PROGRAM SERVER (MCP) CONFIGURATION

  if you need to override a value here or in gsgo-settings, put them in the
  config/local-settings file. Do not modify this file.

  These settings modules MUST be loadable by both the node and browser
  environments, so do not require modules that do not work cross-environment
  (e.g. filesystem)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

// export everything that's already in the global config
const GSCONFIG = require('../../../gsgo-settings');
const OVERRIDES = require('./local-settings.json');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PACKAGE_NAME = 'MCP_SRV';

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ...GSCONFIG,
  // overrides
  PACKAGE_NAME,
  // overrides from local-settings.json
  ...OVERRIDES
};
