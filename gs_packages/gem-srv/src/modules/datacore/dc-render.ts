/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  RENDERER DATA STRUCTURES

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as PIXI from 'pixi.js';
import { Visual } from 'lib/t-visual';
import { ISyncMap, ISyncResults } from 'lib/t-pool';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let CONTAINERS: { Root: PIXI.Container }; // PixiJS container reference

/// RENDERPASS SYNCMAPS
let RP_DOBJ_TO_VOBJ: ISyncMap; // renderpass for model sprites
let RP_PTRAK_TO_VOBJ: ISyncMap; // renderpass for ptrack marker sprites
let RP_ANNOT_TO_VOBJ: ISyncMap; // renderpass for annotation marker sprites

/// RENDERPASS STORAGE ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SetModelRP(map: ISyncMap) {
  RP_DOBJ_TO_VOBJ = map;
  return map;
}
export function GetModelRP() {
  return RP_DOBJ_TO_VOBJ;
}
export function SetTrackerRP(map: ISyncMap) {
  RP_PTRAK_TO_VOBJ = map;
  return map;
}
export function GetTrackerRP() {
  return RP_PTRAK_TO_VOBJ;
}
export function SetAnnotRP(map: ISyncMap) {
  RP_ANNOT_TO_VOBJ = map;
  return map;
}
export function GetAnnotRP() {
  return RP_ANNOT_TO_VOBJ;
}

/// ADD VISUALS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RP_AddModelVisual(vis: Visual) {
  if (CONTAINERS) {
    vis.add(CONTAINERS.Root);
    return;
  }
  console.warn('could not add ModelVisual because root undefined');
}
export function RP_AddTrackerVisual(vis: Visual) {
  if (CONTAINERS) {
    vis.add(CONTAINERS.Root);
    return;
  }
  console.warn('could not add TrackerVisual because root undefined');
}
