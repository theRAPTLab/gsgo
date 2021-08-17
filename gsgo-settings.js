/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GSGO PARAMETERS

  For constants shared by multiple package. Import into package-specific
  settings, override, and export:

  const GS_GLOBALS = require('../../../gs_config');
  const FOO = 'bar'
  module.exports = {...GS_GLOBALS, FOO }

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Path = require('path');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GS_DIRPATH = Path.resolve(__dirname);
const GS_ASSETS_DISTRIB_PATH = Path.join(GS_DIRPATH, 'gs_assets_distrib');
const GS_ASSETS_PATH = Path.join(GS_DIRPATH, 'gs_assets');

const GS_ASSETS_HOST = 'http://localhost';
const GS_ASSETS_PORT = 8080;
const GS_ASSETS_ROUTE = 'assets';
const GS_APP_PORT = 80;

const GS_MANIFEST_FILENAME = '00-manifest';

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  GS_MANIFEST_FILENAME,
  GS_ASSETS_DISTRIB_PATH,
  GS_ASSETS_PATH,
  GS_DIRPATH,
  GS_ASSETS_HOST,
  GS_ASSETS_PORT,
  GS_APP_PORT,
  GS_ASSETS_ROUTE
};
