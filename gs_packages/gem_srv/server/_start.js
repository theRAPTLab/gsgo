/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Custom NextJS Server

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const URSERVER = require('@gemstep/ursys/server');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const SCRIPT_PATH = path.relative(`${__dirname}/../..`, __filename);
const RUNTIME_PATH = path.join(__dirname, '/runtime');

(async () => {
  console.log(`STARTING: ${SCRIPT_PATH}`);
  await URSERVER.StartServer({
    serverName: 'GEM_SRV',
    runtimePath: RUNTIME_PATH
  });
  const { port, uaddr } = URSERVER.GetBrokerInfo();
  console.log(`SERVER STARTED on port:${port} w/uaddr:${uaddr}`);
})();

/// START WEN SERVER //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ NextJS is loaded as middleware with all its usual features
    except for automatic static optimization.
    We get a chance to intercept routes before passing the request to
    to the default handlers provided by NexxtJS.
/*/
app.prepare().then(() => {
  createServer((req, res) => {
    // Be sure to pass `true` as the second argument to `url.parse`.
    // This tells it to parse the query portion of the URL.
    const parsedUrl = parse(req.url, true);
    const { pathname, query } = parsedUrl;

    // Do our route interception here
    if (pathname === '/api/getinfo') {
      app.render(req, res, '/b', query);
    } else if (pathname === '/b') {
      app.render(req, res, '/a', query);
    } else {
      handle(req, res, parsedUrl);
    }
  }).listen(3000, err => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
