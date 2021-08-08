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
const ASSET_ID_START = 100;
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
      // (0) output object
      const manifest = {};
      // (1) determine urlbits
      const baseURL = `${req.protocol}://${req.headers.host}/assets/`;
      const fullURL = `${req.protocol}://${req.originalUrl}`;
      const { pathname, searchParams } = new URL(fullURL, baseURL); // warn: this is not an iterable nodejs.org/api/url.html

      // (2) if has ?manifest query, do special processing
      if (searchParams.has('manifest')) {
        console.log(...PR(`requested manifest for: '${pathname}'`));

        const dirpath = Path.join(GSGO_HTDOCS, req.path);
        if (!UR.FILE.IsDirectory(dirpath)) {
          console.log(`manifest error: ${dirpath} is not a directory`, dirpath);
          next();
          return;
        }

        const allfiles = UR.FILE.GetFiles(dirpath);
        const manifests = allfiles
          .filter(f => f.startsWith(MANIFEST_NAME) && f.endsWith('.json'))
          .sort();

        // CASE 1: 1 OR MORE MANIFEST FILES
        if (manifests.length > 0) {
          console.log('manifest files:', manifests);
          const m = [];
          for (let f of manifests) {
            const json = UR.FILE.ReadJSON(`${dirpath}/${f}`);
            m.push(json);
          }
          res.json(m);
          return;
        }

        // CASE 2: NO MANIFEST FILE, SO SCAN SUBDIRS
        let assetcounter = ASSET_ID_START;
        const assetdirs = UR.FILE.GetAssetDirs(dirpath);
        console.log(`found ${assetdirs.length} assetdirs`);

        for (const subdir of assetdirs) {
          const promises = [];
          const subdirpath = Path.join(dirpath, subdir);

          // get valid media files
          const mediafiles = UR.FILE.GetFiles(subdirpath).filter(f =>
            UR.FILE.HasValidAssetType({ type: subdir, filename: f })
          );
          console.log(`${subdir} has ${mediafiles.length} valid files`);

          const jsonfiles = mediafiles.filter(
            f => Path.extname(f).toLowerCase() === '.json'
          );
          console.log(
            `${subdir} has ${jsonfiles.length} json files to scan for images`
          );

          /* IF JSON FILES EXIST, SCAN THEM FOR CONTAINED IMAGES */
          const foundimages = [];
          jsonfiles.forEach(f => {
            const file = UR.FILE.ReadJSON(`${subdirpath}/${f}`);
            const { meta, frames } = file;
            if (meta && meta.image) foundimages.push(meta.image);
            if (frames && Array.isArray(frames))
              for (let frame of frames)
                if (frame.filename) foundimages.push(frame.filenam);
          });
          console.log(
            `jsonfiles contained ${foundimages.length} image references`
          );

          /* FINALLY PROCESS FILES */
          const files = mediafiles.filter(f => !foundimages.includes(f));
          for (const f of files) {
            const path = Path.join(subdirpath, f);
            promises.push(UR.FILE.PromiseFileHash(path));
          }
          //
          // eslint-disable-next-line no-await-in-loop
          const filesInfo = await Promise.all(promises);
          //
          //
          //
          const entries = [];
          for (let info of filesInfo) {
            const assetId = assetcounter++;
            const { filename, ext: assetType, hash } = info;
            const asset = {
              assetId,
              assetName: filename,
              assetUrl: `${subdir}/${filename}`,
              assetType,
              hash
            };
            entries.push(asset);
          }
          manifest[subdir] = entries;
        } // end subdir processing
        // res.json(manifest);
        res.send(JSON.stringify(manifest, null, 2));
        return;
      } // no manifest request, so pass request forward
      next();
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
