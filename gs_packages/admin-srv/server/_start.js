/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Custom NextJS Server

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ w* /////////////////////////////////////*/

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const URS = require('@gemstep/ursys/server');
const PTRACK = require('./step-ptrack');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const SCRIPT_PATH = path.relative(`${__dirname}/../..`, __filename);
const RUNTIME_PATH = path.join(__dirname, '/runtime');
const TOUT = URS.TermOut('ADMSRV-RUN');

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_WrapErrorText(str) {
  return `\x1b[30;41m\x1b[37m ${str} \x1b[0m\n`;
}

/// START URSYS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// trap connection errors when there is port conflict
process.on('uncaughtException', err => {
  if (err.errno === 'EADDRINUSE')
    TOUT(m_WrapErrorText('PORT 2929 is already in use. Aborting'));
  else TOUT(err);
  process.exit(0);
});
// run ursys
(async () => {
  TOUT(`STARTING: ${SCRIPT_PATH}`);
  // Turn off PTRACK so it doesn't interfere with FakeTrack in GEM_SRV
  // await PTRACK.StartTrackerSystem();
  await URS.Initialize();
  await URS.URNET_Start({
    serverName: 'GEM_SRV',
    runtimePath: RUNTIME_PATH
  });
  const { port, uaddr } = URS.URNET_NetInfo();
  TOUT(`SERVER STARTED on port:${port} w/uaddr:${uaddr}`);
})();

/// START CUSTOM SERVER ///////////////////////////////////////////////////////
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
    if (!URS.NextJS_NetinfoHook(req, res)) {
      handle(req, res, parsedUrl);
    }
  }).listen(3000, err => {
    if (err) throw err;
    TOUT('Ready on http://localhost:3000');
  });
});
