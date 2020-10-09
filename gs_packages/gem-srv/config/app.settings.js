/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global application-specific constants

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const PATH = require('path');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Optional search function. It's defined as a function, but we just jam
 *  our values into it like a regular object and use it like this:
 *
 *    const SETTINGS = require('app.settings');
 *    const { PROJECT_NAME } = SETTINGS;
 */
const GLOBAL = key => {
  if (typeof key !== 'string') throw Error('key must be string');
  if (!key) throw Error('key can not be a falsey value');
  return GLOBAL[key];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
GLOBAL.Has = key => {
  return GLOBAL(key) !== undefined;
};

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
GLOBAL.PROJECT_NAME = 'GEMSTEP';
GLOBAL.RUNTIME_PATH = PATH.join(__dirname, '../runtime');

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = GLOBAL;
