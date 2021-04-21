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
    `INPUTS`,
    // INPUT_AGENTS_UPDATE is not necessary since it just runs agentUPDATE?
    // 'INPUT_AGENTS_UPDATE', // just for input agents to render while inputs are moving
    // `AGENTS_UPDATE`, // don't want map editor agents to update
    `VIS_UPDATE`,
    'VIS_RENDER'
  ],
  GLOOP_CONTROL: ['SYSEX'], // system change before start of GLOOP
  GLOOP: [
    // get state and queue derived state
    'INPUTS',
    'PHYSICS',
    'TIMERS',
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
