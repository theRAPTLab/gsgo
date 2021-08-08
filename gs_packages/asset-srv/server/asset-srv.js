/* eslint-disable global-require */
/*/////////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GEMSTEP ASSET SERVER

  Creates a "hot compiling/reloading" application servers that uses webpack
  as middleware. This is advantageous when debugging a webapp that's served
  from inside an Electron host.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ///////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
const UR = require('@gemstep/ursys/server');
const Express = require('express'); //your original BE server
const Compression = require('compression');
const CORS = require('cors');
const Path = require('path');
const IP = require('ip');
const FSE = require('fs-extra');
const { URL } = require('url');
const CookieP = require('cookie-parser');
const ServeIndex = require('serve-index');
const {
  PACKAGE_NAME,
  PUBLIC_RESOURCES_PATH,
  MANIFEST_NAME
} = require('../config/asrv.settings');

const DBG = true;

/// LOAD LOCAL MODULES ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const resolvers = require('../config/graphql/resolvers');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil(PACKAGE_NAME);
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
  FSE.ensureDirSync(Path.join(GSGO_HTDOCS));
  const INDEX_TEXT = `GEMSTEP ASSET SERVER (${PACKAGE_NAME})`;
  const INDEX_SEND = Path.join(GSGO_HTDOCS, '_serverId.txt');
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

  // handle /assets in several ways
  // (1) detect manifest request
  // (2) enable index serving for debugging
  // (3) enable stalkatic file serving
  app.use(
    '/assets',
    async (req, res, next) => {
      // (1) determine urlbits
      const baseURL = `${req.protocol}://${req.headers.host}`;
      const fullURL = `${baseURL}${req.originalUrl}`;
      const { pathname, searchParams } = new URL(fullURL, baseURL); // warn: this is not an iterable nodejs.org/api/url.html

      // (2) if has ?manifest query, do special processing
      if (searchParams.has('manifest')) {
        console.log(...PR(`requested manifest for: '${pathname}'`));
        // (A) is this a directory?
        const dirpath = Path.join(GSGO_HTDOCS, req.path);
        if (!UR.FILE.IsDirectory(dirpath)) {
          console.log('NOT DIR:', dirpath);
          next();
          return;
        }
        // (B) retrieve all top-level files of directory
        console.log('MANIFEST DIR OK:', dirpath);
        const mfile = `${Path.join(dirpath, MANIFEST_NAME)}.json`;
        const allfiles = UR.FILE.GetFilenamesInDir(dirpath);
        // (C) filter for manifest files
        const manifests = allfiles
          .filter(f => f.startsWith(MANIFEST_NAME) && f.endsWith('.json'))
          .sort();
        // (D) no manifest file(s)? MAKE ONE from directory contents
        if (!UR.FILE.FileExists(mfile) && manifests.length === 0) {
          console.log('no manifest file(s) found in dir, so generating');
          // (E) gather information about each media file
          const promises = [];
          const mediafiles = allfiles.filter(f => UR.FILE.HasMediaExt(f));
          for (const f of mediafiles) {
            const path = Path.join(dirpath, f);
            promises.push(UR.FILE.PromiseFileHash(path));
          }
          const filesInfo = await Promise.all(promises);
          // (F) generate manifest
          let counter = 1000;
          const media = [];
          for (let info of filesInfo) {
            const assetId = counter++;
            const { filename, ext: assetType, hash } = info;
            const asset = {
              assetId,
              assetName: filename,
              assetUrl: `${pathname}/${filename}`,
              assetType,
              hash
            };
            media.push(asset);
          }
          const manifest = { media };
          res.json(manifest);
        } else {
          // (D) yay manifest files
          for (let mf of manifests) console.log('manifest:', mf);
        }
      } else {
        console.log(...PR(`requested asset for: '${pathname}'`));
        next();
      }
    },
    ServeIndex(GSGO_HTDOCS, { 'icons': true }),
    Express.static(GSGO_HTDOCS)
  );

  // start server listening for http at port
  m_AppListen(opt);
}

/// MODULE EXPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { StartAssetServer, PORT };
