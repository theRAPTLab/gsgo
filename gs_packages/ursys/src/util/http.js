/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  variout HTTP utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const fetch = require('node-fetch').default;
const FSE = require('fs-extra');
const PROMPTS = require('./prompts');
const FILE = require('./files');
const DCOD = require('./decoders');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = PROMPTS.makeTerminalOut('U-HTTP', 'TagBlue');
const DBG = false;

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return true if the url returns OK or exists
 *  call using async/await syntax
 */
async function HTTPResourceExists(url) {
  try {
    const { ok } = await fetch(url, { method: 'HEAD' });
    return ok;
  } catch (e) {
    return false;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a url, attempts to download the file to server/mediacache directory
 *  and calls cb() falsey on success (via file.close())
 */
async function DownloadUrlToPath(url, path, cb) {
  //  TERM('download pathInfo:', DCOD.FString(pathInfo));
  const pathInfo = DCOD.DecodePath(path);
  const { dirname } = pathInfo;
  // got this far? we have a file!
  if (!FILE.EnsureDirectory(dirname)) {
    TERM(`WARNING: could not ensure dir '${dirname}'. Aborting`);
    return;
  }
  try {
    // prepare to download and write file
    await fetch(url).then(res => {
      if (res.ok) {
        let file = FSE.createWriteStream(path);
        file.on('finish', () => {
          cb();
          if (DBG) TERM('success dl:', path);
        });
        res.body.pipe(file);
        return;
      }
      if (cb) cb(`Request error: ${url}`);
    });
  } catch (e) {
    if (cb) cb('fetch failed');
  }
  // detect end of file
}

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  HTTPResourceExists,
  DownloadUrlToPath
};
