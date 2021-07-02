/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS NETWORK DATABASE

  Communicates with server-db

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const PROMPTS = require('./util/prompts');
const { CFG_URDB_GQL } = require('./ur-common'); // graphql endpint

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.makeStyleFormatter('URDB', 'TagDkRed');
const DBG = true;

/// STUFF GOES HERE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Send query to GraphQL endpoint (default '/urnet/urdb') and return { data }
 *  @param {string} query - SDL query string
 *  @param {object} variables - lookup obj for $propname in query string
 *  @returns {Promise} - Promise resolving to { data }
 */
export async function Query(query, variables) {
  const controller = new AbortController();
  const up = { query, variables };
  const body = JSON.stringify(up);
  // POST { "query": "...", "variables": { "myVariable": "someValue", ... } }
  const response = await fetch(CFG_URDB_GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body,
    signal: controller.signal // not currently used to cancel the fetch
  });
  const down = await response.json();
  if (!response.ok && DBG) {
    let err = 'GraphQL Error!!!';
    down.errors.forEach((e, i) => {
      err += `\n[${i}] - ${e.message}`;
    });
    console.error(...PR(err));
  }
  return down.data;
}
