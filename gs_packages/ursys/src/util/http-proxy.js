/* eslint-disable @typescript-eslint/no-shadow */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  String Helper Utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const Path = require('path');
const FSE = require('fs-extra');
const fetch = require('node-fetch').default;
//
const PROMPTS = require('./prompts');
const FILE = require('./files');
const MFEST = require('./manifest');
const UHTTP = require('./http');
const DCOD = require('./decoders');
const {
  GS_ASSETS_PATH,
  GS_ASSET_HOST_URL,
  GS_ASSETS_ROUTE
} = require('../../../../gsgo-settings');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = PROMPTS.makeTerminalOut('U-PROXY', 'TagBlue');
const DBG = true;
const INFO = true;
let ASSETS_SAVEPATH = GS_ASSETS_PATH;

/// IP ADDRESS UTILITIES //////////////////////////////////////////////////////

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a url, attempts to download the file to server/mediacache directory
 *  and calls cb() falsey on success (via file.close())
 */
async function u_Download(url, path, cb) {
  //  TERM('download pathInfo:', JSON.stringify(pathInfo, null, 2));
  const pathInfo = DCOD.DecodePath(path);
  const { dirname } = pathInfo;
  // got this far? we have a file!
  if (!FILE.EnsureDirectory(dirname)) {
    TERM(`WARNING: could not ensure dir '${dirname}'. Aborting`);
    return;
  }
  // prepare to download and write file
  await fetch(url).then(res => {
    if (res.ok) {
      let file = FSE.createWriteStream(path);
      file.on('finish', () => cb());
      res.body.pipe(file);
      return;
    }
    if (cb) cb(`Request error: ${url}`);
  });
  // detect end of file
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** extract list of urls to download from a manifest, return as array of
 *  url strings
 */
function u_ExtractResourceUrls(manifest) {}

/// EXPRESS MIDDLEWARE ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** if file doesn't exist, then attempt to proxy the predefined ASSET_HOST
 *  that distributes assets to servers. This middleware should be added
 *  after Express.static()
 */
async function ProxyMedia(req, res, next) {
  // create pathname elements from url querystring
  const { pathname, basename } = DCOD.DecodeRequest(req);
  let saveroot = Path.resolve(ASSETS_SAVEPATH);
  let mediapath = Path.normalize(Path.dirname(pathname));
  let filename = basename;
  // construct path to local asset directory
  let path = Path.join(saveroot, mediapath, filename);
  // if file already exists locally, we don't need to proxy anything
  if (FILE.FileExists(path)) {
    if (INFO) TERM(`file ${path} exists, no need to proxy`);
    next();
    return;
  }
  // construct remote asset location
  const url = `${GS_ASSET_HOST_URL}/${GS_ASSETS_ROUTE}${pathname}`;
  if (INFO) TERM(`ProxyMedia: ${url} to ${path}`);

  try {
    const resExists = await UHTTP.HTTPResourceExists(url);
    if (!resExists) {
      if (DBG) TERM(`SKIP PROXY: ${url} does not exist on host`);
      next();
      return;
    }
    // if this is a directory, then let's download the entire manifest
    if (DCOD.DecodePath(path).isDir) {
      let json = await MFEST.ReadManifest(url);
      if (!json) {
        TERM('manifest', url, 'could not be read');
        next();
        return;
      }
      // if we got this far, then we have a good manifest json
      const resUrls = u_ExtractResourceUrls(json);

      // iterate over manifest
      const assetLists = Object.entries(json);
      for (let list of assetLists) {
        for (let item of list) {
          //
        }
      }
      next();
      return;
    }

    // if got this far, it's a regular file to download
    u_Download(url, path, err => {
      if (err) {
        TERM('download error', err);
        next();
      }
      // download failed, so next middleware
      else {
        if (INFO) TERM(`... copied '${pathname}'`);
        res.sendFile(path, err => {
          if (err) TERM('proxy send error:', err);
        });
      }
    });
  } catch (e) {
    TERM('ERROR:', e);
  }
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ProxyMedia
};
