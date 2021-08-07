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

/// FILE METHODS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return a list of files with a particular extension through a callback.
 *  callback signature is (err,files)=>{}
 *  The array will contain short names.
 *  @param {string} dirpath - full path to directory
 *  @param {string} ext - extension without period (ex: js, png|gif)
 *  @param {function} callback - provide (err,files)=>{}
 */
function ReadFiles(dirpath, ext, cb) {
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
        TERM('ReadFiles debug (add callback to receive files)');
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
function PromiseReadFiles(dirpath, ext) {
  return new Promise((resolve, reject) => {
    ReadFiles(dirpath, ext, (err, files) => {
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
function DirectoryExists(filepath) {
  try {
    const stat = FSE.statSync(filepath);
    if (stat.isFile()) {
      console.warn(
        'DirectoryExists: Passed path is a file, not a directory',
        filepath
      );
      return false;
    }
    return stat.isDirectory();
  } catch (e) {
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
/** return array of filenames */
function GetFilesInDirectory(dirpath) {
  if (!DirectoryExists(dirpath)) {
    console.warn(`${dirpath} is not a directory`);
    return undefined;
  }
  const items = FSE.readdirSync(dirpath);
  const files = [];
  for (let item of items) {
    let path = Path.join(dirpath, item);
    const stat = FSE.lstatSync(path);
    // eslint-disable-next-line no-continue
    if (stat.isDirectory()) continue;
    files.push(item);
  }
  return files;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** 	Based on http://stackoverflow.com/questions/25460574/ */
function GetPrefixedFilesInDirectory(dirpath) {
  const files = GetFilesInDirectory(dirpath);
  const recfiles = [];
  if (files === undefined) return undefined;
  let count = 0;
  let highest = 0;
  for (const f of files) {
    const seqnum = IsRecorderFilepath(f);
    if (seqnum) {
      count++;
      highest = Math.max(seqnum, highest);
      recfiles.push(f);
    }
  }
  return {
    count,
    highest,
    files: recfiles
  };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns TRUE if the passed filename is a 'recorder' file, which looks
 *  like 234-description.rec
 *  @param {string} filepath - a filename string
 *  @return {number} sequence number if is matched type, or undefined if not
 */
function IsRecorderFilepath(filepath) {
  // NNN-abcd.rec
  const regex = /^(?<seq>\d{4})-.*\.rec/;
  const m = filepath.exec(regex);
  return m.groups.seq;
}

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { ReadFiles, PromiseReadFiles, GetFilesInDirectory };
