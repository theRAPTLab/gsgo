/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  RUNTIME LOOP

  This defines the runtime loop

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// create PhaseMachine to manage gameloop
const GAME_LOOP = new UR.class.PhaseMachine('SIM', {
  GLOOP_LOAD: [
    'LOAD_ASSETS',
    'RESET',
    'SETMODE',
    'WAIT',
    'PROGRAM',
    'INIT',
    'READY'
  ],
  GLOOP_STAGED: ['STAGED'], // GLOOP_LOAD completed, ready to load model
  GLOOP_PRERUN: [
    // GLOOP_STAGED completed, monitor inputs before run
    'INPUTS',
    'PHYSICS', // force physics update for size updates?  REVIEW: Not sure hti si sthe right thing to do
    'UI_UPDATE',
    'VIS_UPDATE',
    'VIS_RENDER'
  ],
  GLOOP_CONTROL: ['SYSEX'], // system change before start of GLOOP
  GLOOP: [
    // get state and queue derived state
    'INPUTS',
    'DELETE',
    'CREATE',
    'TIMERS',
    'PHYSICS',
    // agent/groups autonomous updates
    'AGENTS_UPDATE',
    'GROUPS_UPDATE',
    'FEATURES_UPDATE',
    // process conditions and collection
    'CONDITIONS_UPDATE',
    // agent/groups script execution and queue actions
    'FEATURES_THINK',
    'GROUPS_THINK',
    'AGENTS_THINK',
    'GROUPS_VETO',
    // agent/groups execute queue actions
    'FEATURES_EXEC',
    'AGENTS_EXEC',
    'GROUPS_EXEC',
    // simulation
    'SIM_EVAL',
    'REFEREE_EVAL',
    // display output
    'UI_UPDATE',
    'VIS_UPDATE',
    'VIS_RENDER'
  ]
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { GAME_LOOP };
