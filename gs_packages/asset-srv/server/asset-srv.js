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
const CookieP = require('cookie-parser');
const { UseLokiGQL_Middleware, PrefixUtil } = require('@gemstep/ursys/server');
const { PACKAGE_NAME, ASSETS_PATH } = require('../config/asrv.settings');

/// LOAD LOCAL MODULES ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const resolvers = require('../config/graphql/resolvers');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PrefixUtil(PACKAGE_NAME);
const PORT = 8080;
const GSGO_ASSETPATH = Path.resolve(__dirname, '../../..', ASSETS_PATH);
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
  console.log(...PR(`... will serve from ${GSGO_ASSETPATH}`));

  // basic express middleware
  app.use(Compression());
  app.use(CookieP());
  app.use(CORS());

  app.get('/', (req, res) => {
    res.send('GEMSTEP Asset Server 0.1');
  });
  app.get('/assets', CORS(), (req, res) => {
    res.json({ msg: 'CORS-enabled for /assets' });
  });

  // start GraphQL server because why not
  UseLokiGQL_Middleware(app, {
    dbFile: 'runtime/db.loki',
    dbImportFile: 'config/graphql/dbinit-loki.json',
    doReset: false,
    schemaFile: 'config/graphql/schema.graphql',
    root: resolvers
  });

  // start listening
  m_AppListen(opt);
}

/// MODULE EXPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { StartAssetServer, PORT };
