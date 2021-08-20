/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manifest Read/Write Routines

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const fetch = require('node-fetch').default;
const PROMPTS = require('./prompts');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = PROMPTS.makeTerminalOut('U-MFEST');

/// MODULE HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return true if the url returns OK or exists
 *  call using async/await syntax
 */
async function m_ResourceExists(url) {
  const { ok } = await fetch(url, { method: 'HEAD' });
  return ok;
}

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Attempt to read manifest at given URL. Always returns a single json
 *  object.
 */
async function ReadManifest(url) {
  const i = url.indexOf('?manifest');
  // if (i === url.length - 9) {/* manifest string found */}
  if (i < 0) url = `${url}?manifest`;
  const manifestExists = await m_ResourceExists(url);
  if (!manifestExists) return undefined;
  let json = await fetch(url).then(res => res.json());
  if (Array.isArray(json)) json = json.shift();
  return json;
}

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ReadManifest
};
