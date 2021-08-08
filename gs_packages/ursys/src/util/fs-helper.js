/* eslint-disable no-continue */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  File System Helpers

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NDir = require('node-dir');
const Path = require('path');
const IP = require('ip');
const Hasha = require('hasha');
const FSE = require('fs-extra');
const TERM = require('./prompts').makeTerminalOut('UTIL-FS', 'TagGreen');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const VALID_MEDIA_EXT = {
  sprites: ['.png', '.gif', '.jpg', '.jpeg', '.json']
};

/// FILE METHODS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return a list of files with a particular extension through a callback.
 *  callback signature is (err,files)=>{}
 *  The array will contain short names.
 *  @param {string} dirpath - full path to directory
 *  @param {string} ext - extension without period (ex: js, png|gif)
 *  @param {function} callback - provide (err,files)=>{}
 */
function ReadFilesExt(dirpath, ext, cb) {
  const reg = new RegExp(`.(${ext})$`);
  const callback = typeof cb === 'function' ? cb : false;
  const opt = {
    recursive: false,
    shortName: true,
    match: reg,
    exclude: /^\./
  };
  NDir.readFiles(
    dirpath,
    opt,
    (err, content, next) => {
      if (err) throw err;
      next();
    },
    (err, files) => {
      if (callback) callback(err, files);
      else {
        if (err) throw err;
        TERM('ReadFilesExt debug (add callback to receive files)');
        TERM('DIR:', dirpath);
        TERM('EXT:', ext);
        TERM('OPTIONS', JSON.stringify(opt));
        TERM('----');
        files.forEach((file, i) => {
          const num = `${i}`.padStart(4, '0');
          TERM(`${num} - ${file}`);
        });
      }
    }
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return a Promise to retrieve files with a particular extension.
 *  On success, resolves to filename array.
 *  The array will contain short names.
 *  @param {string} dirpath - full path to directory
 *  @param {string} ext - extension without period (ex: js, png|gif)
 *  @returns {Promise} - resolves to filename array
 */
function PromiseReadFilesExt(dirpath, ext) {
  return new Promise((resolve, reject) => {
    ReadFilesExt(dirpath, ext, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return true if the file in filepath exists */
function FileExists(filepath) {
  try {
    // accessSync only throws an error; doesn't return a value
    FSE.accessSync(filepath);
    return true;
  } catch (e) {
    return false;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns TRUE if the passed file is a directory */
function DirectoryExists(dirpath) {
  try {
    const stat = FSE.statSync(dirpath);
    if (stat.isFile()) {
      console.warn(`DirectoryExists: ${dirpath} is a file, not a directory`);
      return false;
    }
    return stat.isDirectory();
  } catch (e) {
    return false;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsDirectory(dirpath) {
  try {
    const stat = FSE.statSync(dirpath);
    if (stat.isDirectory()) return true;
    return false;
  } catch (e) {
    console.warn(`IsDirectory: ${dirpath} does not exist`);
    return false;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsFile(filepath) {
  try {
    const stat = FSE.statSync(filepath);
    if (stat.isFile()) return true;
    return false;
  } catch (e) {
    console.warn(`IsFile: ${filepath} does not exist`);
    return false;
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a dirpath, make sure it exists */
function EnsureDirectory(path) {
  try {
    FSE.ensureDirSync(path);
    return true;
  } catch (err) {
    const errmsg = `EnsureDirectory <${path}> failed w/ error ${err}`;
    console.error(errmsg);
    throw new Error(errmsg);
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HasValidAssetType({ type, filename }) {
  const ext = Path.extname(filename).toLowerCase();
  const validtypes = VALID_MEDIA_EXT[type];
  if (validtypes === undefined) return false;
  return validtypes.includes(ext);
}

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ReadFilesExt,
  PromiseReadFilesExt,
  IsFile,
  FileExists,
  IsDirectory,
  DirectoryExists,
  EnsureDirectory,
  HasValidAssetType
};
