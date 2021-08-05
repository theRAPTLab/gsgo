#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is the ASSET SERVER for GEMSTEP

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const FS = require('fs');
const PROCESS = require('process');
const PATH = require('path');
const shell = require('shelljs');
const minimist = require('minimist');
const UR = require('@gemstep/ursys/server');
const SERVER = require('./server/asset-srv');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = 'ASRV_RUN';
const TOUT = UR.TermOut(PR);
const HT_PORT = 8080; // hack to avoid confict with 2929 for admsrv fornow

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return an ANSI COLOR CODED string for logging to terminal
function m_WrapErrorText(str) {
  return `\x1b[30;41m\x1b[37m ${str} \x1b[0m`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Start up GEMSTEP SERVER (at end of this file) */
function ASRV_Start(opt = {}) {
  // git branch information
  const { error, stdout } = shell.exec('git symbolic-ref --short -q HEAD', {
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
    PROCESS.exit(0);
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
  PROCESS.exit(0);
}
/// CHECK GIT DEPENDENCY //////////////////////////////////////////////////////
if (!shell.which('git')) {
  shell.echo(
    `\x1b[30;41m You must have git installed to run the ${PR} devtool \x1b[0m`
  );
  shell.exit(0);
}
/// PROCESS COMMAND LINE //////////////////////////////////////////////////////
const argv = minimist(process.argv.slice(1));
const cmd = argv._[1];
switch (cmd) {
  case 'dev':
    TOUT('Starting Asset Server in DEVELOPMENT MODE');
    ASRV_Start({ mode: 'dev' });
    break;
  default:
    TOUT('Starting Asset Server in PRODUCTION MODE');
    ASRV_Start();
}
