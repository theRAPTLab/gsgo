/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  File System Helpers

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ndir = require('node-dir');

const TERM = require('./prompts').makeTerminalOut('  URFS', 'TagGreen');

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
  ndir.readFiles(
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

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { ReadFiles, PromiseReadFiles };
