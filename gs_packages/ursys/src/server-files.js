/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS File System Services
  Used for file-based storage

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Path = require('path');
const Ndir = require('node-dir');
const hasha = require('hasha');
const FSE = require('fs-extra');
const URFS = require('./util/fs-helper');
const { CFG_SVR_UADDR } = require('./ur-common');

const TERM = require('./util/prompts').makeTerminalOut('  URFS', 'TagGreen');

const { DirectoryExists } = URFS;

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return array of filenames */
function GetFilenamesInDir(dirpath) {
  if (!DirectoryExists(dirpath)) {
    console.warn(`${dirpath} is not a directory`);
    return undefined;
  }
  const filenames = FSE.readdirSync(dirpath);
  const files = [];
  for (let name of filenames) {
    let path = Path.join(dirpath, name);
    const stat = FSE.lstatSync(path);
    // eslint-disable-next-line no-continue
    if (stat.isDirectory()) continue;
    files.push(name);
  }
  return files;
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
  const files = GetFilenamesInDir(dirpath);
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
async function PromiseFileHash(filepath) {
  const hash = await hasha.fromFile(filepath, { algorithm: 'md5' });
  const { base: filename, ext } = Path.parse(filepath);
  return { filepath, filename, ext, hash };
}

/// TEST METHODS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestFileList() {
  const dir = Path.resolve(__dirname);
  (async () => {
    TERM('listing dir:', dir);
    const files = await Ndir.promiseFiles(dir);
    files.forEach(file => {
      TERM(Path.basename(file));
    });
  })();
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ...URFS,
  PromiseFileHash,
  GetFilenamesInDir,
  RecordingsInDirectory,
  TestFileList
};
