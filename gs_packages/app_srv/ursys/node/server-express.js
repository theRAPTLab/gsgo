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
const IP = require('ip');
const CookieP = require('cookie-parser');
const Webpack = require('webpack');
const DevServer = require('webpack-dev-middleware');
const HotReload = require('webpack-hot-middleware');

/// LOAD LOCAL MODULES ////////////////////////////////////////////////////////
const PROMPTS = require('../../config/prompts');
const wpconf_packager = require('../../config/wp.pack.webapp');
const SETTINGS = require('../../config/app.settings');

/// DEBUG INFO ////////////////////////////////////////////////////////////////
const { TERM_EXP: CLR, TR } = PROMPTS;
const LPR = 'EXPRESS';

/// CONSTANTS /////////////////////////////////////////////////////////////////
const PORT = 80;
const PR = `${CLR}${PROMPTS.Pad(LPR)}${TR}`;
const DIR_ROOT = Path.resolve(__dirname, '../../');
const DIR_OUT = Path.join(DIR_ROOT, 'built/web');

/// RUNTIME SETUP /////////////////////////////////////////////////////////////
const USRV_START = new Date(Date.now()).toISOString(); // server startup time

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetTemplateValues(req) {
  let { ip, hostname } = req;
  if (ip === '::1') ip = '127.0.0.1'; // rewrite short form ip
  const { PROJECT_NAME } = SETTINGS;
  const params = {
    APP_TITLE: PROJECT_NAME,
    CLIENT_IP: ip,
    USRV_Host: hostname,
    USRV_IP: IP.address(),
    USRV_MsgPort: 2929,
    USRV_Start: USRV_START
  };
  return params;
}
/// SERVER DECLARATIONS ///////////////////////////////////////////////////////
const app = Express();
let m_server; // server object returned by app.listen()

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  start the express webserver on designated PORT
 */
function Start() {
  console.log(
    PR,
    'COMPILING WEBSERVER w/ WEBPACK - THIS MAY TAKE SEVERAL SECONDS...'
  );
  let promiseStart;

  // RUN WEBPACK THROUGH API
  // first create a webpack instance with our chosen config file
  const webConfig = wpconf_packager();
  const compiler = Webpack(webConfig);

  // add webpack middleware to Express
  // also add the hot module reloading middleware
  const instance = DevServer(compiler, {
    // logLevel: 'silent', // turns off [wdm] messages
    publicPath: webConfig.output.publicPath,
    stats: 'errors-only' // see https://webpack.js.org/configuration/stats/
  });

  app.use(instance);
  app.use(HotReload(compiler));

  // compilation start message
  // we'll start the server after webpack bundling is complete
  // but we still have some configuration to do
  compiler.hooks.afterCompile.tap('StartServer', () => {
    if (!m_server) {
      m_server = app.listen(PORT, () => {
        console.log(PR, `WEBSERVER LISTENING ON PORT ${PORT}`);
        console.log(PR, `SERVING '${DIR_OUT}'`);
        console.log(PR, 'LIVE RELOAD ENABLED');
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
        console.log(PR, '... webpack compiling');
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
        console.log(PR, '... webpack done');
        clearInterval(INTERVAL);
        resolve();
        COMPILE_RESOLVED = true;
      } else {
        console.log(PR, 'RECOMPILED SOURCE CODE and RELOADING');
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
    const URSessionParams = m_GetTemplateValues(req);
    res.render(`${DIR_OUT}/index`, URSessionParams);
  });
  // redirects
  app.get('/admin', (req, res) => {
    res.redirect('http://localhost:8080');
  });
  app.get('/gem', (req, res) => {
    res.redirect('http://localhost:3000');
  });
  // for everything else...
  app.use('/', Express.static(DIR_OUT));

  // return promiseStart for async users
  return promiseStart;
}

/// MODULE EXPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { Start, PORT };
