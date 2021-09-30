/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project File Write Routines

  Utilities to write project files

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const Path = require('path');
const FILE = require('./files');

const {
  GS_ASSETS_PATH,
  GS_ASSETS_PROJECT_ROOT,
  GS_PROJFILE_EXTENSION
} = require('../../../../gsgo-settings');

const PROMPTS = require('./prompts');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = PROMPTS.makeTerminalOut('U-PROJFILE}', 'TagGreen');
const DBG = true;
let m_assetPath = GS_ASSETS_PATH;
let m_projectRoot = GS_ASSETS_PROJECT_ROOT;

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** set the current dirpath to all local assets */
function SetAssetPath(path = GS_ASSETS_PATH) {
  m_assetPath = path;
}
/** set the current dirpath to all local assets */
function SetProjectRoot(path = GS_ASSETS_PROJECT_ROOT) {
  m_projectRoot = path;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function WriteProject(obj, cb) {
  const filename = `${obj.id}.${GS_PROJFILE_EXTENSION}`;
  const assetTypeRoot = 'projects';
  const projPath = Path.join(m_assetPath, m_projectRoot, assetTypeRoot, filename);
  FILE.WriteProject(projPath, obj, res => {
    if (res) TERM('WriteProject:', res);
    if (typeof cb === 'function') cb(res);
  });
}

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  SetAssetPath,
  SetProjectRoot,
  WriteProject
};
