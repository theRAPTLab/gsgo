/* eslint-disable @typescript-eslint/no-shadow */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  String Helper Utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const Path = require('path');
const IP = require('ip');
const FSE = require('fs-extra');
const fetch = require('node-fetch').default;
const { URL } = require('url');
//
const PROMPTS = require('./prompts');
const { EnsureDirectory } = require('./files');
const {
  GS_ASSETS_PATH,
  GS_ASSET_HOST_URL,
  GS_ASSETS_ROUTE
} = require('../../../../gsgo-settings');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = PROMPTS.makeTerminalOut('U-HTTP', 'TagGreen');
const DBG = true;
let ASSETS_SAVEPATH = GS_ASSETS_PATH;

/// IP ADDRESS UTILITIES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a web request, dig out the ip address and return it
 */
function GetIPV4(req) {
  // using the req object returns localhost, which isn't useful
  let ip4client = req.ip.substr(req.ip.lastIndexOf(':') + 1);
  if (ip4client === 1) ip4client = '127.0.0.1';
  // ip module returns better address!
  let ip4server = IP.address();
  return { local: ip4client, server: ip4server };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a string '//a//a//aaa/', returns 'a/a/aaa'
 */
function TrimPath(p = '') {
  p = Path.join(p); // remove any duped /
  while (p.indexOf('/') === 0) p = p.slice(1); // remove leading /
  while (p.lastIndexOf('/') === p.length - 1) p = p.slice(0, -1); // remove trailing /
  return p;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a request to an express server, extract stuff from the URL
 */
function DecodeRequest(baseRoute = '', req) {
  if (typeof baseRoute !== 'string') {
    req = baseRoute;
    baseRoute = '';
  }
  baseRoute = TrimPath(baseRoute);
  if (typeof req !== 'object') {
    TERM('error: arg1 should be route, arg2 should be request objets');
    return undefined;
  }
  const hostRoute = baseRoute === '' ? '' : `/${baseRoute}`;
  const hostURL = `${req.protocol}://${req.headers.host}${hostRoute}`;
  const fullURL = `${req.protocol}://${req.headers.host}${req.url}`;
  const host = req.headers.host;
  const { pathname, searchParams } = new URL(fullURL, hostURL);
  const basename = Path.basename(pathname);
  return {
    // given req to http://domain.com/path/to/name?foo=12&bar
    hostURL, // http://domain.com/route
    fullURL, // http://domains.com/route/path/base
    pathname, // route/path/base
    basename, // base
    host, // domain.com
    searchParams // [SearchParameterObject]
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a url, attempts to download the file to server/mediacache directory
 *  and calls cb() falsey on success (via file.close())
 */
async function u_Download(url, path, cb) {
  const dirname = Path.dirname(path);
  if (!EnsureDirectory(dirname)) {
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

/// EXPRESS MIDDLEWARE ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** if file doesn't exist, then attempt to proxy the predefined ASSET_HOST
 *  that distributes assets to servers. This middleware should be added
 *  after Express.static()
 */
function ProxyMedia(req, res, next) {
  // create pathname elements from url querystring
  const { pathname, basename } = DecodeRequest(req);
  let saveroot = Path.resolve(ASSETS_SAVEPATH);
  let mediapath = Path.normalize(Path.dirname(pathname));
  let filename = basename;
  let path = Path.join(saveroot, mediapath, filename);
  const url = `${GS_ASSET_HOST_URL}/${GS_ASSETS_ROUTE}${pathname}`;
  if (DBG) TERM(`ProxyMedia: ${url}`);
  u_Download(url, path, err => {
    if (err) next();
    // download failed, so next middleware
    else {
      if (DBG) TERM(`... copied '${pathname}'`);
      res.sendFile(path, err => {
        if (err) TERM('proxy send error:', err);
      });
    }
  });
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  GetIPV4,
  DecodeRequest,
  ProxyMedia
};
