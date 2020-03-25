# Useful snippets of server code

## A Minimum Express Setup

```js
// required libraries
const Express = require('express'); //your original BE server
const CookieP = require('cookie-parser');
// constants
const PORT = 80;
const DIR_ROOT = Path.resolve(__dirname, '..');
const DIR_OUT = Path.join(DIR_ROOT, 'httpdocs');

// create the Express application
const m_app = Express();
// create node http server instance
let m_server = m_app.listen(PORT, () => {
  console.log(PR, `WEBSERVER LISTENING ON PORT ${PORT}`);
  console.log(PR, `SERVING '${DIR_OUT}'`);
});

// enable cookies
m_app.use(CookieP());
// configure headers to allow cross-domain requests of media elements
m_app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
// set the templating engine
m_app.set('view engine', 'ejs');
// handle special case for root url to serve our ejs template
m_app.get('/', (req, res) => {
  const SessionParms = m_GetTemplateValues(req);
  res.render(`${DIR_OUT}/index`, SessionParms);
});
// provide default media handler
m_app.use('/', Express.static(DIR_OUT));

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
```

## A Webpack-Enabled ExpressJS Server

Here is a simplified version of the `server-express.js` code. The general idea is to use Webpack programmatically to build the files that are served by the Express instance. Since compilation happens on-the-fly, the hook 'StartServer' (an arbitrary string) starts the server when it's done. 

```js
const Webpack = require('webpack');
const DevServer = require('webpack-dev-middleware');
const HotReload = require('webpack-hot-middleware');
// the webpack config outputs an index.html that loads the bundle in DIR_OUT
const wpConfig = require('config.webpack');
const compiler = Webpack(wpConfig);
//
const devServer = DevServer(compiler,{
  publicPath: wpConfig.output.publicPath,
  states: 'errors-only'
});
//
const m_app = Express();
let m_server;
//
m_app.use(devServer);
m_app.use(HotReload(compiler));
//
compiler.hooks.afterCompile.tap('StartServer',()=>{
  if (!m_server) {
    m_server = app.listen(PORT, () => {
      console.log(PR, `WEBSERVER LISTENING ON PORT ${PORT}`);
      console.log(PR, `SERVING '${DIR_OUT}'`);
      console.log(PR, `LIVE RELOAD ENABLED`);
    });
  }
});
// handle special case of root load
app.get('/', (req, res) => {
  res.render(`${DIR_OUT}/index.html`);
});
// provide default media handler
app.use('/', Express.static(DIR_OUT));
```
HotReload will also be applied automatically, but the web app has to listen for reload events from the hot server. This is specified in the entry point of webpack config, and should have at minimum this code:
``` js
if (module.hot) {
  module.hot.addStatusHandler(status => {
    // reload entire if ANY change occurs
    if (status === 'ready') {
      window.location.reload();
    } else console.log(PR, 'HMR status:', status);
  });
} else {
  console.log(`HMR support is not enabled`);
}
```
