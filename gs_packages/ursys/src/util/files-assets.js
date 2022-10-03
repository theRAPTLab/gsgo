/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  File System Asset Helpers

  File operations specific to handling asset media

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const Path = require('path');
const Hasha = require('hasha');
const FILE = require('./files');
const { VALID_ASSET_EXTS, VALID_ASSET_DIRS } = require('../common/ur-constants');

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsAssetDirname(subdir) {
  return VALID_ASSET_DIRS.includes(subdir);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HasValidAssetExtension({ type, filename }) {
  const ext = Path.extname(filename).toLowerCase();
  const validtypes = VALID_ASSET_EXTS[type];
  if (validtypes === undefined) return false;
  return validtypes.includes(ext);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the MD5 hash of the passed filepath */
async function PromiseFileHash(filepath) {
  const hash = await Hasha.fromFile(filepath, { algorithm: 'md5' });
  const { base, ext } = Path.parse(filepath);
  return { filepath, filename: base, ext, hash };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a list of asset directories that match ASSET_DIRS */
function GetAssetDirs(dirpath) {
  const { dirs } = FILE.GetDirContent(dirpath);
  return dirs.filter(d => VALID_ASSET_DIRS.includes(d));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DuplicateAsset(sourcefilepath, newfilepath, cb) {
  FILE.copyFile(sourcefilepath, newfilepath, cb);
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  IsAssetDirname,
  HasValidAssetExtension,
  PromiseFileHash,
  GetAssetDirs,
  DuplicateAsset
};
