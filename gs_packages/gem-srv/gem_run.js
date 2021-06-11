#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is the URSYS Development Utility, which is built to be called from
  package.json scripts or the command line.

  To run from the command line: ./gem_run <cmd> or node gem_run <cmd>

  DEV TIP: To pass a parameter via npm run script, you have to use -- as in
  npm run myscript -- --myoptions=something

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const FS = require('fs');
const PROCESS = require('process');
const PATH = require('path');
const shell = require('shelljs');
const minimist = require('minimist');
const UR = require('@gemstep/ursys/server');
const TRACKER = require('./server/step-tracker');
const GEMAPP = require('./server/gem-app-srv');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = 'GEMRUN';
const TOUT = UR.TermOut(PR);
const RUNTIME_PATH = PATH.join(__dirname, '/runtime');

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return an ANSI COLOR CODED string for logging to terminal
function m_WrapErrorText(str) {
  return `\x1b[30;41m\x1b[37m ${str} \x1b[0m\n`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Start up GEMSTEP SERVER (at end of this file) */
function GEMSRV_Start(opt) {
  // git branch information
  const { error, stdout } = shell.exec('git symbolic-ref --short -q HEAD', {
    silent: true
  });
  TOUT('Starting Development Server...');
  if (error) TOUT('using repo <detached head>\n');
  if (stdout) TOUT(`using repo '${stdout.trim()}' branch\n`);

  const URNET_PORT = 2930; // hack to avoid confict with 2929 for admsrv fornow

  // trap connection errors when there is port conflict
  process.on('uncaughtException', err => {
    if (err.errno === 'EADDRINUSE')
      TOUT(m_WrapErrorText(`port ${URNET_PORT} is already in use. Aborting`));
    else TOUT(err);
    PROCESS.exit(0);
  });

  // run ursys
  (async () => {
    await GEMAPP.StartAppServer(opt);
    await UR.Initialize([TRACKER.StartTrackerSystem]);
    await UR.URNET_Start({
      port: URNET_PORT,
      serverName: 'GEM_SRV',
      runtimePath: RUNTIME_PATH
    });
  })();
}

/// RUNTIME INITIALIZE ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// the following code is executed on module load

/// CHECK NPM CI WAS RUN //////////////////////////////////////////////////////
if (!FS.existsSync('./node_modules')) {
  console.log(m_WrapErrorText(`${PR} STARTUP ERROR`));
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
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    GEMSRV_Start();
    break;
  case 'dev-skip':
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    GEMSRV_Start({ skipWebCompile: true });
    break;
  default:
    console.log('unknown command', cmd);
}
