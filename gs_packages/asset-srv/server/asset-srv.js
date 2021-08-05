/* eslint-disable global-require */
/*/////////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GEMSTEP ASSET SERVER

  Creates a "hot compiling/reloading" application servers that uses webpack
  as middleware. This is advantageous when debugging a webapp that's served
  from inside an Electron host.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ///////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
const Express = require('express'); //your original BE server
const Compression = require('compression');
const CORS = require('cors');
const Path = require('path');
const IP = require('ip');
const FSE = require('fs-extra');
const CookieP = require('cookie-parser');
const ServeIndex = require('serve-index');
const { UseLokiGQL_Middleware, PrefixUtil } = require('@gemstep/ursys/server');
const {
  PACKAGE_NAME,
  PUBLIC_RESOURCES_PATH
} = require('../config/asrv.settings');

/// LOAD LOCAL MODULES ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const resolvers = require('../config/graphql/resolvers');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PrefixUtil(PACKAGE_NAME);
const PORT = 8080;
const GSGO_HTDOCS = Path.resolve(__dirname, '../../..', PUBLIC_RESOURCES_PATH);
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
      console.log(...PR(`Asset Server listening to: ${ip}:${port}`));
    });
  }
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Start the express webserver on designated PORT
 */
function StartAssetServer(opt = {}) {
  console.log(...PR('Starting Asset Server [async]'));
  console.log(...PR(`... will use port ${port} at ${ip}`));
  console.log(...PR(`... will serve from ${GSGO_HTDOCS}`));

  // make sure asset server document path exists
  // and write an index file there
  FSE.ensureDirSync(Path.join(GSGO_HTDOCS, 'assets'));
  const INDEX_TEXT = `GEMSTEP ASSET SERVER (${PACKAGE_NAME})`;
  const INDEX_HTML = Path.join(GSGO_HTDOCS, '_serverId.txt');
  FSE.writeFileSync(INDEX_HTML, INDEX_TEXT);

  // basic express middleware
  app.use(Compression());
  app.use(CookieP());
  app.use(CORS());

  // start GraphQL server because why not
  UseLokiGQL_Middleware(app, {
    dbFile: 'runtime/db.loki',
    dbImportFile: 'config/graphql/dbinit-loki.json',
    doReset: false,
    schemaFile: 'config/graphql/schema.graphql',
    root: resolvers
  });

  app.get('/', (req, res) => {
    res.sendFile(INDEX_HTML);
  });
  // enable CORS for assets path
  app.use('/assets', CORS());
  // serve files from /assets with index
  app.use(ServeIndex(GSGO_HTDOCS, { 'icons': false }));

  // start server listening for http at port
  m_AppListen(opt);
}

/// MODULE EXPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { StartAssetServer, PORT };
