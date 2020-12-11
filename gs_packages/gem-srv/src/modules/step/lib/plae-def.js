///////////////////////////////////////////////////////////////////////////////
/**	TYPES *******************************************************************\

  This is a declaration of all types that are used in more than one module
  in the STEP system. The other modules that are similar are NETDEFS

///////////////////////////////////////////////////////////////////////////////
/** DEFINITIONS **************************************************************/

const DEF = {};
DEF.ENUM = {};

///////////////////////////////////////////////////////////////////////////////
/** MESSAGES/EVENT DEFINITIONS ***********************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UNISYS messages handled by the UNISYS SERVER
	use in other modules as:
	MSG.SRV = DEF.UNISYS_SERVER_MSGS; // MSG.SRV.RegisterConnection
/*/ DEF.UNISYS_SERVER_MSGS = {
  RegisterConnection: '_REGISTER',
  ClientIsReady: '_APP_READY',
  TransactionReturn: '_TRANS_ACK',
  RecorderCommand: '_RECORDER',
  LogCommand: '_LOG',
  SaveFrameData: '_SAVE_LIVEFRAME'
};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UNISYS messages handled by UNISYS CLIENTS
	use in other modules as:
	MSG.CLI = DEF.UNISYS_CLIENT_MSGS; // MSG.CLI.MainSet
/*/ DEF.UNISYS_CLIENT_MSGS = {
  MainSet: '_MAIN_SET',
  RecorderState: '_RECORDER_STATE',
  VideoSyncState: '_VIDEOSYNC_STATE'
};

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UNISYS messages that designed to trigger some kind of response
/*/ DEF.UNISYS_TRIGGER_MSGS = {};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UNISYS system-wide events (same as messages technically, but different use)
	These are emitted by the server, and consumed by registrants that have
	registered a handler for it.
	use in other modules as:
	EVENT.SYS = DEF.SYSTEM_EVENTS; // EVENT.SYS.NetListUpdate
/*/ DEF.SYSTEM_EVENTS = {
  NetListUpdate: '_NETLIST',
  // clients-distributed events
  // display geometry general events
  GetDisplayProps: 'REQ_DISPLAY_PROPS',
  DisplayUpdate: 'EVENT_DISPLAY_UPDATE',
  // recorder general events
  RecordStart: 'EVENT_REC_START',
  RecordStop: 'EVENT_REC_STOP',
  PlaybackStart: 'EVENT_REP_START',
  PlaybackStop: 'EVENT_REP_STOP',
  PlaybackPause: 'EVENT_REP_PAUSE',
  PlaybackResume: 'EVENT_REP_RESUME',
  PlaybackJump: 'EVENT_REP_JUMP',
  // step-unisys-network events
  NetSocketRemoved: '_NET_SOCKET_REMOVED',
  NetSocketAdded: '_NET_SOCKET_ADDED',
  // step-recorder events
  RecorderModeChange: '_RECORDER_CHANGE',
  RecorderData: '_RECORDER_PBDATA'
};

///////////////////////////////////////////////////////////////////////////////
/** ENUMERATIONS *************************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ STEP-RECORDER implements a session recorder module that has modes that
	are synchronized with the client's recorder control module. Use this as:
	MODE = DEF.ENUM.RECORDER_MODES; var m = MODE.Playing;
/*/ DEF.ENUM.RECORDER_EVENTS = {
  // only one of these states are active at a time
  Playing: 'MODE_PLAY',
  Recording: 'MODE_REC',
  Idle: 'MODE_IDLE',
  Paused: 'MODE_PAUSED',
  SeekForward: 'MODE_SEEK_FWD',
  SeekReverse: 'MODE_SEEK_REV',
  // these events can fire any time for any more
  // and do NOT change the mode
  OpenFile: 'RecOpenFile',
  EndFile: 'RecEndOfFile',
  CloseFile: 'RecCloseFile',
  ForceCloseFile: 'RecForceCloseFile',
  PauseFile: 'RecPauseFile',
  SeekFile: 'RecSeekFile',
  SeekDone: 'RecSeekDone',
  ResumeFile: 'RecResumeFile',
  IndexUpdate: 'RecIndexUpdate',
  // these events are for video status
  VideoUp: 'VidConnect',
  VideoDown: 'VidDisconnect',
  VideoSystemState: 'VidSystemState'
};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ STEP-UNISYS recieves the RecorderCommand message and parses the 'command'
	property to determine what to do. These are the available commands. Declare
	like: CMD = DEF.ENUM.RECORDER_CMDS; var cmd = CMD.RecordStart;
/*/ DEF.ENUM.RECORDER_CMDS = {
  RecordStart: 'recstrt',
  RecordStop: 'recstop',
  PlaybackStart: 'pbstrt',
  PlaybackStop: 'pbstop',
  PlaybackPause: 'pbpause',
  PlaybackResume: 'pbresume',
  GetSessions: 'getses',
  GetCurrentSession: 'getcurrsession',
  GetRecorderMode: 'getrecmode',
  GetRecorderState: 'getrecstate',
  ForceVideoServerStateEvent: 'forcevidsrvstate',
  ConnectVideoServer: 'convidsrv'
};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
	REC_SELECT = DEF.ENUM.RECORDER_SESSION_SELECTORS;
	var datescope = REC_SELECT.DateScope.Today
/*/ DEF.ENUM.RECORDER_SESSION_SELECTORS = {
  DateScope: {
    Today: 'today',
    All: 'all'
  }
};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ STEP-UNISYS receives the RecorderCommand message and parses the 'command'
	property to determine what to do. These are the available commands. Declare
	like: CMD = DEF.ENUM.RECORDER_CMDS; var cmd = CMD.RecordStart;
/*/ DEF.ENUM.STATES_OF_MATTER = {
  Solid: 'solid',
  Liquid: 'liquid',
  Gas: 'gas',
  Impossible: 'impossible'
};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Data from Open PTrack is split among three different types: people, objects,
    and pose data.  Use this to define each type.
    Faketrack data can be treated as an additional type.
/*/ DEF.ENUM.PTRACK_TYPES = {
  Undefined: '?',
  Object: 'ob',
  People: 'pp',
  Pose: 'po',
  Faketrack: 'ft'
};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ particleCloud.js can render particles to either the main simulation display
	world or to the mirrored displaylist world.  Use this to define which world
	the particles are drawn to.
/*/ DEF.ENUM.RENDERPASSES = {
  World: 'world',
  Mirror: 'mirror'
};

///////////////////////////////////////////////////////////////////////////////
/** RETURN DEFINITIONS *******************************************************/
export default DEF;
