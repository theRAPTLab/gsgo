/* eslint-disable @typescript-eslint/no-shadow */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  String Helper Utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const Path = require('path');
const IP = require('ip');
const Hasha = require('hasha');
const FSE = require('fs-extra');
const { URL } = require('url');
//
const PROMPTS = require('./prompts');
const { EnsureDirectory, FileExists } = require('./files');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = PROMPTS.makeTerminalOut('U-HTTP', 'TagGreen');
const DBG = true;

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
/** given a url, attempts to download the file to server/mediacache directory
 *  and calls cb() falsey on success (via file.close())
 */
function u_Download(url, path, cb) {
  if (!EnsureDirectory(path)) return undefined;
  // prepare to download and write file
  let file = FSE.createWriteStream(path);
  let sendReq = Request.get(url)
    .on('error', err => {
      FSE.unlink(path);
      if (cb) cb(`Request ERROR: ${err.message}`);
    })
    .on('response', response => {
      if (response.statusCode !== 200) {
        if (cb) cb(`Response status was ${response.statusCode}`);
      }
    })
    .pipe(file);
  // detect end of file
  file.on('finish', () => {
    cb(); // if no error, then don't send anything to callback
  });
  return sendReq;
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
function DecodeRequest(route = '', req) {
  if (typeof route !== 'string') {
    req = route;
    route = '';
  }
  route = TrimPath(route);
  if (typeof req !== 'object') {
    TERM('error: arg1 should be route, arg2 should be request objets');
    return undefined;
  }
  const hostRoute = route === '' ? '' : `/${route}`;
  const hostURL = `${req.protocol}://${req.headers.host}${hostRoute}`;
  const fullURL = `${hostURL}${req.originalUrl}`;
  const host = req.headers.host;
  const { pathname, searchParams } = new URL(fullURL, hostURL);
  const basename = Path.basename(pathname);
  return {
    // given req to http://domain.com/path/to/name?foo=12&bar
    hostURL, // http://domain.com
    fullURL, // http://domains.com/path/to/name
    path: req.path, // path/to/name
    pathname, // path/to/name
    basename, // name
    host, // domain.com
    searchParams // [SearchParameterObject]
  };
}

/// EXPRESS MIDDLEWARE ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** app.use(ProxyMedia)
 *  the idea is that given a url that is expected to be in the home
 *  app server, it's fetched from a remote server
 */
function ProxyMedia(req, res, next) {
  // create pathname elements from url querystring
  const url = req.query.url; // expect a url=http://blah/mediafile query
  const { host, pathname, basename } = DecodeRequest(req);
  const hostpath = host;
  let filename = basename;
  let cachepath = Path.resolve(`${__dirname}/../mediacache`);
  let mediapath = Path.normalize(Path.dirname(pathname));
  // (1)
  // try to serve the file, if fail try to fetch and cache
  let path = `${cachepath}/${hostpath}${mediapath}/${filename}`;

  // try to catch mystery case where 0-length files are
  // written to cache. this is not a great way to do it
  // because synchronous calls block i/o.
  if (FileExists(path)) {
    let stat = FSE.statSync(path);
    if (stat.size === 0) {
      TERM('deleting unexpected zero-length file to force refetch');
      FSE.unlinkSync(path);
    }
  }

  // consider converting this to use Asynch
  // https://github.com/caolan/async
  res.sendFile(path, err => {
    if (err) {
      if (err.code === 'ECONNABORT' && res.statusCode === 304) {
        if (DBG) TERM('browser cache hit', `${hostpath}/.../${filename}`);
        return;
      }
      if (DBG) TERM('Fetching from', host, '...');
      u_Download(url, path, err => {
        if (err) {
          TERM('DOWNLOAD ERR', err);
        } else {
          if (DBG) TERM('Caching', filename, '...');
          res.sendFile(path, err => {
            if (err) {
              if (DBG) TERM('ERROR fetching', url, 'failed', err);
            } else if (DBG)
              console.log('cached fetch', `${hostpath}/.../${filename}`);
          });
        }
      });
    } else if (DBG) console.log('cached fetch', `${hostpath}/.../${filename}`);
  });
  //
  next();
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  GetIPV4,
  DecodeRequest,
  ProxyMedia
};
