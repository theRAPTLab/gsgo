/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  see snippet 'ur-module-example' for a description of each section

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/*/
TODAY'S CHALLENGE:
prototype a universal message sender/receiver data structure that will
help catch bad naming decisions

message_string, payload description
/*/

const MESSAGES: Map<string, object> = new Map();

MESSAGES.set('AGENT_PROGRAM', { name: 'name of blueprint' });

const MSGLIST = [['AGENT_PROGRAM', { name: 'name of blueprint' }]];

/*/ THESE ARE RAISED MESSAGES
'AGENT_PROGRAM', bp.name
'SCRIPT_EVENT', { type: 'Tick' }
'SCRIPT_SRC_CHANGED', updata

'HACK_SIMDATA_UPDATE_MODELS', { models }
'HACK_SIMDATA_UPDATE_MODEL', { model }
'HACK_SIMDATA_REQUEST_MODEL', { modelId }
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

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
