/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS NETWORK DATABASE

  Communicates with server-db

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const PROMPTS = require('./util/prompts');
const { CFG_URDB_GQL } = require('./common/ur-constants'); // graphql endpint

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
export async function Request(query, variables) {
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
  if (!response.ok) {
    let err = 'GraphQL Error!!!';
    down.errors.forEach((e, i) => {
      const { line, column } = e.locations[0];
      err += `\n[${i}] - ${e.message} (line:${line} col:${column})`;
    });
    console.error(...PR(err));
  }
  return down;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function Query(query, vars = {}, cmp = 'query') {
  if (typeof query !== 'string')
    console.warn(...PR('query must be string', query));
  else if (typeof vars !== 'object')
    console.warn(...PR('vars  must be obj literal'));
  return Request(query, vars);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function Mutate(mutation, vars = {}, cmp = 'mutation') {
  if (typeof mutation !== 'string')
    console.warn(...PR('arg1 must be string not', mutation));
  else if (typeof vars !== 'object')
    console.warn(...PR('arg2 must be obj literal not', vars));
  return Request(mutation, vars);
}
