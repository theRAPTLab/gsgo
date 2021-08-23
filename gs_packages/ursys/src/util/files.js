/* eslint-disable no-continue */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  File System Helpers

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NDir = require('node-dir');
const Path = require('path');
const Hasha = require('hasha');
const FSE = require('fs-extra');
const TERM = require('./prompts').makeTerminalOut('U-FILE', 'TagGreen');
const FNAME = require('./files-naming');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const VALID_MEDIA_EXT = {
  sprites: ['.png', '.gif', '.jpg', '.jpeg', '.json']
};
const ASSET_DIRS = ['sprites']; // valid asset subdirectories
const DBG = false;

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
    // console.warn(`IsDirectory: ${dirpath} does not exist`);
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
function HasValidAssetExtension({ type, filename }) {
  const ext = Path.extname(filename).toLowerCase();
  const validtypes = VALID_MEDIA_EXT[type];
  if (validtypes === undefined) return false;
  return validtypes.includes(ext);
}
//
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ReadJSON(filepath) {
  let rawdata = FSE.readFileSync(filepath);
  return JSON.parse(rawdata);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function WriteJSON(filepath, obj, cb) {
  let file = FSE.createWriteStream(filepath, { emitClose: true });
  if (typeof obj !== 'string') obj = JSON.stringify(obj, null, 2);
  file.write(obj);
  file.on('finish', () => {
    if (DBG) TERM('wrote:', filepath);
    if (typeof cb === 'function') cb();
  });
  file.on('error', () => {
    TERM('error on write');
    if (typeof cb === 'function') cb(`error writing ${filepath}`);
  });
  file.end(); // if this is missing, close event will never fire.
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return array of filenames */
function GetDirContent(dirpath) {
  if (!DirectoryExists(dirpath)) {
    console.warn(`${dirpath} is not a directory`);
    return undefined;
  }
  const filenames = FSE.readdirSync(dirpath);
  const files = [];
  const dirs = [];
  for (let name of filenames) {
    let path = Path.join(dirpath, name);
    const stat = FSE.lstatSync(path);
    // eslint-disable-next-line no-continue
    if (stat.isDirectory()) dirs.push(name);
    else files.push(name);
  }
  return { files, dirs };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetFiles(dirpath) {
  return GetDirContent(dirpath).files || [];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetSubdirs(dirpath) {
  return GetDirContent(dirpath).dirs || [];
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Based on http://stackoverflow.com/questions/25460574/
 *  returns an object with files:recfiles, number of files, and
 *  the highest count found.
 */
function RecordingsInDirectory(dirpath) {
  // this regex looks for 4-digit named group "seq" followed
  // by a dash and ending with a .rec extension
  const regex = /^(?<seq>\d{4})-.*\.rec$/;
  const files = GetDirContent(dirpath);
  const recfiles = [];
  if (files === undefined) return undefined;
  let count = 0;
  let highest = 0;
  for (const f of files) {
    const m = f.match(regex);
    const seqnum = m.group.seq;
    if (seqnum) {
      count++;
      highest = Math.max(seqnum, highest);
      recfiles.push({ prefix: seqnum, file: f });
    }
  }
  return {
    count,
    highest,
    files: recfiles
  };
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
  const { dirs } = GetDirContent(dirpath);
  return dirs.filter(d => ASSET_DIRS.includes(d));
}

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // file name utilities
  ...FNAME,
  // file ops
  ReadFilesExt,
  PromiseReadFilesExt,
  IsFile,
  FileExists,
  IsDirectory,
  DirectoryExists,
  EnsureDirectory,
  GetFiles,
  GetSubdirs,
  // asset-related
  HasValidAssetExtension,
  ReadJSON,
  WriteJSON,
  RecordingsInDirectory,
  PromiseFileHash,
  GetAssetDirs
};
