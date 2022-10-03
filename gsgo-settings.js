/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GSGO PARAMETERS

  For global constants shared by multiple packages in gsgo
  All global config names should begin with GS_

  This is imported by the individual package settings in their config/
  directory, and selectively overridden if necessary. These settings can be
  loaded by both the node and browser environments!

  See 'gs_packages/gem-srv/config/gem-settings.js' for an example use

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Path = require('path');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// base paths of local assets, distributed assets
const GS_DIRPATH = Path.resolve(__dirname); // note: webpack(?) substitutes '/' for __dirname
const GS_ASSETS_HOST_PATH = Path.join(GS_DIRPATH, 'gs_assets_hosted');
const GS_ASSETS_PATH = Path.join(GS_DIRPATH, 'gs_assets');
const GS_ASSETS_PROJECT_ROOT = 'art-assets'; // user can load anything in GS_ASSETS_PROJECT_ROOT folder
const GS_ASSETS_DEV_ROOT = 'dev'; // used by the Dev* utilities
const GS_MANIFEST_FILENAME = '00-manifest';

const GS_PROJFILE_EXTENSION = 'gemprj';

/// assets server parameters
const GS_ASSETS_PORT = 8080;
const GS_ASSET_HOST_URL = `http://localhost:${GS_ASSETS_PORT}`;
const GS_ASSETS_ROUTE = 'assets'; // (url route, not local file path, e.g. http://localhost:8080/assets/foo)

// gemstep server parameters
const GS_APP_PORT = 80;

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  GS_MANIFEST_FILENAME,
  GS_ASSETS_HOST_PATH,
  GS_ASSETS_PATH,
  GS_ASSETS_PROJECT_ROOT,
  GS_ASSETS_DEV_ROOT,
  GS_PROJFILE_EXTENSION,
  GS_DIRPATH,
  GS_ASSET_HOST_URL,
  GS_APP_PORT,
  GS_ASSETS_ROUTE
};
