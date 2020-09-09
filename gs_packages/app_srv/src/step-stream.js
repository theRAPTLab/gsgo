/* unisys-recorder */
// definitions
// network
// netmessage

///////////////////////////////////////////////////////////////////////////////
/**	UNISYS-RECORDER **********************************************************\

  Implements the recording interface, with UNISYS as the front-end module.
  This module can not call UNISYS directly, so it expects UNISYS to register
  messages and route them here through HandleRecorderStateMessage()

/** DECLARE MODULE ***********************************************************/

var REC = {};

/** ENUMERATIONS *************************************************************/

var MSG = {};
MSG.SRV = DEF.UNISYS_SERVER_MSGS;
MSG.CLI = DEF.UNISYS_CLIENT_MSGS;
var EVENT = {};
EVENT.SYS = DEF.SYSTEM_EVENTS;
var REC_EVENT = DEF.ENUM.RECORDER_EVENTS;
var REC_CMD = DEF.ENUM.RECORDER_CMDS;
var REC_SELECT = DEF.ENUM.RECORDER_SESSION_SELECTORS;
var PP = 'UNI-REC:';

/** PRIVATE SYSTEM VARIABLES *************************************************/
var m_recorder_mode = REC_EVENT.Idle;
var m_video_alive = false;
var m_subscribers = [];

///////////////////////////////////////////////////////////////////////////////
/** SUBMODULE INTERFACE ******************************************************/

/*/ UNISYS RECORDER is a mirror of the server's recorder state,
  so you can't insert app-specific code in this module since multiple
  apps will be using it. Instead, subscribe to its events.

  Note that other code completely bypasses this mechanism!
  .. Tal's React/Redux code subscribes directly to the UNISYS message
  .. Ben polls the recorder periodically to extract offset/duration
/*/ REC.HandleRecorderStateMessage = function (
  data
) {
  // check for mode changes
  switch (data.mode) {
    case undefined:
      break;
    case REC_EVENT.Playing: /* falls through */
    case REC_EVENT.Recording: /* falls through */
    case REC_EVENT.Idle: /* falls through */
    case REC_EVENT.Paused: /* falls through */
    case REC_EVENT.SeekForward: /* falls through */
    case REC_EVENT.SeekReverse /* falls through */:
      //				if (DBG) console.log('UNIREC  mode subs:',data.mode);
      m_recorder_mode = data.mode;
      if (data.session) console.log('recording meta', data.session);
      for (let i = 0; i < m_subscribers.length; i++) {
        m_subscribers[i]('mode', data.mode, data);
      }
      break;
    default:
      console.log('!!! UNIREC unrecognized mode:', data.mode);
  }

  // check for events
  switch (data.event) {
    case undefined:
      break;
    case REC_EVENT.OpenFile: /* falls through */
    case REC_EVENT.CloseFile: /* falls through */
    case REC_EVENT.ForceCloseFile: /* falls through */
    case REC_EVENT.EndFile: /* falls through */
    case REC_EVENT.PauseFile: /* falls through */
    case REC_EVENT.SeekFile: /* falls through */
    case REC_EVENT.SeekDone: /* falls through */
    case REC_EVENT.ResumeFile: /* falls through */
    //				if (DBG) console.log('UNIREC event subs:',data.event);
    /* falls through */
    case REC_EVENT.IndexUpdate /* falls through */:
      for (let i = 0; i < m_subscribers.length; i++) {
        m_subscribers[i]('event', data.event, data);
      }
      break;
    case REC_EVENT.VideoUp:
      if (DBG)
        console.log(
          '%cVIDEO IS UP',
          'color:white;background-color:black;padding:2px'
        );
      m_video_alive = true;
      break;
    case REC_EVENT.VideoDown:
      if (DBG)
        console.log(
          '%cVIDEO IS DOWN',
          'color:white;background-color:black;padding:2px'
        );
      m_video_alive = false;
      break;
    case REC_EVENT.VideoSystemState:
      let prdUp = data.producerUp || false;
      let srvUp = data.serverUp || false;
      if (DBG)
        console.log(
          '%cVIDEO STATE',
          'color:white;background-color:blue;padding:2px',
          'producer:',
          prdUp,
          'server:',
          srvUp
        );
      m_video_alive = prdUp && srvUp;
      break;
    default:
      console.log(PP, 'unrecognized event', data.event);
      break;
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handler for video sync messages '_VIDEOSYNC_STATE'
/*/ REC.HandleVideoSyncMessage = function (
  data
) {
  switch (data.event) {
    case 'timeupdate':
      let offset_ms = data.offset_ms;
      break;
    default:
    // console.log('unhandled event',data.event);
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Subscribe to recorder events
/*/ REC.SubscribeEvents = function (
  eventCallback
) {
  if (typeof eventCallback !== 'function') {
    console.error('SubscribeEvents() accepts a handler function as arg');
    return;
  }
  m_subscribers.push(eventCallback);
};

///////////////////////////////////////////////////////////////////////////////
/**	PLAYBACK *****************************************************************/
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ RecordStart takes a sessionRecordScope object: {
    session_info : sessionInfo object,
    sel_mesgs    : messages to record
    options      : session recording options (e.g. save_video)
  }
  sessionInfo : { unit_id, game_id, meta }StartStession
  sel_msgs is an array of message string (e.g. 'UNISYS_MESSAGE_NAME')
  -> see default-particles.m_StartSession() for example
/*/ REC.RecordStart = function (
  sessionRecScope
) {
  if (!sessionRecScope)
    throw 'UNIREC.RecordStart got null sessionRecScope object';

  // make sure we're not already recording or playing back.
  // this value get set by MSG.CLI.RecorderState handler, which is
  // sent by the server as it starts recording.
  if (m_recorder_mode !== REC_EVENT.Idle) {
    console.error('Can not start recording when not "idle"', m_recorder_mode);
    return false;
  }
  // *HACK* make sure video is available or don't even start
  // SEE default-particles m_StartSession() to resolve signaling path
  // and video options!
  if (!m_video_alive && sessionRecScope.options.save_video === true) {
    console.log(
      '%cRecordStart ERROR: VideoServer not ready. Are you running Producer?',
      'color:white;background-color:red'
    );
    return false;
  }

  // append the 'command' parameter for STEP recorder dispatcher logic
  sessionRecScope.command = REC_CMD.RecordStart;
  // send the command
  var recpkt = new NetMessage(MSG.SRV.RecorderCommand, sessionRecScope);
  NETWORK.Send(recpkt, function (data) {
    // fires when record start transaction acknowledged
  });
  // return true if no error and sent packet, but callback won't
  // fire right away
  return true;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ RecordStop
/*/ REC.RecordStop = function (cb) {
  // make sure we're not already recording or playing back.
  // this value get set by MSG.CLI.RecorderState handler, which is
  // sent by the server as it starts recording.
  if (m_recorder_mode !== REC_EVENT.Recording) {
    console.error('no recording in progress, mode is', m_recorder_mode);
    return false;
  }

  // send a special _unisys message to tell it that recording has stopped
  var params = {
    command: REC_CMD.RecordStop
  };
  var recpkt = new NetMessage(MSG.SRV.RecorderCommand, params);
  NETWORK.Send(recpkt, function (data) {
    if (typeof cb === 'function') {
      cb(data);
    }
    // fires when record stop transaction acknowledged
  });
  // return true if no error and sent packet, but callback won't
  // fire right away
  return true;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ GetSessionInfo
  This is needed by particles-student to retrieve session info when
  first starting up, especially if recording has already started and
  session info was already sent.
/*/ REC.GetSessionInfo = function (
  cb
) {
  var recpkt = new NetMessage(MSG.SRV.RecorderCommand, {
    command: REC_CMD.GetCurrentSession
  });
  NETWORK.Send(recpkt, function (data) {
    if (cb) cb(data);
  });
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ GetSessionList
  criteria at minimum { unit_id: 'StatesOfMatter' }
/*/ REC.GetSessionList = function (
  criteria,
  cb
) {
  var cmdpkt = new NetMessage(MSG.SRV.RecorderCommand, {
    command: REC_CMD.GetSessions,
    pattern: criteria
  });
  NETWORK.Send(cmdpkt, function (data) {
    // fires when get sessionlist transaction acknowledged
    if (cb) cb(data);
    else throw 'UNIREC.GetSessionList requires a callback function';
  });
  // return true if no error and sent packet, but callback won't
  // fire right away
  return true;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ PlaybackStart
/*/ REC.PlaybackStart = function (sessionSelector, cb) {
  if (!sessionSelector)
    throw 'UNIREC.PlaybackStart got null session config object';

  // make sure we're not already recording or playing back.
  // this value get set by MSG.CLI.RecorderState handler, which is
  // sent by the server as it starts recording.
  // UPDATE FEB 09 2017 - disabling this check so Recorder will always play the requested
  // session, interrupting anything in progress
  // if (m_recorder_mode!==REC_EVENT.Idle) {
  // 	console.error('Can not start playback when mode is already', m_recorder_mode);
  // 	return;
  // }

  // using sessionSelector, specify what to start playing back
  // using secret unisys call
  // server will start emiting the playback data
  // and suppress any messages that are coming in 'live'

  if (m_recorder_mode !== REC_EVENT.Idle) {
    let data = {
      error: 'Can not interrupt ' + m_recorder_mode + ' to start new Playback'
    };
    if (typeof cb === 'function') {
      cb(data);
    }
    // return false to indicate error, but you can also just process this in the
    // callback function...this is kind of redundant
    return false;
  }
  var playpkt = new NetMessage(MSG.SRV.RecorderCommand, {
    command: REC_CMD.PlaybackStart,
    selector: sessionSelector
  });
  NETWORK.Send(playpkt, function (data) {
    // fires when playback start has happened
    console.info(
      'PlaybackStart:%c network start confirmation received',
      'color:blue'
    );
    m_recorder_mode = REC_EVENT.Playing;
    if (typeof cb === 'function') {
      cb(data);
    }
  });
  // return true if no error and sent packet, but callback won't
  // fire right away
  return true;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ PlaybackStop
/*/ REC.PlaybackStop = function (cb) {
  // allow stop for Playing or Paused
  let canstop = m_recorder_mode === REC_EVENT.Playing;
  canstop |= m_recorder_mode === REC_EVENT.Paused;
  if (!canstop) {
    console.error('Nothing is playing', m_recorder_mode);
    return false;
  }
  // tell server with secret _unisys call to stop playing back
  var stoppkt = new NetMessage(MSG.SRV.RecorderCommand, {
    command: REC_CMD.PlaybackStop
  });
  NETWORK.Send(stoppkt, function (data) {
    // fires when playback stop transaction acknowledged
    if (typeof cb === 'function') {
      cb(data);
    }
  });
  // return true if no error and sent packet, but callback won't
  // fire right away
  return true;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ PlaybackPause stops the recording, but does not terminate playback.
  Use PlaybackResume() to continue. Optional callback will send the
  current data which contains playback time of stop
/*/ REC.PlaybackPause = function (
  cb
) {
  if (REC.IsSeeking()) {
    console.error('seeking, so can not pause yet');
    return false;
  }
  if (m_recorder_mode === REC_EVENT.Paused) {
    console.error('Already paused', m_recorder_mode);
    return false;
  }
  if (m_recorder_mode !== REC_EVENT.Playing) {
    console.error('Can only pause if actively playing');
    return false;
  }
  // got this far so lets pause
  var pausepkt = new NetMessage(MSG.SRV.RecorderCommand, {
    command: REC_CMD.PlaybackPause
  });
  NETWORK.Send(pausepkt, function (data) {
    if (DBG) console.log('received PlaybackPause Transaction Acknowledge');
    // support optional callback
    if (typeof cb === 'function') cb(data);
  });
  // return true if no error and sent packet, but callback won't
  // fire right away
  return true;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ PlaybackResume resumes a playback session that was stopped with
  PlaybackPause(). Optional callback will receive data packet with
  current playbacktime on resume.
/*/ REC.PlaybackResume = function (
  cb
) {
  if (REC.IsSeeking()) {
    console.error('seeking, so can not resume yet');
    return false;
  }

  if (m_recorder_mode === REC_EVENT.Playing) {
    console.error('Already playing');
    return true;
  }

  // Paused, Recording, Idle are possibilities now
  if (m_recorder_mode !== REC_EVENT.Paused) {
    console.error(
      'Can only resume if playback was active and it was paused. Mode is',
      m_recorder_mode
    );
    return false;
  }
  if (m_recorder_mode === REC_EVENT.Idle) {
    console.error(
      'No playback is active, so can not resume anything. Mode is',
      m_recorder_mode
    );
    return false;
  }
  // if got this far, we actually are paused
  var resumepkt = new NetMessage(MSG.SRV.RecorderCommand, {
    command: REC_CMD.PlaybackResume
  });
  NETWORK.Send(resumepkt, function (data) {
    if (DBG) console.log('received PlaybackResume Transaction Acknowledge');
    // support optional callback
    if (typeof cb === 'function') cb(data);
  });
  // return true if no error and sent packet, but callback won't
  // fire right away
  return true;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ PlaybackJump
/*/ REC.PlaybackJump = function (time_ms, cb) {
  switch (m_recorder_mode) {
    case REC_EVENT.Playing: /* falls through */
    case REC_EVENT.Paused /* falls through */:
      var jumppkt = new NetMessage(MSG.SRV.RecorderCommand, {
        command: REC_CMD.PlaybackJump,
        offset_ms: time_ms
      });
      NETWORK.Send(jumppkt, function (data) {
        if (DBG) console.log('received PlaybackJumpTo Transaction Acknowledge');
        // support optional callback
        if (typeof cb === 'function') cb(data);
      });
      // return true if no error and sent packet, but callback won't
      // fire right away
      return true;
    case REC_EVENT.SeekReverse: /* falls through */
    case REC_EVENT.SeekForward /* falls through */:
      console.log('JumpTo is currently seeking; please wait');
      return false;
    default:
      console.error(
        'JumpTo works only for playing or paused files that are not currently seeking'
      );
      return false;
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ PlaybackSetRate is currently undefined
/*/ REC.PlaybackSetRate = function () {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Returns true if recording
/*/ REC.IsRecording = function () {
  return m_recorder_mode === REC_EVENT.Recording;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ When recorder is playing back, it can be in any one of these modes, not just
  the Playing state.
/*/ REC.IsReplaying = function () {
  let test = false;
  switch (m_recorder_mode) {
    case REC_EVENT.Playing: /* falls-through */
    case REC_EVENT.Paused: /* falls-through */
    case REC_EVENT.SeekForward: /* falls-through */
    case REC_EVENT.SeekReverse /* falls-through */:
      test = true;
      break;
  }
  return test;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The idle state is when the Recorder is neither Recording or Replayiing
/*/ REC.IsIdle = function () {
  return m_recorder_mode === REC_EVENT.Idle;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The Paused state only happens
/*/ REC.IsPaused = function () {
  return m_recorder_mode === REC_EVENT.Paused;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ returns true if the .rec file is being seeked on the server. note that this
  does not reflect the state of a seeking VIDEO FILE
/*/ REC.IsSeeking = function () {
  return (
    m_recorder_mode === REC_EVENT.SeekReverse ||
    m_recorder_mode === REC_EVENT.SeekForward
  );
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ return true if the recorder is in a state where pausing can occur
/*/ REC.CanPause = function () {
  if (REC.IsSeeking()) {
    if (DBG) console.log('CanPause() NO Seek operation is underway');
    return false;
  }
  if (REC.IsPaused()) {
    if (DBG) console.log('CanPause() ALREADY paused');
    return false;
  }
  if (REC.IsIdle()) {
    if (DBG) console.log('CanPause() NOPE because nothing is playing');
    return false;
  }
  if (REC.IsRecording()) {
    if (DBG) console.log('CanPause() NOPE because we are RECORDING');
    return false;
  }
  // must be actually playing then
  return true;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ GetVideoServerState returns information about the producer, signaling
  server, and video connection parameters.
/*/ REC.ForceVideoServerStateEvent = function () {
  var cmdpkt = new NetMessage(MSG.SRV.RecorderCommand, {
    command: REC_CMD.ForceVideoServerStateEvent
  });
  NETWORK.Send(cmdpkt);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ GetRecorderMode returns the status to a requesting module
  Note: this is the only callback that doesn't return a complete
  data object.
/*/ REC.GetRecorderMode = function (
  cb
) {
  if (!cb) {
    throw 'UNIREC.GetRecorderMode requires a callback function';
  }
  var cmdpkt = new NetMessage(MSG.SRV.RecorderCommand, {
    command: REC_CMD.GetRecorderMode
  });
  NETWORK.Send(cmdpkt, function (data) {
    cb(data.mode);
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ return a Recorder state object { mode: offset_ms: }
/*/ REC.GetRecorderState = function (
  cb
) {
  if (!cb) {
    throw 'UNIREC.GetRecorderState requires a callback function';
  }
  var cmdpkt = new NetMessage(MSG.SRV.RecorderCommand, {
    command: REC_CMD.GetRecorderState
  });
  NETWORK.Send(cmdpkt, function (data) {
    cb(data);
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ tell recorder to connect to videoserver
/*/ REC.ConnectVideoServer = function (
  host,
  port,
  cb
) {
  if (!host)
    throw new Error(
      'ConnectVideoServer requires a host (setting: location.webrtc_addr)'
    );
  if (!port)
    throw new Error(
      'ConnectVideoServer requires a port (setting: location.webrtc_port)'
    );
  var cmdpkt = new NetMessage(MSG.SRV.RecorderCommand, {
    command: REC_CMD.ConnectVideoServer,
    host: host,
    port: port
  });
  NETWORK.Send(cmdpkt, function (data) {
    // this data is set in step-unisys DoConnectVideoServer
    // data.connect_error will be null if no error, or a string if error occurred
    if (data.connect_failed) {
      console.log('ConnectVideoServer: FAILED', data.connect_failed);
      m_video_alive = false;
      // this will get set true when recorder state VideoUp is received
    }
    if (typeof cb === 'function') {
      cb(data);
    }
  });
};

///////////////////////////////////////////////////////////////////////////////
/** SNEAKY CONSOLE INTERFACE *************************************************\

  Recording/Playback console test functions. DO NOT CALL FROM CODE.

  EXAMPLE USAGE

  TRecordStart() will call the server and tell it to create a recording file.

  TRecordStop() will stop the recording, updating the internal recorder
  state. Then playback using TPlayLastSession().

\*****************************************************************************/
window.TRecordStart = function (sessionInfo) {
  // pass a configuration object specifying which messages,
  // devices, or device classes (logical groups) to record
  sessionInfo = sessionInfo || {
    unit_id: 'StatesOfMatter',
    game_id: '<gameid>',
    meta: {
      note: 'I hate clams',
      tags: 'red',
      nums: [1, 2, 3]
    }
  };
  REC.RecordStart({
    session_info: sessionInfo,
    sel_mesgs: [MSG.SRV.SaveFrameData, EVENT.SYS.DisplayUpdate]
  });
};
window.TRecordStop = function () {
  REC.RecordStop();
};
window.TPlaybackStart = function (sessionSelection) {
  console.info(
    "window.PlaybackStart() doesn't do anything; see window.PlayLastSession() for example code."
  );
};
window.TPlaybackStop = function () {
  REC.PlaybackStop();
};
window.TPlaybackJump = function (time_ms) {
  REC.PlaybackJump(time_ms);
};
window.TListSessions = function () {
  // sessionSelector objects tells server what .REC files to look for
  let sessionSelector = {
    unit_id: 'StatesOfMatter',
    date_scope: 'today'
  };

  let errp = 'ListSessions:';

  // data will be passed to callback function
  let list = REC.GetSessionList(sessionSelector, function (data) {
    // get the valid list, if any
    if (data.error) {
      console.error(errp, data.error);
      return;
    }
    if (!data.files.length) {
      console.log(errp, 'no matching session recordings were found.');
      return;
    }
    // if we get this far, then we have valid data

    console.group(errp + 'LEGACY');
    console.log('Files in', data.directory);
    for (let i = 0; i < data.files.length; i++) {
      console.log(data.files[i]);
    }
    console.groupEnd();

    console.group(errp + 'NEW META DB');
    console.log('Session Objects Matching', sessionSelector);
    for (let i = 0; i < data.sessions.length; i++) {
      console.log(data.sessions[i].path);
    }
    console.groupEnd();
  });
};
window.TPlayLastSession = function () {
  // sessionSelector objects tells server what .REC files to look for

  // to retrieve all records, pass an empty selector
  let sessionSelector = {
    unit_id: 'StatesOfMatter',
    date_scope: 'all'
  };

  let errp = 'PlayLastSession:';

  // data will be passed to callback function
  let list = REC.GetSessionList(sessionSelector, function (data) {
    // get the valid list, if any
    if (data.error) {
      console.error(errp, data.error);
      return;
    }
    if (!data.sessions.length) {
      console.log(errp, 'no session recordings were found.');
      return;
    }
    // if we get this far, then we have valid data in sessions.
    console.group(errp);
    console.log('Matching sessions found in database');
    for (let i = 0; i < data.sessions.length; i++) {
      console.log(data.sessions[i].path);
    }
    console.groupEnd();

    // request the last file
    let lastSession = data.sessions[data.sessions.length - 1];
    // old style
    // let sessionSelector = {
    // 	file      : lastSession.file,
    // 	directory : lastSession.directory
    // };

    // new style
    let sessionSelector = {
      path: lastSession.path
    };
    REC.PlaybackStart(sessionSelector);
  });
};

window.TPlaybackPause = function () {
  REC.PlaybackPause();
};

window.TPlaybackResume = function () {
  REC.PlaybackResume();
};

window.TGetState = function () {
  REC.GetRecorderState(data => {
    let { mode, reader } = data;
    console.log('recorder mode:', mode, 'reader', reader);
  });
};

///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE ************************************************************/
export default REC;
