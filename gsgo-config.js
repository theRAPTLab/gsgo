/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GSGO PARAMETERS

  For constants shared by multiple package. Import into package-specific
  settings, override, and export:

  const GS_GLOBALS = require('../../../gs_config');
  const FOO = 'bar'
  module.exports = {...GS_GLOBALS, FOO }

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const MANIFEST_NAME = '00-manifest';

module.exports = {
  MANIFEST_NAME
};
