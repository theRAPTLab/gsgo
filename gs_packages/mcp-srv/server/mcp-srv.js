/* eslint-disable global-require */
/*/////////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GEMSTEP MAIN CONTROL PROGRAM SERVER

  This is a standalone server that:
  * runs on the GS_ASSETS_PORT and serves from the GS_ASSETS_DESTRIB_PATH. This
    is intended to be the 'master asset server' that local servers (like the
    GEMSTEP App Server) will query if it doesn't have those assets stored
    locally.
  * eventually will provide net-wide authentication and other services

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ///////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
const UR = require('@gemstep/ursys/server');
const Express = require('express'); //your original BE server
const Compression = require('compression');
const CORS = require('cors');
const Path = require('path');
const IP = require('ip');
const FSE = require('fs-extra');
const CookieP = require('cookie-parser');
const ServeIndex = require('serve-index');
const {
  PACKAGE_NAME,
  GS_ASSETS_HOST_PATH, // gsgo media distrib for master asset servers
  GS_ASSETS_PORT
} = require('../config/mcp-settings');

/// LOAD LOCAL MODULES ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const resolvers = require('../config/graphql/resolvers');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = UR.TermOut(PACKAGE_NAME);
const PORT = GS_ASSETS_PORT || 8080;
let m_server; // server instance; check if unset before launching

/// SERVER DECLARATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const app = Express();
const ip = `\x1b[33m${IP.address()}\x1b[0m`;
const port = `\x1b[33m${PORT}\x1b[0m`;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// After webapp is compiled, start the Express web server
function m_AppListen(opt = {}) {
  if (!m_server) {
    m_server = app.listen(PORT, () => {
      TERM(`Asset Server listening to: ${ip}:${port}`);
    });
  }

  process.on('SIGINT', () => {
    TERM('SIGINT signal received: closing HTTP server');
    m_server.close(() => {
      TERM('HTTP server closed');
      process.exit();
    });
  });
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Start the express webserver on designated PORT
 */
function StartAssetServer(options = {}) {
  const assetPath = options.assetPath || GS_ASSETS_HOST_PATH;
  TERM('Starting Asset Server [async]');
  TERM(`... will use port ${port} at ${ip}`);
  TERM(`... will serve from ${assetPath}`);

  // make sure asset server document path exists
  // and write an index file there
  FSE.ensureDirSync(Path.join(assetPath));
  const INDEX_TEXT = `${PACKAGE_NAME} - GEMSTEP MAIN CONTROL PROGRAM HOST `;
  const INDEX_SEND = Path.join(assetPath, '_serverId.txt');
  FSE.writeFileSync(INDEX_SEND, INDEX_TEXT);

  // basic express middleware
  app.use(Compression());
  app.use(CookieP());
  app.use(CORS());

  // start GraphQL server because why not
  UR.UseLokiGQL_Middleware(app, {
    dbFile: 'runtime/db.loki',
    dbImportFile: 'config/graphql/dbinit-loki.json',
    doReset: false,
    schemaFile: 'config/graphql/schema.graphql',
    root: resolvers
  });

  // intercept / and always return INDEX_SEND
  app.get('/', (req, res) => {
    res.sendFile(INDEX_SEND);
  });

  // set up /assets manifest, index, media, mediaproxy
  app.use(
    '/assets',
    UR.AssetManifest_Middleware({ assetPath }), // should be gs_assets_hosted
    Express.static(assetPath),
    // UR.MediaProxy_Middleware({}) // asset host servers do not proxy
    ServeIndex(assetPath, { 'icons': true })
  );

  // start server listening for http at port
  m_AppListen(options);
}

/// MODULE EXPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { StartAssetServer, PORT };
