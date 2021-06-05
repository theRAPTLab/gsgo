/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Data Data Core

  IMPORTANT: This should only be imported to components that run on the main
  server!  Other pages (e.g. ScriptEditor, CharController, and Viewer do not
  have direct access to project data)

  This should be a pure data class that maintains a list of input objects
  and the agents it updates.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as TRANSPILER from 'script/transpiler';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const MODEL: any = {};
const BOUNDS: any = {};

/// PRIVATE METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_UpdateDCBounds(bounds) {
  BOUNDS.top = bounds.top;
  BOUNDS.right = bounds.right;
  BOUNDS.bottom = bounds.bottom;
  BOUNDS.left = bounds.left;
  BOUNDS.wrap = bounds.wrap;
  BOUNDS.bounce = bounds.bounce;
  BOUNDS.bgcolor = bounds.bgcolor;
}
export function UpdateDCModel(model) {
  MODEL.label = model.label;
  MODEL.scripts = model.scripts;
  MODEL.instances = model.instances;
  const bounds = model.bounds || {
    top: -400, // default if not set
    right: 400,
    bottom: 400,
    left: -400
  };
  m_UpdateDCBounds(bounds);
}

/// BOUNDS METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// REVIEW: Can we handle all this with the REQ_PROJDATA calls?
//         so we don't even need this class?

export function SetInputStageBounds(width, height) {}
export function GetBounds() {
  return BOUNDS;
}
export function GetBoundary() {
  const width = BOUNDS.right - BOUNDS.left;
  const height = BOUNDS.bottom - BOUNDS.top;
  const bgcolor = BOUNDS.bgcolor;
  return { width, height, bgcolor };
}
export function SendBoundary() {
  const boundary = GetBoundary();
  UR.RaiseMessage('NET:SET_BOUNDARY', {
    width: boundary.width,
    height: boundary.height,
    bgcolor: boundary.bgcolor
  });
}
/**
 * Test function used by feat-movement to determine whether a wall
 * is set to wrap or prevent passing
 * @param {string} wall
 * @returns
 */
export function Wraps(wall = 'any') {
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

/// BLUEPRINT METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of properties {name, type, defaultvalue, isFeatProp}
 * that have been defined by the blueprint.
 * Used to populate property menus when selecting properties to show
 * in InstanceInspectors
 * @param {string} blueprintName
 * @param {string} [modelId=currentModelId]
 * @return {Object[]} [...{ name, type, defaultValue, isFeatProp }]
 */
export function GetBlueprintProperties(blueprintName) {
  const blueprint = MODEL.scripts.find(s => s.id === blueprintName);
  if (!blueprint) return []; // blueprint was probably deleted
  const script = blueprint.script;
  return TRANSPILER.ExtractBlueprintProperties(script);
}
