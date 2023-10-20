## URNET OUTLINE

The AppServer provides a way to access the connection information at route `/urnet/netinfo`, which is used to initiate a connect to the URNET websocket server.

On successful connect to the URNET socket server, it immediately send back a registration packet which informs the client what its local address (called a `UADDR`) is. This information is used to create several EndPoint objects that are the main interface for talking to URNET. The endpoint that matters for partipating in the URNET is `NetNode`, which exposes the following methods:

#### HANDLING METHODS

* `handleMessage('MESSAGE', function` - define a handler that can optionally return a data packet to the caller. The handler is stored in a dictionary using the `function` itself as a key, so you can registered multiple handlers for a message.
* `unhandleMessage('MESSAGE', function)` - unregistered the handler. Uses `function` object as the key, so you can unregister one of several functions that you have registered.
* `ursysRegisterMessages()` - register handlers with URNET. Should be callable multiple times 

#### CALLING METHODS

* `raiseMessage('MESSAGE',data)` - sends 'MESSAGE" to any registered handler on the URNET. These are used for signals that should be received by everyone, including the initiator.
* `sendMessage('MESSAGE',data)` - sends 'MESSAGE' to any registered handler on the URNET, with the exception of the initiator. Useful for single source of truth state updates.
* `callMessage('MESSAGE',inData).then(receivedData)` - performs a transaction, where 'MESSAGE' is sent and a payload is received if the remote handler returns one. The order of calls is guaranteed and uses Promises. Useful for implementing services that return data. If there are multiple implementators, they are all combined into a single datapacket...I think. Other versions of URSYS did this 

#### MESSAGE FORMATS

GEMSTEP uses channels, which are set in the message using a prefix `NET:` or `LOCAL:`. If there is no prefix, it's assumed to be `LOCAL:`. 

To send or receive a NETWORK message, prefix with `NET:` as in `NET:DISPLAY_LIST`. The `urnet-peek` module does not need to implement local messages but it could register handlers for other apps on URNET.

Data is sent and received as plain Javascript objects. The serialization is handled for you.

## REFERENCE: URNET HANDLED MESSAGES

This is a list of all declared handlers found by using RegEx. A challenge with GEMSTEP is applying rigor in the naming of messages; over multiple years of development the messaging nomenclature is inconsistent so for insight, use a case-sensitive search for the string `HandleMessage('MESSAGE_NAME')` to find out what it does.

### EXPLICIT LOCAL MESSAGES

'LOCAL:DC_WRITE_METADATA'
'LOCAL:DC_WRITE_PROJECT_SETTINGS'
'LOCAL:INSTANCE_ADD'
'LOCAL:INSTANCE_DELETE'
'LOCAL:SELF_HELLO'

### INPLICIT LOCAL MESSAGES

'AGENT_PROGRAM'
'ALL_AGENTS_PROGRAM'
'BOUNDARY_UPDATE'
'COMPILE_CURSORS'
'DRAG_END'
'HACK_DEBUG_MESSAGE'
'INIT_RENDERER'
'INJECT_BLUEPRINT'
'INSPECTOR_CLICK'
'INSTANCE_EDIT_DISABLE'
'INSTANCE_EDIT_ENABLE'
'INSTANCE_HOVEROUT'
'INSTANCE_HOVEROVER'
'METADATA_UPDATE'
'PROJDATA_UPDATE'
'REQ_PROJDATA'
'SCRIPT_EVENT'
'SCRIPT_JSX_CHANGED'
'SCRIPT_LINE_DELETE'
'SCRIPT_SRC_CHANGED'
'SCRIPT_UI_CHANGED'
'SELECT_SCRIPT'
'SHOW_MESSAGE'
'SIM_INSTANCE_CLICK'
'SIM_INSTANCE_HOVEROUT'
'SIM_INSTANCE_HOVEROVER'
'SIM_MODE'
'SIM_RESET'
'TRACKER_SETUP_UPDATE'
'WEBCAM_UPDATE'

### NETWORK MESSAGES

'NET:BLUEPRINT_DELETE'
'NET:BLUEPRINTS_UPDATE'
'NET:BPNAMESLIST_UPDATE'
'NET:DISPLAY_LIST'
'NET:GEM_CHARCTRLAPP'
'NET:GEM_COMPILERAPP'
'NET:GEM_FAKETRACKAPP'
'NET:GEM_HOMEAPP'
'NET:HACK_INSPECTOR_UPDATE'
'NET:HACK_SIM_COSTUMES'
'NET:HACK_SIM_END'
'NET:HACK_SIM_NEXTROUND'
'NET:HACK_SIM_START'
'NET:HACK_SIM_STOP'
'NET:HELLO'
'NET:INSPECTOR_REGISTER'
'NET:INSPECTOR_UNREGISTER'
'NET:INSPECTOR_UPDATE'
'NET:INSTANCE_DESELECT'
'NET:INSTANCE_SELECT'
'NET:INSTANCE_UPDATE_POSITION'
'NET:INSTANCE_UPDATE'
'NET:INSTANCES_UPDATE'
'NET:INSTANCESLIST_UPDATE'
'NET:LOG_ENABLE'
'NET:LOG_EVENT'
'NET:PROJECTS_UPDATE'
'NET:REQ_PROJDATA'
'NET:SCRIPT_EDITOR_CLOSE'
'NET:SCRIPT_UPDATE'
'NET:SCRIPT_UPDATED'
'NET:SET_CHARCONTROL_BPIDLIST'
'NET:SIM_RESET'
'NET:SIM_WAS_RESET'
'NET:TRANSFORM_REQ'
'NET:UPDATE_MODEL'

###SERVER HANDLERS

'NET:SRV_LOG_ENABLE'
'NET:SRV_LOG_EVENT'
'NET:SRV_LOG_JSON'
'NET:SRV_RTLOG'
'NET:SRV_REG_HANDLERS'
'NET:SRV_SESSION_LOGIN'
'NET:SRV_SESSION_LOGOUT'
'NET:SRV_SESSION'
'NET:SRV_REFLECT'
'NET:SRV_SERVICE_LIST'
'NET:SRV_PROTOCOLS'
'NET:SRV_DEVICE_REG'
'NET:SRV_DEVICE_DIR'
'NET:SRV_CONTROL_IN'
