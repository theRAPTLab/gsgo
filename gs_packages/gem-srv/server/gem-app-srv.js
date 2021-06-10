/* eslint-disable global-require */
/*/////////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UR Web Application Server
  Creates a "hot compiling/reloading" application servers that uses webpack
  as middleware. This is advantageous when debugging a webapp that's served
  from inside an Electron host.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ///////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
const Express = require('express'); //your original BE server
const Compression = require('compression');
const Path = require('path');
const IP = require('ip');
const CookieP = require('cookie-parser');
const Webpack = require('webpack');
const WebpackDev = require('webpack-dev-middleware');
const WebpackHot = require('webpack-hot-middleware');
const {
  Express_NetInfoResponder,
  PrefixUtil,
  URNET_GraphQL
} = require('@gemstep/ursys/server');

/// LOAD LOCAL MODULES ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const wpconf_packager = require('../config/wp.pack.webapp');

/// DEBUG INFO ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PrefixUtil('APPSRV');

/// CONSTANTS /////////////////////////////////////////////////////////////////
const PORT = 80;
const DIR_ROOT = Path.resolve(__dirname, '../');
const DIR_OUT = Path.join(DIR_ROOT, 'built/web');

/// SERVER DECLARATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const app = Express();
let m_server; // server object returned by app.listen()
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// After webapp is compiled, start the Express web server
function m_AppListen(opt = {}) {
  if (!m_server) {
    const ip = `\x1b[33m${IP.address()}\x1b[0m`;
    const port = `\x1b[33m${PORT}\x1b[0m`;
    m_server = app.listen(PORT, () => {
      console.log(...PR(`webapp bundle: '${DIR_OUT}'`));
      console.log(...PR(`webapp server listening ${ip} on port ${port}`));
      if (!opt.skipWebCompile) console.log(...PR('LIVE RELOAD ENABLED'));
    });
  }
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Start the express webserver on designated PORT
 */
function StartAppServer(opt = {}) {
  const { skipWebCompile = false } = opt;
  console.log(
    ...PR('COMPILING WEBSERVER w/ WEBPACK - THIS MAY TAKE SEVERAL SECONDS...')
  );
  let promiseStart;

  if (!skipWebCompile) {
    // RUN WEBPACK THROUGH API
    // first create a webpack instance with our chosen config file
    const wp_config = wpconf_packager();
    const wp_compiler = Webpack(wp_config);
    // add webpack middleware to Express
    // also add the hot module reloading middleware
    const wp_devserver = WebpackDev(wp_compiler, {
      logLevel: 'silent', // turns off [wdm] messages
      publicPath: wp_config.output.publicPath,
      stats: 'errors-only' // see https://webpack.js.org/configuration/stats/
    });
    console.log(...PR('... starting hot devserver (this may take a while)'));

    app.use(Compression());
    app.use(wp_devserver);
    app.use(WebpackHot(wp_compiler));

    // compilation start message
    // we'll start the server after webpack bundling is complete
    // but we still have some configuration to do
    // note that many hooks do not run in developer HMR mode
    wp_compiler.hooks.afterCompile.tap('StartWebServer', m_AppListen);

    // return promiseStart when server starts
    promiseStart = new Promise((resolve, reject) => {
      let INTERVAL_COUNT = 0;
      const INTERVAL_MAX = 15;
      let COMPILE_RESOLVED = false;
      const INTERVAL_PERIOD = 2000;
      const COMPILE_TIME = Math.floor((INTERVAL_MAX * INTERVAL_PERIOD) / 1000);

      // start compile status update timer
      let INTERVAL = setInterval(() => {
        if (++INTERVAL_COUNT < INTERVAL_MAX) {
          console.log(...PR('... transpiling bundle'));
        } else {
          clearInterval(INTERVAL);
          const emsg = `webpack compile time > INTERVAL_MAX (${COMPILE_TIME} seconds)`;
          const err = new Error(emsg);
          reject(err);
        }
      }, INTERVAL_PERIOD);

      // set resolver
      wp_compiler.hooks.afterCompile.tap('ResolvePromise', () => {
        if (!COMPILE_RESOLVED) {
          console.log(...PR('... transpiling complete!'));
          clearInterval(INTERVAL);
          resolve();
          COMPILE_RESOLVED = true;
        } else {
          console.log(...PR('RECOMPILED SOURCE CODE and RELOADING'));
        }
      });
    });
  } else {
    const TS = '\x1b[33m';
    const TE = '\x1b[0m';
    console.log(...PR(`*** ${TS}SKIPPING APP BUILD${TE} for fast server launch`));
    console.log(...PR(`*** ${TS}ONLY SERVER CODE CHANGES${TE} WILL LIVE RELOAD`));
    m_AppListen(opt);
  }
  // configure cookies middleware (appears in req.cookies)
  app.use(CookieP());
  // configure headers to allow cross-domain requests of media elements
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
  });

  // handle special case for root url to serve our HTML file directly
  // if using templating engine, do this instead:
  // app.set('view engine', 'ejs');
  // app.get('/', (req, res) => {
  //   // index.ejs file
  //   res.render(`${DIR_OUT}/index`);
  // });
  app.get('/', (req, res) => {
    res.sendFile(`${DIR_OUT}/index.html`);
  });
  app.get('/app', (req, res) => {
    res.sendFile(`${DIR_OUT}/index.html`);
  });
  app.get('/app/*', (req, res) => {
    res.sendFile(`${DIR_OUT}/index.html`);
  });

  // handle urnet
  app.use(Express_NetInfoResponder);
  app.use('/graphql', URNET_GraphQL());

  // for everything else...
  app.use('/', Express.static(DIR_OUT));

  // return promiseStart for async users
  return promiseStart;
}

/// MODULE EXPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { StartAppServer, PORT };
