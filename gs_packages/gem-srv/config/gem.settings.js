/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global application-specific constants

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const PATH = require('path');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: Webpack replaces __dirname with the file's dirname for browsers!
const PROJECT_NAME = 'GEMSTEP';
const RUNTIME_DIRNAME = 'runtime';
const RUNTIME_PATH = PATH.join(__dirname, `../${RUNTIME_DIRNAME}`);
const ASSETS_LOCAL = PATH.join(__dirname, '../../../gs_assets');
const ASSETS_HOST = 'http://localhost:8080';
const ASSETS_ROUTE = 'assets';
const MANIFEST_FILE = '00-manifest';

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  PROJECT_NAME,
  //
  RUNTIME_DIRNAME,
  RUNTIME_PATH, // used only by servers
  //
  ASSETS_LOCAL, // used only by servers
  ASSETS_HOST, // server hosting assets
  ASSETS_ROUTE, // relative path to assets root
  MANIFEST_FILE // name of manifest file in an asset dir/zip
};
