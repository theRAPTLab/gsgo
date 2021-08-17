/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GSGO PARAMETERS

  For constants shared by multiple package. Import into package-specific
  settings, override, and export:

  const GS_GLOBALS = require('../../../gs_config');
  const FOO = 'bar'
  module.exports = {...GS_GLOBALS, FOO }

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const MANIFEST_NAME = '00-manifest';
const SERVER_ASSETS_DIRPATH = 'gs_assets_distrib';
const LOCAL_ASSETS_DIRPATH = 'gs_assets';

module.exports = {
  MANIFEST_NAME,
  SERVER_ASSETS_DIRPATH,
  LOCAL_ASSETS_DIRPATH
};
