#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is the MAIN CONTROL PROGRAM SERVER for GEMSTEP, which currently acts as
  the remote asset server

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD MINIMAL DEPENDENCIES /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FS = require('fs');
const Path = require('path');
const Process = require('process');
const Shell = require('shelljs');
const Minimist = require('minimist');
const UR = require('@gemstep/ursys/server');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = 'MCP_RUN';
const TOUT = UR.TermOut(PR);
const HT_PORT = 8080; // hack to avoid confict with 2929 for admsrv fornow

// ensure that local settings file exists
const localSettingsPath = Path.join(__dirname, 'config/local-settings.json');
if (!UR.FILE.FileExists(localSettingsPath)) {
  TOUT('creating empty config/local-settings.json file');
  UR.FILE.SyncWriteJSON(localSettingsPath, {
    _INFO: [
      'Override constants defined gsgo-settings.js and mcp-settings.js in this file',
      'Settings added here can be set for your gsgo installation, and will not be',
      'committed to the gsgo repo'
    ]
  });
}

/// LOAD GEMSTEP DEPENDENCIES /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SERVER = require('./server/mcp-srv');

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return an ANSI COLOR CODED string for logging to terminal
function m_WrapErrorText(str) {
  return `\x1b[30;41m\x1b[37m ${str} \x1b[0m`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Start up GEMSTEP SERVER (at end of this file) */
function MCP_Start(opt = {}) {
  // git branch information
  const { error, stdout } = Shell.exec('git symbolic-ref --short -q HEAD', {
    silent: true
  });
  if (error) TOUT('using repo <detached head>\n');
  if (stdout) TOUT(`using repo '${stdout.trim()}' branch\n`);

  // trap connection errors when there is port conflict
  process.on('uncaughtException', err => {
    if (err.errno === 'EADDRINUSE')
      TOUT(m_WrapErrorText(`port ${HT_PORT} is already in use. Aborting`));
    else {
      TOUT(m_WrapErrorText('UNCAUGHT EXCEPTION'), err);
    }
    Process.exit(0);
  });

  // start server
  (async () => {
    await SERVER.StartAssetServer();
  })();
}

/// RUNTIME INITIALIZE ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// the following code is executed on module load

/// CHECK NPM CI WAS RUN //////////////////////////////////////////////////////
if (!FS.existsSync('./node_modules')) {
  console.log(m_WrapErrorText(`${PR} STARTUP ERROR\n`));
  let out = '';
  out += 'MISSING CRITICAL MODULE\n';
  out += `is this the \x1b[33mfirst time running ${PR}\x1b[0m `;
  out += 'or did you just run \x1b[33mnpm clean:all\x1b[0m?\n';
  out += 'run \x1b[33mnpm ci\x1b[0m to install all node_modules\n';
  console.log(out);
  Process.exit(0);
}
/// CHECK GIT DEPENDENCY //////////////////////////////////////////////////////
if (!Shell.which('git')) {
  Shell.echo(
    `\x1b[30;41m You must have git installed to run the ${PR} devtool \x1b[0m`
  );
  Shell.exit(0);
}
/// Process COMMAND LINE //////////////////////////////////////////////////////
const argv = Minimist(process.argv.slice(1));
const cmd = argv._[1];
switch (cmd) {
  case 'dev':
    TOUT('Starting Main Control Program Server in DEVELOPMENT MODE');
    MCP_Start({ mode: 'dev' });
    break;
  default:
    TOUT('Starting Main Control Program Server in PRODUCTION MODE');
    MCP_Start();
}
