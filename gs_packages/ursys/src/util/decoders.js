/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Various decoding utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const Path = require('path');
const { URL } = require('url');
const PROMPTS = require('./prompts');
const NORM = require('./normalize');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = PROMPTS.makeTerminalOut('U-DECODE');

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
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
  baseRoute = NORM.TrimPath(baseRoute);
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

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  DecodeRequest,
  DecodePath
};
