/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SIM RUNTIME ENUMERATIONS

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// ENUMS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// these could all be phasemachine instances perhaps
export const MODES = [
  'MODE_IDLE', // device connections only, can assign, see changes
  'MODE_FREE', // simulation engine active, inputs active, live instancing
  'MODE_RCRD', // freeze blueprints and instances, inputs reset
  'MODE_PLAY', // playback of simulation data
  'MODE_ANNO' // instancing is disabled; playback mode with annotation layers
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const FREE_MODES = [
  'instance added', // device added an instance of blueprint with name
  'blueprint updated' // update and restart any agents
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const RCRD_MODES = [
  'rec_load_assets', // MC loads assets for recording
  'rec_ready_inputs', // MC locks input modes
  'rec_ready_assignments', // MC locks roles
  'rec_ready_sync', // MC wait for device ready
  'rec_ready_countdown', // MC 10 second countdown
  'rec_start', // MC simulation starts
  'rec_step', // MC periodic timestamped step
  'rec_stop_sync', // MC saves database, tells devices
  'rec_stop', // MC stops recording
  'rec_idle' // recording state is off
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const PLAY_MODES = [
  'play_load_session', // MC loading session data for playback
  'play_load_assets', // MC loads playback assets
  'play_ready_sync', // MC wait for devices ready
  'play_start', // playback begins
  'play_step', // frame step data fires periodically, with timestamp
  'play_pause_sync', // pause received from MC
  'play_paused', // paused ACK from MC
  'play_resume_sync', // about to resume
  'play_resumed', // simulation has resumed, back to step
  'play_frame_sync', // sim jumping to non-contiguous frame (rewind)
  'play_stop_sync', // MC ready to stop playback
  'play_stop', // MC is out of playback
  'play_idle'
];
