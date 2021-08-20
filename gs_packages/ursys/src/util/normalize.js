/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  variout string and data structure normalizers

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const Path = require('path');
const PROMPTS = require('./prompts');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = PROMPTS.makeTerminalOut('U-NORM');

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a string '//a//a//aaa/', returns 'a/a/aaa'
 */
function TrimPath(p = '') {
  p = Path.join(p); // remove any duped /
  while (p.indexOf('/') === 0) p = p.slice(1); // remove leading /
  while (p.lastIndexOf('/') === p.length - 1) p = p.slice(0, -1); // remove trailing /
  return p;
}
/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  TrimPath
};
