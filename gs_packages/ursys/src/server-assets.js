/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS ASSET SERVER MIDDLEWARE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROXY = require('./util/http-proxy');
const MFEST = require('./util/manifest');
const PROMPTS = require('./util/prompts');
const { GS_ASSETS_PATH } = require('../../../gsgo-settings');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = PROMPTS.makeTerminalOut('ASSETS', 'TagGreen');

/// SUPPORT METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MIDDLEWARE DEFINITION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
module.exports = { AssetManifest_Middleware, MediaProxy_Middleware };
