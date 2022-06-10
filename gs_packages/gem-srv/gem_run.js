#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is the URSYS Development Utility, which is built to be called from
  package.json scripts or the command line.

  To run from the command line: ./gem_run <cmd> or node gem_run <cmd>

  DEV TIP: To pass a parameter via npm run script, you have to use -- as in
  npm run myscript -- --myoptions=something

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
const PR = 'GEMRUN';
const TOUT = UR.TermOut(PR);

// ensure that local settings file exists
const localSettingsPath = Path.join(__dirname, 'config/local-settings.json');
if (!UR.FILE.FileExists(localSettingsPath)) {
  TOUT('creating empty config/local-settings.json file');
  UR.FILE.SyncWriteJSON(localSettingsPath, {
    _INFO: [
      'Override constants defined gsgo-settings.js and gem-settings.js in this file',
      'Settings added here can be set for your gsgo installation, and will not be',
      'committed to the gsgo repo'
    ]
  });
}

/// LOAD GEMSTEP DEPENDENCIES /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TRACKER = require('./server/step-tracker');
const GEMAPP = require('./server/gem-app-srv');
const { RUNTIME_PATH } = require('./config/gem-settings');

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return an ANSI COLOR CODED string for logging to terminal
function m_WrapErrorText(str) {
  return `\x1b[30;41m\x1b[37m ${str} \x1b[0m`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Start up GEMSTEP SERVER (at end of this file) */
function GEMSRV_Start(opt) {
  // git branch information
  const { error, stdout } = Shell.exec('git symbolic-ref --short -q HEAD', {
    silent: true
  });
  TOUT('Starting Development Server...');
  let branch;
  if (error) branch = '<detached head>';
  if (stdout) branch = `${stdout.trim()}`;
  TOUT(`using repo branch: ${branch}`);

  const URNET_PORT = 2930; // hack to avoid confict with 2929 for admsrv fornow

  // trap connection errors when there is port conflict
  process.on('uncaughtException', err => {
    if (err.errno === 'EADDRINUSE')
      TOUT(m_WrapErrorText(`port ${URNET_PORT} is already in use. Aborting`));
    else {
      TOUT(m_WrapErrorText('UNCAUGHT EXCEPTION'), err);
    }
    Process.exit(0);
  });
  process.once('SIGINT', async () => {
    TOUT('***SIGINT***');
    TOUT('Stopping URNET...');
    await UR.URNET_Stop();
    TOUT('Stopping Development Server...');
    await GEMAPP.CloseAppServer();
  });

  // run ursys
  (async () => {
    await GEMAPP.StartAppServer(opt);
    await UR.Initialize([TRACKER.StartTrackerSystem]);
    await UR.URNET_Start({
      port: URNET_PORT,
      serverName: 'GEM_SRV',
      runtimePath: RUNTIME_PATH,
      branch
    });
  })();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GEMSRV_Kill() {
  let pskill = `ps ax | grep "[n]ode --trace-warnings gem_run.js" | awk '{ print $1 }'`;
  TOUT(pskill);
  let result;
  result = Shell.exec(pskill, {
    silent: true
  });
  if (result.error) TOUT('...ERR:', result.error);
  const job = result.stdout.trim();
  if (job) {
    TOUT(`PID '${job}' appears to be a GEMSRV instance...killing PID!`);
    pskill = `kill -9 ${job}`;
    TOUT(pskill);
    Shell.exec(pskill);
    TOUT('Hopefully that worked');
  } else {
    TOUT('---');
    TOUT("Couldn't find process matching 'node gem_run.js' to kill");
    TOUT("If you are still having problems, try using 'ps' to find ");
    TOUR('processes that might be in conflict with GEMSTEP or ask the devs"\n');
  }
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
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    GEMSRV_Start();
    break;
  case 'dev-skip':
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    GEMSRV_Start({ skipWebCompile: true });
    break;
  case 'kill':
    GEMSRV_Kill();
    break;
  default:
    console.log('unknown command', cmd);
}
