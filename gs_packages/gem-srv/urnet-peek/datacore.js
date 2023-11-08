/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  client datacore - a pure data module for server-side ursys operations
  this is a stripped-down version for standalone server connection to URNET

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const $$ = require('./common/ur-constants');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const CLIENT_UINFO = {};
const ENDPOINTS = {};

/// METHODS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** save registration data */
function SaveRegistration(regdata = {}) {
  CLIENT_UINFO.uaddr = regdata.UADDR;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SaveEndpoints(eps) {
  const fn = 'SaveEndpoints:';
  if (eps === undefined)
    throw Error(`${fn} expected object { LocalNode, NetNode }`);
  ENDPOINTS.LocalNode = eps.LocalNode; // used only for local handle, send, call
  ENDPOINTS.NetNode = eps.NetNode; // used only for forwarding remote messages
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetEndpoints() {
  const { LocalNode, NetNode } = ENDPOINTS;
  return {
    LocalNode,
    NetNode
  };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return client uaddr */
function MyUADDR() {
  const { uaddr } = CLIENT_UINFO;
  if (uaddr === undefined) throw Error('MyUADDR() called before uaddr set');
  return uaddr;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns the unique UADDR number */
function GetUAddressNumber() {
  const { PRE_UADDR_ID } = $$;
  const base_id = MyUADDR().slice(PRE_UADDR_ID.length);
  return base_id;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  SaveEndpoints,
  GetEndpoints,
  GetUAddressNumber,
  SaveRegistration
};
