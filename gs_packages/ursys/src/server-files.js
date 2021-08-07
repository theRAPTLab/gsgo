/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS File System Services
  Used for file-based storage

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const path = require('path');
const ndir = require('node-dir');
const hasha = require('hasha');
const { CFG_SVR_UADDR } = require('./ur-common');

const TERM = require('./util/prompts').makeTerminalOut('  URFS', 'TagGreen');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// const DBG = false;

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PKT_ExamplePacketCommand(pkt) {
  return { results: 'return data' };
}

/// TEST METHODS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestFileList() {
  const dir = path.resolve(__dirname);
  (async () => {
    TERM('listing dir:', dir);
    const files = await ndir.promiseFiles(dir);
    files.forEach(file => {
      TERM(path.basename(file));
    });
  })();
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  PKT_ExamplePacketCommand
};
