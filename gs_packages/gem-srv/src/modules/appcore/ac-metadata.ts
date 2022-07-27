/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage project metadata

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as DCPROJECT from 'modules/datacore/dc-project';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-META', 'TagCyan');
const DBG = false;

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('metadata');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
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

/// INTERCEPT STATE UPDATE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Intercept changes to metadata so we can cache the changes
 *  for later write to DB after some time has elapsed. Returns the modified
 *  values, if any, for subsequent update to GSTATE and publishState
 */
function hook_Filter(key, propOrValue, propValue) {
  if (DBG) console.log('hook_Filter', key, propOrValue, propValue);
  // No need to return anything if data is not being filtered.
  // also update datacore
  const metadata = propOrValue;
  if (key === 'metadata') DCPROJECT.UpdateProjectData({ metadata });
  // return undefined;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Optionally fire once all state change hooks have been processed.
 *  This is provided as the second arg of addChangeHook()
 */
function hook_Effect(effectKey, propOrValue, propValue) {
  if (DBG) console.log('hook_Effect called', effectKey, propOrValue, propValue);
  if (effectKey === 'metadata') {
    if (DBG) console.log(...PR(`effect ${effectKey} = ${propOrValue}`));
    // (a) start async autosave
    DCPROJECT.ProjectFileRequestWrite();
  }
  // otherwise return nothing to handle procesing normally
}

/// ADD LOCAL MODULE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
addChangeHook(hook_Filter);
addEffectHook(hook_Effect);

/// CONVENIENCE METHODS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function updateAndPublish(metadata) {
  updateKey({ metadata });
  _publishState({ metadata });
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Handled by class-project

/// ACCESSORS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies

function GetMetadata() {
  return { ..._getKey('metadata') }; // clone
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetBoundary() {
  const metadata = _getKey('metadata');
  if (!metadata) return { width: 0, height: 0, bgcolor: 0 }; // not loaded yet
  const width = metadata.right - metadata.left;
  const height = metadata.bottom - metadata.top;
  const bgcolor = metadata.bgcolor;
  return { width, height, bgcolor };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Test function used by feat-movement to determine whether a wall
 * is set to wrap or prevent passing
 *
 * `wrap` was previously saved as an array of strings by both the
 * project settings editor and the `.gemprj` file.  It has since
 * been fixed so wraps are saved as an array of booleans.
 * @param {string} wall - 'top', 'right', 'bottom', 'left', or 'any'
 * @returns
 */
function Wraps(wall = 'any') {
  const BOUNDS = _getKey('metadata');

  /**
   * Converts the stored value to a boolean
   * for backward compatibility with older string wraps
   * @param {any} val - Could be boolean or string
   * @returns boolean
   */
  function toBoolean(val) {
    return String(val).toLowerCase().trim() === 'true';
  }

  // convert string ("true", "true") to boolean array
  const wrap = BOUNDS ? BOUNDS.wrap : undefined;
  let wallWrap;
  if (!wrap) {
    // default if wrap is not set
    wallWrap = [false, false, false, false];
  } else if (!Array.isArray(wrap)) {
    // wrap is a single value -- this shouldn't happen
    const w = toBoolean(wrap);
    wallWrap = [w, w, w, w];
  } else if (wrap.length === 4) {
    wallWrap = wrap.map(w => toBoolean(w));
  } else if (wrap.length === 2) {
    wallWrap = [
      toBoolean(wrap[0]), // top
      toBoolean(wrap[1]), // right
      toBoolean(wrap[0]), // bottom
      toBoolean(wrap[1]) // left
    ];
  } else if (wrap.length === 1) {
    wallWrap = [
      toBoolean(wrap[0]), // top
      toBoolean(wrap[0]), // right
      toBoolean(wrap[0]), // bottom
      toBoolean(wrap[0]) // left
    ];
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

/// UPDATERS //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** API: Use this to initialize the data
 *  This will trigger a state update without writing to disk.
 */
function SetMetadata(projId, metadata) {
  if (DBG) console.log(...PR('ac-metadata setting metadata to', metadata));
  // Update datacore
  DCPROJECT.UpdateProjectData({ metadata });
  updateAndPublish(metadata);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { GetMetadata, GetBoundary, Wraps, SetMetadata };
