/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS NETWORK DATABASE

  Communicates with server-db

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const PROMPTS = require('./util/prompts');
const { CFG_URDB_GQL } = require('./ur-common'); // graphql endpint

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.makeStyleFormatter('URDB', 'TagDkRed');
const log = console.log;

/// STUFF GOES HERE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Send query to GraphQL endpoint (default '/urnet/urdb') and return { data }
 *  @param {string} query - SDL query string
 *  @param {object} variables - lookup obj for $propname in query string
 *  @returns {Promise} - Promise resolving to { data }
 */
export async function Query(query: string, variables: any) {
  const body = JSON.stringify({ query, variables });
  // POST { "query": "...", "variables": { "myVariable": "someValue", ... } }
  const response = await fetch(CFG_URDB_GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body
  });
  return response.json();
}
