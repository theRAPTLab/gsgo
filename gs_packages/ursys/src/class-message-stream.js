/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is an URSYS message dictionary for use with network-wide message
  registration. Predefine all potential messages here.

  Implemented as a class in case we need to expand this to handle mutiple
  message maps in the same app

  This might be expanded into the general I/O handler of all inputs

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class MessageStream {
  constructor() {
    this.localmap = new Map(); // string, object
    this.netmap = new Map(); // net:string, object
  }
  declare(mesgName, dataProps) {
    if (typeof mesgName !== 'string') throw Error('arg1 must be string');
    if (mesgName !== mesgName.toUpperCase())
      throw Error(`${mesgName} must be uppercase`);
    if (mesgName.substring(0, 4) === 'NET:')
      this.saveEntry(this.netmap, mesgName, dataProps);
    else this.saveEntry(this.localmap, mesgName, dataProps);
  }
  saveEntry(map, mesgName, dataProps) {
    if (map.has(mesgName)) throw Error(`${mesgName} already exists`);
    map.set(mesgName, dataProps);
  }
  hasEntry(mesgName) {
    return this.localmap.has(mesgName) || this.netmap.has(mesgName);
  }
}
/// EXPORT CLASS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MessageStream;

const MSGLIST = [
  ['AGENT_PROGRAM', { name: 'name of blueprint' }],
  ['SCRIPT_EVENT', { name: 'name of blueprint' }],
  ['SCRIPT_SRC_CHANGED', { name: 'name of blueprint' }],
  ['AGENT_PROGRAM', { name: 'name of blueprint' }]
];
/*/ THESE ARE RAISED MESSAGES
'AGENT_PROGRAM', bp.name
'SCRIPT_EVENT', { type: 'Tick' }
'SCRIPT_SRC_CHANGED', updata

'NET:UPDATE_MODELS', { models }
'NET:UPDATE_MODEL', { model }
'*:REQUEST_MODEL', { modelId }
'HACK_DEBUG_MESSAGE', { nessage, line }
'HACK_SELECT_AGENT', id
'HACK_INSTANCES_UPDATED', instances

'NET:HACK_SCRIPT_UPDATE', { script: text }
'NET:HACK_INSPECTOR_UPDATE', data
'NET:HACK_SIM_RESET'
'NET:HACK_SIM_START'
/*/

/*/ THESE ARE SENT MESSAGES
'NET:DISPLAY_LIST', dobjs
/*/

/*/ CALL
/*/

/*/ SERVER
'NET:SRV_LOG_EVENT', pktLogEvent
'NET:SRV_REG_HANDLERS', pktRegisterMessages
'NET:SRV_SESSION_LOGIN', pktSessionLogin
'NET:SRV_SESSION_LOGOUT', pktSessionLogout
'NET:SRV_SESSION', pktSession
'NET:SRV_REFLECT', pktDebug
'NET:SRV_SERVICE_LIST', pktServerListRequest
/*/
