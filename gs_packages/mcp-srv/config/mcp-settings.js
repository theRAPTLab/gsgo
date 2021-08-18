/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MAIN CONTROL PROGRAM SERVER (MCP) CONFIGURATION

  you probably DO NOT need to change settings here. If you are localizing
  your installation, make a `gs-config-local.js` file in the root directory
  and override them there.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

// export everything that's already in the global config
const GSCONFIG = require('../../../gsgo-settings');

const PACKAGE_NAME = 'MCP_SRV';

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  PACKAGE_NAME,
  //
  ...GSCONFIG // all props begin with GS_
};
