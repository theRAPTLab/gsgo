/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The PTRACK module manages entity-related events and data, transforming
  them into simulation-friendly coordinates.

  As every physical installation has different requirements for the
  transformations, this module also provides methods to change transforms.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import {
  FilterConfig,
  PoolInitConfig,
  PoolUpdateConfig
} from './types/t-tracking';
import { LocationTransform, LocationDict } from './lib/class-location';
import TrackerPiece from './lib/class-tracker-piece';
import { EntityObject } from './types/t-ptrack';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.Prompt('INPUT');

const LOCATIONS: LocationDict = new Map();
let CURRENT_LOCATION = GetLastLocation();

const m_inputs: EntityObject[] = []; // array of trackerobjects
const m_pieces: TrackerPiece[] = []; // array of trackerpieces
const m_transform: LocationTransform = new LocationTransform();

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetLastLocation() {
  console.log(...PR('return last saved location'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NotifyLocationChanged() {
  console.log(...PR('event: location changed'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SetLocationTransform(locationObj: LocationTransform) {}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function UpdateLocationTransform() {
  // m1 = scale     m_transform.sx, sy, sz
  // m2 = rotate    m_transform.rx, ry, rz
  // m3 = translate m_transform.tx, ty, tz
  console.log(...PR('m_transform = scale * rotate * translate'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function InitializeTrackerPiecePool(param: PoolInitConfig) {
  const { makeF, initF, count } = param;
  console.log(...PR('create: trackerPiecePool'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: update tracker property of an array of pieces */
function UpdateTrackerPieces(param: PoolUpdateConfig) {
  const { lostF, addF } = param;
  console.log(...PR('update TrackerPieces from Input Data'));
  // unassignedEntities =  MapEntities(m_inputs, ms, addF, lostF)
  // add unassignedEntities to TrackerPool (expanding as necessary)
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function UpdateFilterSettings(param: FilterConfig) {
  const { MAX_NOP, MIN_AGE, SRADIUS } = param;
  console.log(...PR('setting filter values'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SetFilterAgeThreshold(age) {
  console.log(...PR('setting MIN_AGE'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SetFilterRadius(rad) {
  console.log(...PR('setting SRADIUS'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MapEntities(pieceDict, addF, lostF) {
  // get entity dictionary from PTRACK
  // iterate over m_pieces
  // return unassigned entities
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TransformAndUpdate(entity, tobj) {
  // trans x
}

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
console.log(...PR('UR.RegisterHooks(sysloop => {})'));

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
