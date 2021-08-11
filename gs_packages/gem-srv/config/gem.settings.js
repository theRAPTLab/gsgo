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
const ASSETS_HOST = 'http://localhost';
const ASSETS_ROUTE = 'assets';

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
  ASSETS_ROUTE // relative path to assets root
};
