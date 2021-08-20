const path = require('path');
const { ReadFiles, PromiseReadFiles } = require('./src/util/files');

const { CFG_SVR_UADDR } = require('./src/common/ur-constants');

const TERM = require('./src/util/prompts').makeTerminalOut('TEST');
const TITLE = require('./src/util/prompts').makeTerminalOut('TEST', 'TagBlue');

TITLE('SERVER NODE TEST FILE');

/// TEST DIRECTORY LISTINGS
const dir = path.resolve(__dirname);

ReadFiles(dir, 'js', (err, files) => {
  console.log('got js', files);
});

PromiseReadFiles(dir, 'md|js').then(files => {
  console.log('got md|js', files);
});
