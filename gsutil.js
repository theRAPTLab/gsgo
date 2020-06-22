#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is the GEMSTEP Development Utility, which is built to be called from
  package.json scripts or the command line.

  To run from the command line: ./gsutil <cmd> or node gsutil <cmd>

  DEV TIP: To pass a parameter via npm run script, you have to use -- as in
  npm run myscript -- --myoptions=something

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = 'GEMSTEP';

/// LOAD BUILT-IN LIBRARIES ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FS = require('fs-extra');
const PATH = require('path');
const PROCESS = require('process');

/// CHECK DEV DEPENDENCIES ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (!FS.existsSync('./node_modules/ip')) {
  console.log(`\x1b[41m\x1b[37m ${PR} STARTUP ERROR \x1b[0m\n`);
  let out = '';
  out += 'MISSING CRITICAL MODULE\n';
  out += `is this the \x1b[33mfirst time running ${PR}\x1b[0m `;
  out += 'or did you just run \x1b[33mnpm clean:all\x1b[0m?\n';
  out += 'run \x1b[33mnpm ci\x1b[0m to install all node_modules\n';
  console.log(out);
  PROCESS.exit(0);
}

/// LOAD EXTERNAL LIBRARIES ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SHELL = require('shelljs');
const MINIMIST = require('minimist');

/// CHECK GIT DEPENDENCY //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (!SHELL.which('git')) {
  SHELL.echo(
    `\x1b[30;41m You must have git installed to run the ${PR} devtool \x1b[0m`
  );
  SHELL.exit(0);
}
/// GIT BRANCH INFORMATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { error, stdout } = SHELL.exec('git symbolic-ref --short -q HEAD', {
  silent: true
});
let m_branch_info;
if (error) m_branch_info = '<detached head>';
if (stdout) m_branch_info = stdout.trim();

/// CHECK VERSIONS
let lernaJSON = JSON.parse(FS.readFileSync('lerna.json', 'utf8'));
const GS_VERSION = lernaJSON.version;
if (GS_VERSION === undefined) {
  SHELL.echo('\x1b[30;41m missing lerna.json version \x1b[0m');
  SHELL.exit(0);
}

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_DirectoryExists(path) {
  if (!FS.existsSync(path)) {
    return false;
  }
  const stats = FS.statSync(path);
  if (!stats.isDirectory()) {
    return false;
  }
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_CopyFiles(source, dest, rpaths) {
  rpaths.forEach(relativePath => {
    const from = PATH.join(source, relativePath);

    const fromType = FS.statSync(from);
    // directories
    if (fromType.isDirectory()) {
      const target = PATH.join(dest, relativePath, '..');
      FS.ensureDirSync(target);
      SHELL.cp('-Rf', from, target);
      const pstr = PATH.relative(target, source)
        .split('../')
        .join('');
      console.log(`.. copying dir ${pstr}/${relativePath}`);
      return;
    }
    // files
    if (fromType.isFile()) {
      const target = PATH.join(dest, relativePath);
      FS.ensureDirSync(PATH.dirname(target));
      SHELL.cp(from, target);
      const pstr = PATH.relative(target, source)
        .split('../')
        .join('');
      console.log(`.. copying file ${pstr}/${relativePath}`);
      return;
    }
    console.log('** skipping unknown file stat');
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_RemoveFiles(dir, rpaths) {
  rpaths.forEach(relativePath => {
    const target = PATH.join(dir, relativePath);
    const targetType = FS.statSync(target);
    // directories
    if (targetType.isDirectory()) {
      SHELL.rm('-rf', target);
      console.log(`.. removing dir ${target}`);
      return;
    }
    // files
    if (targetType.isFile()) {
      SHELL.rm(target);
      console.log(`.. removing file ${target}`);
      return;
    }
    console.log('** skipping unknown file stat');
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** only allows moving within provided directory
 */
function m_RenameFiles(dir, rpaths) {
  rpaths.forEach(([spath, dpath]) => {
    const from = PATH.join(dir, spath);
    const target = PATH.join(dir, dpath);
    //
    const fromType = FS.statSync(from);
    // directories
    if (fromType.isDirectory()) {
      FS.ensureDirSync(PATH.join(target, '..'));
      SHELL.mv(from, target);
      const pstr = PATH.relative(from, target)
        .split('../')
        .join('');
      console.log(`.. moved dir ${pstr}`);
      return;
    }
    // files
    if (fromType.isFile()) {
      FS.ensureDirSync(PATH.dirname(target));
      SHELL.mv(from, target);
      const pstr = PATH.relative(from, target)
        .split('../')
        .join('');
      console.log(`.. moved file ${pstr}`);
      return;
    }
    console.log('** skipping unknown file stat');
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_CopyJsonProps(source, dest, propNames) {
  try {
    const LPJ = JSON.parse(FS.readFileSync(source, 'utf-8'));
    const RPJ = JSON.parse(FS.readFileSync(dest, 'utf-8'));
    const filename = PATH.basename(source);
    propNames.forEach(prop => {
      RPJ[prop] = LPJ[prop];
      console.log(`.. copying ${filename} prop '${prop}'`);
    });
    console.log(`.. wrote ${filename}`);
    FS.writeFileSync(dest, JSON.stringify(RPJ, null, '  '));
  } catch (e) {
    console.log('** CopyJsonProps: error parsing source or dest as JSON', e);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_ReplaceStrings(dir, extRegex, search, replace) {
  const files = SHELL.find(dir).filter(file => {
    return file.match(extRegex);
  });
  console.log(`.. sed '${search}' to '${replace}' in ${files.length} files`);
  files.forEach(file => {
    SHELL.sed('-i', search, replace, file);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_ManualReplaceStrings(file, search, warning) {
  const results = SHELL.grep(search, file);
  if (!results) return;
  const fname = PATH.basename(file);
  console.log('** WARNING ***');
  console.log(`   string '${search}' found in ${fname}`);
  console.log(`   ${warning}`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_CopyPackageComplete(packageName) {
  console.log(`\nCOPY ${packageName} DONE`);
  console.log("run 'lerna bootstrap' on destination\n");
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// RUN DEV ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RunDevServer() {
  console.log(PR, `Starting ${PR} Development Server...`);
  console.log(PR, `running branch ${m_branch_info} version ${GS_VERSION}`);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// COPY URSYS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function CopyURSYS(args) {
  const ERR = '** ERR:';
  const FB = '.. URCOPY:';

  SHELL.echo('\nURCOPY - URSYS COPIER');

  const SOURCE = 'gs_packages/ursys';
  const DEST = args[0] || '/Users/sri/Dev/PUB/ursanode/packages/ursys';
  if (!m_DirectoryExists(DEST)) {
    SHELL.echo(ERR, `path ${DEST} is not a directory`);
    SHELL.exit(0);
  }

  SHELL.echo(FB, `Copying URSYS files from ${SOURCE}/`);
  m_CopyFiles(SOURCE, DEST, [
    'src/',
    '.vscode/',
    '.eslintignore',
    'webpack.config.js',
    'tsconfig.json'
  ]);

  m_CopyJsonProps(`${SOURCE}/package.json`, `${DEST}/package.json`, [
    'dependencies',
    'devDependencies',
    'optionalDependencies'
  ]);

  m_CopyPackageComplete('URSYS');
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// COPY NEXTJS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function CopyNext(args) {
  const ERR = '** ERR:';

  SHELL.echo('\nNEXTCOPY - NEXTJS COPIER');

  const SOURCE = 'gs_packages/gem_srv';
  const DEST = args[0] || '/Users/sri/Dev/PUB/ursanode/packages/ex-next';

  if (!m_DirectoryExists(DEST)) {
    SHELL.echo(ERR, `path ${DEST} is not a directory`);
    SHELL.exit(0);
  }

  m_CopyFiles(SOURCE, DEST, [
    '.eslintignore',
    'tsconfig.json',
    'server/_start.js',
    '.vscode/',
    '.storybook/',
    'public/',
    'src/components/',
    'src/hooks/',
    'src/modules/style/',
    'src/page-blocks/',
    'src/pages/',
    'src/modules/appstate.js',
    'next-config.js'
  ]);

  m_RemoveFiles(DEST, [
    'src/pages/index.jsx',
    'src/pages/notes.jsx',
    'src/pages/_navmenu.json'
  ]);

  m_RenameFiles(DEST, [
    ['src/pages/ex_index.jsx', 'src/pages/index.jsx'],
    ['src/pages/ex_navmenu.json', 'src/pages/_navmenu.json']
  ]);

  m_CopyJsonProps(`${SOURCE}/package.json`, `${DEST}/package.json`, [
    'dependencies',
    'devDependencies',
    'nodemonConfig'
  ]);

  m_ReplaceStrings(`${DEST}/src`, /\.jsx?$/, '@gemstep', '@ursanode');
  m_ReplaceStrings(`${DEST}/server`, /\.jsx?$/, '@gemstep', '@ursanode');
  m_ManualReplaceStrings(
    `${DEST}/package.json`,
    '@gemstep/ursys',
    'you must update this entry manually to @ursanode/ursys with correct version'
  );

  m_CopyPackageComplete('EX-NEXT');
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
  case 'urcopy':
    CopyURSYS(argv._.slice(2));
    break;
  case 'nextcopy':
    CopyNext(argv._.slice(2));
    break;
  default:
    console.log('unknown command', cmd);
}
