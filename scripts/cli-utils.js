/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A collection of utilities to help clone elements from this repo into a
  mirror directory to make derivative projects.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const FS = require('fs-extra');
const PATH = require('path');
const SHELL = require('shelljs');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let IS_SIM = true;

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** execute an operation only if IS_SIM is false
 *  @param {function} func - function to execute if IS_SIM is false
 */
function m_Execute(func) {
  if (!IS_SIM) func();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** begin the session by emitting provided text and setting global options
 *  @param {string} message - message to print
 *  @param {object} options - configuration obj
 *  @param {object.boolean} sim - flag to simulate operations only
 */
function SessionStart(message, options = { sim: true }) {
  IS_SIM = options.sim;
  if (IS_SIM) {
    console.log('\n*** SIM MODE: NO FILES WILL BE CREATED OR MODIFIED ***\n');
  }
  console.log(`starting session: '${message}'...`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** end the session, emitting provided text and reminders\
 *  @param {string} message - message to print
 */
function SessionEnd(message) {
  console.log(`closing session: '${message}'`);
  if (IS_SIM) {
    console.log('\n*** SIM MODE: NO FILES WERE CREATED/MODIFIED ***');
  }
  console.log("\nRemember to run 'lerna bootstrap' on destination!\n");
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** test that the provided path is a directory
 *  @param {string} path - path to alleged directory
 *  @returns {boolean} - true if path exists and is directory
 */
function DirectoryExists(path) {
  if (!FS.existsSync(path)) return false;
  const stats = FS.statSync(path);
  if (!stats.isDirectory()) return false;
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** test that path contains a lerna.json file (and therefore is probably a
 *  lerna monorepo)
 *  @param {string} path - path to alleged directory
 *  @returns {boolean} - falsey on failure, obj w/ lerna config otherwise
 */
function ParseLernaDirectory(path) {
  if (!DirectoryExists(path)) return false;
  try {
    const lernaJson = JSON.parse(FS.readFileSync(`${path}/lerna.json`, 'utf-8'));
    return lernaJson;
  } catch (e) {
    return false;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** copy directories/files from source path to destination path.
 *  @param {string} source - the source root path
 *  @param {string} dest - the destination root path
 *  @param {string[]} rpaths - relative paths to copy source and dest
 */
function CopyFiles(source, dest, rpaths) {
  console.log(`copy source: ${source}`);
  console.log(`copy dest  : ${dest}`);
  rpaths.forEach(relativePath => {
    try {
      const from = PATH.join(source, relativePath);
      const fromType = FS.statSync(from);
      // is a directory?
      if (fromType.isDirectory()) {
        const target = PATH.join(dest, relativePath, '..');
        m_Execute(() => FS.ensureDirSync(target));
        m_Execute(() => SHELL.cp('-Rf', from, target));
        console.log(`.. copy dir ${relativePath}`);
        return;
      }
      // is a file?
      if (fromType.isFile()) {
        const target = PATH.join(dest, relativePath);
        m_Execute(() => FS.ensureDirSync(PATH.dirname(target)));
        m_Execute(() => SHELL.cp(from, target));
        console.log(`.. copy file ${relativePath}`);
        return;
      }
      // it's neither?!?!
      console.log('** skipping unknown file stat');
    } catch (e) {
      console.log('** copy error', relativePath);
    }
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** remove the list of files/directories. Use only for destinations!
 *  @param {string} dir - base directory
 *  @param {string[]} rpaths - array of paths relative to base directory
 */
function RemoveFiles(dir, rpaths) {
  console.log(`rm basedir: ${dir}`);
  rpaths.forEach(relativePath => {
    try {
      const target = PATH.join(dir, relativePath);
      if (IS_SIM) {
        console.log(`.. removing ${target}`);
        return;
      }
      const targetType = FS.statSync(target);
      // is it a directory?
      if (targetType.isDirectory()) {
        if (!IS_SIM) m_Execute(() => SHELL.rm('-rf', target));
        console.log(`.. removing dir ${target}`);
        return;
      }
      // is it a file?
      if (targetType.isFile()) {
        if (!IS_SIM) m_Execute(() => SHELL.rm(target));
        console.log(`.. removing file ${target}`);
        return;
      }
      // it's neither?!?!
      console.log('** skipping unknown file stat');
    } catch (e) {
      console.log('** rm error', relativePath);
    }
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** rename/move the list of files
 *  @param {string} dir - base directory
 *  @param {Array[]} rpaths - array of [oldpath, newpath] strings
 */
function RenameFiles(dir, rpaths) {
  console.log(`mv basedir: ${dir}`);
  rpaths.forEach(([spath, dpath]) => {
    try {
      const from = PATH.join(dir, spath);
      const target = PATH.join(dir, dpath);
      const pstr = PATH.relative(from, target)
        .split('../')
        .join('');
      if (IS_SIM) {
        const f = PATH.basename(from);
        const t = PATH.basename(target);
        console.log(`.. moved ${f} to ${t}`);
        return;
      }
      const fromType = FS.statSync(from);
      // is it a directory?
      if (fromType.isDirectory()) {
        if (!IS_SIM) m_Execute(() => FS.ensureDirSync(PATH.join(target, '..')));
        if (!IS_SIM) m_Execute(() => SHELL.mv(from, target));
        //
        console.log(`.. moved dir ${pstr}`);
        return;
      }
      // is it a file?
      if (fromType.isFile()) {
        if (!IS_SIM) m_Execute(() => FS.ensureDirSync(PATH.dirname(target)));
        if (!IS_SIM) m_Execute(() => SHELL.mv(from, target));
        const pstr = PATH.relative(from, target)
          .split('../')
          .join('');
        console.log(`.. moved file ${pstr}`);
        return;
      }
      // it's neither?!?!
      console.log('** skipping unknown file stat');
    } catch (e) {
      console.log('** mv error', spath, dpath);
    }
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** copy properties from one json file to another
 *  @param {string} source - the path to source json file
 *  @param {string} dest - the path to dest json file (must exist!)
 *  @param {string[]} propNames - strings of property keys
 */
function CopyJsonProps(source, dest, propNames) {
  try {
    console.log(`json source: ${source}`);
    console.log(`json dest  : ${dest}`);
    const LPJ = JSON.parse(FS.readFileSync(source, 'utf-8'));
    const RPJ = JSON.parse(FS.readFileSync(dest, 'utf-8'));
    propNames.forEach(prop => {
      RPJ[prop] = LPJ[prop];
      console.log(`.. copy prop '${prop}'`);
    });
    const filename = PATH.basename(dest);
    m_Execute(() => FS.writeFileSync(dest, JSON.stringify(RPJ, null, '  ')));
    console.log(`.. wrote ${filename}`);
  } catch (e) {
    console.log('** CopyJsonProps: error parsing source or dest as JSON', e);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** scan a file/directory for strings to replace
 *  @param {string} dir - path to directory or file
 *  @param {regex} matchRE - filter regex for match (default match all)
 */
function ReplaceStrings(dir, matchRE = /.*/, search, replace) {
  console.log(`sed basedir: ${dir}`);
  const files = SHELL.find(dir).filter(file => {
    return file.match(matchRE);
  });
  console.log(`.. replacing '${search}' with '${replace}' in basedir`);
  files.forEach(file => {
    m_Execute(() => SHELL.sed('-i', search, replace, file));
    console.log(`.. sed ${PATH.basename(file)}`);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** scan a file for specific string, and emit a warning if it's found
 *  @param {string} file - path to file to scan
 *  @param {string} search - string to search for
 *  @param {string} warning - warning to emit
 */
function FlagStrings(file, search, warning) {
  const results = SHELL.grep(search, file);
  if (!results) return;
  const fname = PATH.basename(file);
  console.log('**');
  console.log(`** found string '${search}' in ${fname}`);
  console.log(`** ${warning}`);
  console.log('**');
}

/// COMMONJS EXPORT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  SessionStart,
  SessionEnd,
  DirectoryExists,
  ParseLernaDirectory,
  CopyFiles,
  CopyJsonProps,
  RemoveFiles,
  RenameFiles,
  FlagStrings,
  ReplaceStrings
};
