/* eslint-disable global-require */
/*/////////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UR Web Application Server
  Creates a "hot compiling/reloading" application servers that uses webpack
  as middleware. This is advantageous when debugging a webapp that's served
  from inside an Electron host.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * ///////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
const Express = require('express'); //your original BE server
const Path = require('path');
const CookieP = require('cookie-parser');
const Webpack = require('webpack');
const DevServer = require('webpack-dev-middleware');
const HotReload = require('webpack-hot-middleware');
const { ExpressHandler, PrefixUtil } = require('@gemstep/ursys/server');

/// LOAD LOCAL MODULES ////////////////////////////////////////////////////////
const wpconf_packager = require('../config/wp.pack.webapp');

/// DEBUG INFO ////////////////////////////////////////////////////////////////
const PR = PrefixUtil('APPSRV');

/// CONSTANTS /////////////////////////////////////////////////////////////////
const PORT = 80;
const DIR_ROOT = Path.resolve(__dirname, '../');
const DIR_OUT = Path.join(DIR_ROOT, 'built/web');

/// SERVER DECLARATIONS ///////////////////////////////////////////////////////
const app = Express();
let m_server; // server object returned by app.listen()

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Start the express webserver on designated PORT
 */
function Start() {
  console.log(
    ...PR('COMPILING WEBSERVER w/ WEBPACK - THIS MAY TAKE SEVERAL SECONDS...')
  );
  let promiseStart;

  // RUN WEBPACK THROUGH API
  // first create a webpack instance with our chosen config file
  const webConfig = wpconf_packager();

  const compiler = Webpack(webConfig);
  // add webpack middleware to Express
  // also add the hot module reloading middleware
  const instance = DevServer(compiler, {
    logLevel: 'silent', // turns off [wdm] messages
    publicPath: webConfig.output.publicPath,
    stats: 'errors-only' // see https://webpack.js.org/configuration/stats/
  });
  console.log(...PR('... starting hot devserver (this may take a while)'));

  app.use(instance);
  app.use(HotReload(compiler));

  // compilation start message
  // we'll start the server after webpack bundling is complete
  // but we still have some configuration to do
  // note that many hooks do not run in developer HMR mode
  compiler.hooks.afterCompile.tap('StartServer', () => {
    if (!m_server) {
      m_server = app.listen(PORT, () => {
        console.log(...PR(`webapp bundle: '${DIR_OUT}'`));
        console.log(...PR(`webapp server listening on port ${PORT}`));
        console.log(...PR('LIVE RELOAD ENABLED'));
      });
    }
  });

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
    compiler.hooks.afterCompile.tap('ResolvePromise', () => {
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

  // set the templating engine
  app.set('view engine', 'ejs');
  // handle special case for root url to serve our ejs template
  app.get('/', (req, res) => {
    const URSessionParams = {};
    res.render(`${DIR_OUT}/index`, URSessionParams);
  });

  // handle urnet
  app.use(ExpressHandler);

  // for everything else...
  app.use('/', Express.static(DIR_OUT));

  // return promiseStart for async users
  return promiseStart;
}

/// MODULE EXPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { Start, PORT };
