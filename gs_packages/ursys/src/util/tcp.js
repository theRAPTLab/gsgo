/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  various TCP utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const IP = require('ip');
const PROMPTS = require('./prompts');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = PROMPTS.makeTerminalOut('U-TCP');

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a web request, dig out the ip address and return it
 */
function GetIPV4(req) {
  // using the req object returns localhost, which isn't useful
  let ip4client = req.ip.substr(req.ip.lastIndexOf(':') + 1);
  if (ip4client === 1) ip4client = '127.0.0.1';
  // ip module returns better address!
  let ip4server = IP.address();
  return { local: ip4client, server: ip4server };
}

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  GetIPV4
};
