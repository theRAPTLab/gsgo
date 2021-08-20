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
const FILE = require('./files');
const {
  GS_ASSETS_PATH,
  GS_ASSET_HOST_URL,
  GS_ASSETS_ROUTE
} = require('../../../../gsgo-settings');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = PROMPTS.makeTerminalOut('U-HTTP', 'TagBlue');
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
 *  NOTES: URL parsing in Node with URL() and Express Requests is a minefield.
 *  Express:
 *    req.url = this is the 'target', not including the express route
 *    req.originalURL = this is the url including the express route
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
  const baseURL = `${req.protocol}://${req.headers.host}${hostRoute}`;
  const fullURL = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
  const host = req.headers.host;
  // note: req.originalURL = this is the url INCLUDING the route
  // req.url, by comparison, omits the route
  const { pathname, searchParams } = new URL(req.url, baseURL);
  const basename = Path.basename(pathname);
  const extname = Path.extname(pathname);
  return {
    // given req to http://domain.com/path/to/name?foo=12&bar
    baseURL, // http://domain.com/route
    fullURL, // http://domains.com/route/path/base
    pathname, // we want /path/base
    basename, // we want base
    extname, // we want ext of base if it exists
    host, // we want domain.com
    searchParams // [SearchParameterObject]
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a path or url, guess if it's a directory or a file based on whether
 *  it has an extension or not
 */
function DecodePath(path) {
  const basename = Path.basename(path);
  const extname = Path.extname(path);
  const dirname = Path.dirname(path);
  return {
    isDir: extname.length === 0,
    isFile: extname.length > 0,
    dirname,
    basename,
    extname
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return true if the url returns OK or exists
 *  call using async/await syntax
 */
async function HTTPResourceExists(url) {
  const { ok } = await fetch(url, { method: 'HEAD' });
  return ok;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a url, attempts to download the file to server/mediacache directory
 *  and calls cb() falsey on success (via file.close())
 */
async function u_Download(url, path, cb) {
  //  TERM('download pathInfo:', JSON.stringify(pathInfo, null, 2));
  const pathInfo = DecodePath(path);
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

/// EXPRESS MIDDLEWARE ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** if file doesn't exist, then attempt to proxy the predefined ASSET_HOST
 *  that distributes assets to servers. This middleware should be added
 *  after Express.static()
 */
async function ProxyMedia(req, res, next) {
  // create pathname elements from url querystring
  const { pathname, basename } = DecodeRequest(req);
  let saveroot = Path.resolve(ASSETS_SAVEPATH);
  let mediapath = Path.normalize(Path.dirname(pathname));
  let filename = basename;
  // construct path to local asset directory
  let path = Path.join(saveroot, mediapath, filename);
  // if file already exists locally, we don't need to proxy anything
  if (FILE.FileExists(path)) {
    TERM(`file ${path} exists, no need to proxy`);
    next();
    return;
  }
  // construct remote asset location
  const url = `${GS_ASSET_HOST_URL}/${GS_ASSETS_ROUTE}${pathname}`;
  if (DBG) TERM(`ProxyMedia: ${url} to ${path}`);

  try {
    const resExists = await HTTPResourceExists(url);
    if (!resExists) {
      TERM(`SKIP PROXY: ${url} does not exist on host`);
      next();
      return;
    }
    // if this is a directory, then let's download the entire manifest
    if (DecodePath(path).isDir) {
      let manifest = await fetch(`${url}?manifest`).then(res => res.json());
      if (Array.isArray(manifest)) manifest = manifest.shift();
      TERM('read manifest', JSON.stringify(manifest, null, 2));
      TERM('* download files here, in meantime bailing though next()');
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
        if (DBG) TERM(`... copied '${pathname}'`);
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
  GetIPV4,
  DecodeRequest,
  DecodePath,
  ProxyMedia,
  HTTPResourceExists,
  TrimPath
};
