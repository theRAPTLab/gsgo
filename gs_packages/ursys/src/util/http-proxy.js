/* eslint-disable @typescript-eslint/no-shadow */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  String Helper Utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const Path = require('path');
//
const PROMPTS = require('./prompts');
const FILE = require('./files');
const MFEST = require('./manifest');
const UHTTP = require('./http');
const DCOD = require('./decoders');
const {
  GS_ASSETS_PATH,
  GS_ASSET_HOST_URL,
  GS_ASSETS_ROUTE,
  GS_MANIFEST_FILENAME
} = require('../../../../gsgo-settings');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = PROMPTS.makeTerminalOut('U-PROXY', 'TagBlue');
const DBG = true;
const INFO = true;
let ASSETS_SAVEPATH = GS_ASSETS_PATH;

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
    const remoteDirExists = await UHTTP.HTTPResourceExists(url);
    if (!remoteDirExists) {
      TERM(`SKIP PROXY: ${url} does not exist on host`);
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
      // was the manifest a file? then also write it to dir
      if (Array.isArray(json)) {
        // only read the first loaded manifest
        json = json.shift();
        const mpath = Path.join(path, `${GS_MANIFEST_FILENAME}.json`);
        FILE.EnsureDirectory(path);
        FILE.WriteJSON(mpath, json, err => {
          if (err) TERM('error:', err);
        });
      }
      // if we got this far, then we have a good manifest json
      const assets = MFEST.ExtractResourceUrls(json);
      const promises = [];
      const f_err = err => {
        if (err) TERM('err proxy dl', err);
      };
      for (const asset of assets) {
        const remoteUrl = `${url}${asset}`;
        const newPath = `${path}/${asset}`;
        promises.push(UHTTP.DownloadUrlToPath(remoteUrl, newPath, f_err));
      }
      //
      //
      await Promise.all(promises);
      //
      //
      next();
      return;
    }

    // if got this far, it's a regular file to download
    UHTTP.DownloadUrlToPath(url, path, err => {
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
