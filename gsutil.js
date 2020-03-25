#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is the GEMSTEP Development Utility, which is built to be called from
  package.json scripts or the command line.

  To run from the command line: ./gsutil <cmd> or node gsutil <cmd>

  DEV TIP: To pass a parameter via npm run script, you have to use -- as in
  npm run myscript -- --myoptions=something

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS /////////////////////////////////////////////////////////////////
const PR = 'GEMSTEP';

/// LOAD BUILT-IN LIBRARIES ///////////////////////////////////////////////////
const FS = require('fs');
const PROCESS = require('process');

/// CHECK DEV DEPENDENCIES ////////////////////////////////////////////////////
if (!FS.existsSync('./node_modules/ip')) {
  console.log(`\x1b[41m\x1b[37m ${PR} STARTUP ERROR \x1b[0m\n`);
  let out = '';
  out += `MISSING CRITICAL MODULE\n`;
  out += `is this the \x1b[33mfirst time running ${PR}\x1b[0m `;
  out += `or did you just run \x1b[33mnpm clean:all\x1b[0m?\n`;
  out += `run \x1b[33mnpm ci\x1b[0m to install all node_modules\n`;
  console.log(out);
  PROCESS.exit(0);
}

/// LOAD EXTERNAL LIBRARIES ///////////////////////////////////////////////////
const SHELL = require('shelljs');
const MINIMIST = require('minimist');

/// CHECK GIT DEPENDENCY //////////////////////////////////////////////////////
if (!SHELL.which('git')) {
  SHELL.echo(`\x1b[30;41m You must have git installed to run the ${PR} devtool \x1b[0m`);
  SHELL.exit(0);
}
/// GIT BRANCH INFORMATION ////////////////////////////////////////////////////
const { error, stdout } = SHELL.exec('git symbolic-ref --short -q HEAD', { silent: true });
let m_branch_info;
if (error) m_branch_info = '<detached head>';
if (stdout) m_branch_info = stdout.trim();

/// CHECK VERSIONS
let lernaJSON = JSON.parse(FS.readFileSync('lerna.json', 'utf8'));
const GS_VERSION = lernaJSON.version;
if (GS_VERSION === undefined) {
  SHELL.echo(`\x1b[30;41m missing lerna.json version \x1b[0m`);
  SHELL.exit(0);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// COMMAND DISPATCHER ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const argv = MINIMIST(process.argv.slice(1));
const cmd = argv._[1];

SHELL.echo(`\n${PR} RUNTIME`);
SHELL.echo(`.. branch:  ${m_branch_info}`);
SHELL.echo(`.. version: ${GS_VERSION}`);

switch (cmd) {
  case 'dev':
    console.log('run dev');
    break;
  default:
    console.log('unknown command', cmd);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// RUN DEV ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RunDevServer() {
  console.log(PR, `Starting ${PR} Development Server...`);
  console.log(PR, `running branch ${m_branch_info} version ${GS_VERSION}`);
}
