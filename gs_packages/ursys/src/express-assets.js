/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS ASSET SERVER MIDDLEWARE

  Defines middleware for implementing asset services. This can either be
  a "local asset server" for a local network, or a "asset host server" which
  is a remote server that distributes files.

  Example Local Asset Server (from gem-app-srv)

  app.use(
    '/assets',
    UR.AssetManifest_Middleware({
      assetPath: GS_ASSETS_PATH,
      remoteAssetUrl: GS_ASSET_HOST_URL
    }),
    Express.static(GS_ASSETS_PATH),
    UR.MediaProxy_Middleware({ remoteAssetUrl: GS_ASSET_HOST_URL }),
    ServeIndex(GS_ASSETS_PATH, { 'icons': true })
  );

  Example Asset Host Server (from mcp-srv)
  the only difference is a different assetpath

  const assetPath = GS_ASSET_HOST_PATH;
  app.use(
    '/assets',
    UR.AssetManifest_Middleware({ assetPath }), // should be gs_assets_hosted
    Express.static(assetPath),
    ServeIndex(assetPath, { 'icons': true })
  );

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROXY = require('./util/http-proxy');
const MFEST = require('./util/manifest');
const PROJFILE = require('./util/projfile');
const PROMPTS = require('./util/prompts');
const {
  GS_ASSETS_PATH,
  GS_ASSETS_PROJECT_ROOT
} = require('../../../gsgo-settings');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = PROMPTS.makeTerminalOut('ASSETS', 'TagGreen');

/// MIDDLEWARE DEFINITION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Handles manifest deliver when a directory is requests with ?manifest query.
 *  If a manifest file exists, it is served. If there is no manifest file,
 *  the file directories are walked to generate the manifest automatically.
 *  If the manifest does not exist
 *  @param {object} options.assetPath the full path to asset directory
 *  @param {object} options.remoteAssetUrl the base URL of asset directory of remote
 *  @example usage: app.use('/asset/path',AssetManifestMiddleware( options ),...)
 */
function AssetManifest_Middleware(options = {}) {
  const { assetPath = GS_ASSETS_PATH, remoteAssetUrl } = options;
  return (req, res, next) => {
    MFEST.SetAssetPath(assetPath);
    MFEST.SetRemoteAssetUrl(remoteAssetUrl);
    MFEST.DeliverManifest(req, res, next);
  };
}

/// MIDDLEWARE DEFINITION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AssetUpdate_Middleware(options = {}) {
  const {
    assetPath = GS_ASSETS_PATH,
    projectRoot = GS_ASSETS_PROJECT_ROOT,
    remoteAssetUrl
  } = options;
  return (req, res, next) => {
    const projId = req.params.projId;
    const body = req.body;
    PROJFILE.SetAssetPath(assetPath);
    PROJFILE.SetProjectRoot(projectRoot);
    PROJFILE.WriteProject(body, result => {
      if (result) res.status(500).send(`WriteProject Error: ${result}`);
      else res.status(200).send({ result: 'Saved' });
    });
  };
}

/// MIDDLEWARE DEFINITION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** checks a remote server that implements AssetManifest_Middleware with static
 *  file serving and downloads the resource. This should be added after
 *  Express.static but before index serving.
 *  @param {object} options.remoteAssetUrl the remote asset host to check for
 *  resources. If the remote resource appears to be a directory, it looks for a
 *  manifest file and downloads all of those files before serving.
 *  @example app.use('/asset/path, ..., MediaProxyMiddleware( options ), ...)
 */
function MediaProxy_Middleware(options = {}) {
  const { remoteAssetUrl } = options;
  if (remoteAssetUrl === undefined) {
    TERM('NO MEDIAHOST DEFINED: proxied media is disabled');
    return (req, res, next) => next();
  }
  return (req, res, next) => {
    PROXY.ProxyMedia(req, res, next);
  };
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  AssetManifest_Middleware,
  AssetUpdate_Middleware,
  MediaProxy_Middleware
};
