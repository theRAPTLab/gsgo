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
    // Set up thet stage
    // GLOOP_STAGED completed, monitor inputs before run
    'INPUTS_READ',
    'INPUTS_UPDATE',

    // allow creation of new objects???????
    'CREATE',
    'DELETE',

    'PHYSICS_UPDATE',
    'PHYSICS_THINK',

    // update static graphs during pre-run
    'GRAPHS_UPDATE',

    // 'INPUTS_EXEC', // Don't allow cursor attachment during PRERUN!
    'UI_UPDATE',
    'VIS_UPDATE',
    'VIS_RENDER'
  ],
  GLOOP_COSTUMES: [
    // Attach cursors to agents
    'INPUTS_READ',
    'INPUTS_UPDATE',
    'PHYSICS_UPDATE',
    'PHYSICS_THINK',

    // update static graphs during pre-run
    'GRAPHS_UPDATE',

    // process conditions and collection
    'CONDITIONS_UPDATE', // for agent pickup

    // attach cursor to agent
    'INPUTS_EXEC',
    // display output
    'UI_UPDATE',
    'VIS_UPDATE',
    'VIS_RENDER'
  ],
  GLOOP_POSTRUN: [
    // After a run, keep objects around for inspection
    // No INPUTS -- so Pozyx/PTrack objects stop moving?
    //              AND how do we keep them from getting removed?
    'UI_UPDATE',
    'VIS_UPDATE',
    'VIS_RENDER'
  ],
  GLOOP_CONTROL: ['SYSEX'], // system change before start of GLOOP
  GLOOP: [
    // get state and queue derived state
    'INPUTS_READ',
    'INPUTS_UPDATE',
    'CREATE',
    'DELETE',
    'TIMERS',
    'PHYSICS_UPDATE',
    'PHYSICS_THINK',
    // attach cursor to agent
    'INPUTS_EXEC',
    // agent/groups autonomous updates
    'AGENTS_UPDATE',
    'AGENTS_EVENT',
    'GROUPS_UPDATE',
    'FEATURES_UPDATE',

    // update static graphs during pre-run
    'GRAPHS_UPDATE',

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
