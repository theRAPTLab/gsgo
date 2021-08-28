/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage project metadata

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-META', 'TagCyan');
const DBG = true;

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('metadata');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
  // dummy
  metadata: [
    {
      top: -100,
      right: 100,
      bottom: 100,
      left: -100,
      wrap: [false, false],
      bounce: false,
      bgcolor: '0x006666',
      roundsCanLoop: false
    }
  ]
});
/// These are the primary methods you'll need to use to read and write
/// state on the behalf of code using APPCORE.
const { stateObj, flatStateValue, _getKey, updateKey } = STATE;
/// For handling state change subscribers, export these functions
const { subscribe, unsubcribe } = STATE;
/// For React components to send state changes, export this function
const { handleChange } = STATE;
/// For publishing state change, this can be used inside this module
/// DO NOT CALL THIS FROM OUTSIDE
const { _publishState } = STATE;
/// To allow outside code to modify state change requests on-the-fly,
/// export these functions
const { addChangeHook, deleteChangeHook } = STATE;
const { addEffectHook, deleteEffectHook } = STATE;

/// ADD LOCAL MODULE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
addChangeHook(hook_Filter);
addEffectHook(hook_Effect);

/// LOADER ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function updateAndPublish(projId, metadata) {
  updateKey({ projId, metadata });
  _publishState({ metadata });
}

/// INTERCEPT STATE UPDATE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let AUTOTIMER;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Intercept changes to locale.transform so we can cache the changes
 *  for later write to DB after some time has elapsed. Returns the modified
 *  values, if any, for subsequent update to GSTATE and publishState
 */
function hook_Filter(key, propOrValue, propValue) {
  console.log('hook_Filter', key, propOrValue, propValue);
  if (key === 'metadata') return [key, propOrValue, propValue];
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return Promise to write to database */
function promise_WriteTransform() {
  const projId = _getKey('projId');
  const input = _getKey('metadata');
  return UR.Mutate(
    `
    mutation UpdateMetadata($projectId:String $input:ProjectMetaInput) {
      updateMetadata(projectId:$projectId,input:$input) {
        top
        right
        bottom
        left
        wrap
        bounce
        bgcolor
        roundsCanLoop
      }
    }`,
    {
      input,
      projectId: projId
    }
  );
}
// Test Function
// window.writeMeta = () => promise_WriteTransform();
// window.changeMeta = () => UR.WriteState('metadata', 'metadata', { top: -1000 });

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Optionally fire once all state change hooks have been processed.
 *  This is provided as the second arg of addChangeHook()
 */
function hook_Effect(effectKey, propOrValue, propValue) {
  console.error('hook_Effect called', effectKey, propOrValue, propValue);
  if (effectKey === 'metadata') {
    if (DBG) console.log(...PR(`effect ${effectKey} = ${propOrValue}`));
    // (a) start async autosave
    if (AUTOTIMER) clearInterval(AUTOTIMER);
    AUTOTIMER = setInterval(() => {
      promise_WriteTransform().then(response => {
        const metadata = response.data.updateMetadata;
        updateKey('metadata', metadata);
        _publishState({ metadata });
      });
      clearInterval(AUTOTIMER);
      AUTOTIMER = 0;
    }, 1000);
  }
  // otherwise return nothing to handle procesing normally
}

/// DATABASE QUERIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOT USED: If metadata ever loaded themselves this is the call
async function m_LoadMetadata(projId) {
  if (DBG) console.log(...PR('(1) GET METADATA'));
  const response = await UR.Query(
    `
    query GeMetadata($id:String!) {
      project(id:$id) {
        metadata { top right bottom left wrap bounce bgcolor roundsCanLoop }
      }
    }
  `,
    { id: projId }
  );
  if (!response.errors) {
    const { metadata } = response.data;
    updateAndPublish(metadata);
  }
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Handled by class-project

/// ACCESSORS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies

export function GetBoundary() {
  const metadata = _getKey('metadata');
  if (!metadata) return { width: 0, height: 0, bgcolor: 0 }; // not loaded yet
  const width = metadata.right - metadata.left;
  const height = metadata.bottom - metadata.top;
  const bgcolor = metadata.bgcolor;
  return { width, height, bgcolor };
}

/**
 * Test function used by feat-movement to determine whether a wall
 * is set to wrap or prevent passing
 * @param {string} wall
 * @returns
 */
export function Wraps(wall = 'any') {
  const BOUNDS = _getKey('metadata');
  const wrap = BOUNDS ? BOUNDS.wrap : undefined;
  let wallWrap;
  if (!wrap) {
    // default if wrap is not set
    wallWrap = [false, false, false, false];
  } else if (!Array.isArray(wrap)) {
    wallWrap = [wrap, wrap, wrap, wrap];
  } else if (wrap.length === 4) {
    wallWrap = wrap;
  } else if (wrap.length === 2) {
    wallWrap = [wrap[0], wrap[1], wrap[0], wrap[1]];
  }
  switch (wall) {
    case 'top':
      return wallWrap[0];
    case 'right':
      return wallWrap[1];
    case 'bottom':
      return wallWrap[2];
    case 'left':
      return wallWrap[3];
    case 'any':
    default:
      // Generally you should only call this if there is a single wrap setting
      return wallWrap[0];
  }
}
