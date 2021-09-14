/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Base File System Helpers

  Provides a variety of common file operations.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NDir = require('node-dir');
const Path = require('path');
const FSE = require('fs-extra');
const TERM = require('./prompts').makeTerminalOut('U-FILE', 'TagGreen');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
function ReadFilesExtSync(dirpath, ext, cb) {
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
function ReadFilesExt(dirpath, ext) {
  return new Promise((resolve, reject) => {
    ReadFilesExtSync(dirpath, ext, (err, files) => {
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
function DirExists(dirpath) {
  try {
    const stat = FSE.statSync(dirpath);
    if (stat.isFile()) {
      console.warn(`DirExists: ${dirpath} is a file, not a directory`);
      return false;
    }
    return stat.isDirectory();
  } catch (e) {
    return false;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns TRUE if the passed dirfile is a directory */
function IsDir(dirpath) {
  try {
    const stat = FSE.statSync(dirpath);
    if (stat.isDirectory()) return true;
    return false;
  } catch (e) {
    // console.warn(`IsDir: ${dirpath} does not exist`);
    return false;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns TRUE if the passed dirfile is a file */
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
function EnsureDir(path) {
  try {
    FSE.ensureDirSync(path);
    return true;
  } catch (err) {
    const errmsg = `EnsureDir <${path}> failed w/ error ${err}`;
    console.error(errmsg);
    throw new Error(errmsg);
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** read the JSON file at the filepath. It's up to the calling function to
 *  catch errors.
 */
function ReadJSON(filepath) {
  let rawdata = FSE.readFileSync(filepath);
  return JSON.parse(rawdata);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** write the JSON file to the filepath. It's up to the calling function to
 *  catch errors.
 */
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
  if (!DirExists(dirpath)) {
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
/** return an array of filenames in the dirpath. these are short filename
 *  and are not recursive
 */
function GetFiles(dirpath) {
  return GetDirContent(dirpath).files || [];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return an aray of directories in the dirpath. these are short dirnames */
function GetSubdirs(dirpath) {
  return GetDirContent(dirpath).dirs || [];
}

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // file ops
  ReadFilesExtSync,
  ReadFilesExt,
  IsFile,
  FileExists,
  IsDir,
  DirExists,
  GetDirContent,
  EnsureDir,
  GetFiles,
  GetSubdirs,
  // json
  ReadJSON,
  WriteJSON
};
