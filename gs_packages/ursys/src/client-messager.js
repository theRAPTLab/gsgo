/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS CLIENT-SIDE LOCAL MESSAGE ENDPOINT

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const DATACORE = require('./client-datacore');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let LocalNode;
let NetNode;
const DBG = false;

/// HELPERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_EndpointInitialized() {
  if (LocalNode === undefined || !DATACORE.URSYS_RUNNING) {
    console.warn('URSYS was used before it was initialized, aborting');
    return false;
  }
  return true;
}

/// SUPPORT API PART 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** register messages */
async function RegisterMessages() {
  if (DBG) console.log(...PR('registering messages'));
  return LocalNode.ursysRegisterMessages();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SaveEndpoints(eps) {
  const fn = 'SaveEndpoints:';
  if (eps === undefined)
    throw Error(`${fn} expected object { LocalNode, NetNode }`);
  LocalNode = eps.LocalNode; // used only for local handle, send, call
  NetNode = eps.NetNode; // used only for forwarding remote messages
}

/// MESSAGE SENDING API ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** wrap LocalNode functions so we can export them before LocalNode is valid */
function DeclareMessage(mesgName, dataProps) {
  if (m_EndpointInitialized())
    return LocalNode.declareMessage(mesgName, dataProps);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HasMessage(mesgName) {
  if (m_EndpointInitialized()) return LocalNode.hasMessage(mesgName);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HandleMessage(mesgName, listener) {
  if (m_EndpointInitialized()) LocalNode.handleMessage(mesgName, listener);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function UnhandleMessage(mesgName, listener) {
  if (m_EndpointInitialized()) LocalNode.unhandleMessage(mesgName, listener);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function CallMessage(mesgName, inData, options) {
  if (m_EndpointInitialized())
    return LocalNode.callMessage(mesgName, inData, options);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RaiseMessage(mesgName, inData, options) {
  if (m_EndpointInitialized()) LocalNode.raiseMessage(mesgName, inData, options);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SendMessage(mesgName, inData, options) {
  if (m_EndpointInitialized()) LocalNode.sendMessage(mesgName, inData, options);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // message registration
  RegisterMessages,
  SaveEndpoints,
  // general api
  DeclareMessage,
  HasMessage,
  HandleMessage,
  UnhandleMessage,
  SendMessage,
  RaiseMessage,
  CallMessage
};
