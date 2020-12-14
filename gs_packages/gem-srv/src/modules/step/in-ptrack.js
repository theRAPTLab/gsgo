/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This PTRACK INPUT MODULE handles a few things:

  1. Use a PTrack Endpoint to manage the stream of raw PTRACK entities
  2. Denoise raw PTRACK entities
  3. Maintain 'active' entities from frame-to-frame
  4. Align raw PTRACK entity coordinates into simulation coordinates
  5. Provide the current 'active' entities list to requesters

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import SyncMap from 'lib/class-syncmap';
import PTrackEndPoint from './lib/class-ptrack-endpoint';
import EntityObject from './lib/class-entity-object';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('IN-PTRACK', 'TagRed');
const DBG = false;

/// FILTER SETTINGS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DEFAULT = {
  ptRadius: 0.1,
  ptMaxAge: 66,
  ptMinAge: 16
};
let MAX_NOP = 500;
let MIN_AGE = 350;
let MIN_NOP = MIN_AGE / 2;
let SRADIUS = 0.0001;
let CULL_YOUNGLINGS = true;

/// INITIALIZE ENTITY POOL //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PTM = new PTrackEndPoint();
const VALID_ENTITIES = new SyncMap({
  Constructor: EntityObject,
  autoGrow: true,
  name: 'RawEntityValidator'
});
/*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    VALID_ENTITIES is a SyncMap that maps the raw entity data from
    the PTrack Endpoint into stable pieces
:*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
VALID_ENTITIES.setMapFunctions({
  onAdd: (raw, eo) => {
    eo.copy(raw);
    eo.nop = 0;
    eo.age = 0;
  },
  onUpdate: (raw, eo) => {
    eo.x = raw.x;
    eo.y = raw.y;
  },
  // this is called if an id disappears
  shouldRemove: (eo, seen_eos) => {
    // delete anyone who has not updated in a while
    if (eo.nop > MAX_NOP) return true;
    // delete "of-age" entities with too many nops
    if (eo.age > MIN_AGE && eo.nop > MAX_NOP) return true;
    // delete intermittent pop-in entities
    if (eo.age - eo.nop < MIN_NOP) return true;
    // if clustered close together, cull all but the senior
    if (eo.age < MAX_NOP || CULL_YOUNGLINGS)
      return !m_IsOldestInRadius(eo, seen_eos);
    // otherwise, we need to age
    eo.nop += 66; /* HACK NEED GLOBAL FRAMETIME */
    eo.age += 66;
    // dont remove yet
    return false;
  },
  onRemove: eo => {}
});

/// SIMPLIFIED TRACKER INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: ptrackServer is where the forwarded UDP data from PTRACK is being
 *  served, usually on port 3030 (e.g. ws://localhost:3030)
 */
export function Connect(ptrackServer) {
  console.assert(ptrackServer, 'Must pass ServerAddress?');
  // Initialize PTRACK connection
  console.group(...PR('creating PTRACK endpoint'));
  PTM.Connect(ptrackServer);
  UpdateFilterSettings();
  console.groupEnd();
} /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: main way to retrieve a valid array of current entity inputs in
 *  the system
 */
export function GetInputs(ms) {
  const raw = PTM.GetCachedEntities();
  PTM.ClearCachedEntities(); // expressly clear diction

  VALID_ENTITIES.syncFromArray(raw); // update deltas
  VALID_ENTITIES.mapObjects(); // process the deltas
  if (DBG) {
    const { added, updated, removed } = VALID_ENTITIES.getDeltaArrays();
    let out = '';
    if (added.length > 0) out += `added ${added.length}  `;
    if (updated.length > 0) out += `updated ${updated.length}  `;
    if (removed.length > 0) out += `removed ${removed.length}  `;
    console.log(out);
  }
  return VALID_ENTITIES.getMappedObjects();
}

/// HELPER FUNCTIONS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** entity is checked against other entities in idsActive
 *  it's assumed that idsActive does NOT contain entity
 */
function m_IsOldestInRadius(entity, seenMap) {
  let rad2 = SRADIUS * SRADIUS;
  let result = true;
  let x2;
  let y2;
  seenMap.forEach((k, c) => {
    if (c === entity) return;
    x2 = (c.x - entity.x) ** 2;
    y2 = (c.y - entity.y) ** 2;
    // is point outside of circle? continue
    const out = x2 + y2 >= rad2;
    if (out) return;
    // otherwise we're inside, so check if older
    if (entity.age < c.age) {
      result = false;
      // merge position with baddies
      c.x = (c.x + entity.x) / 2;
      c.y = (c.y + entity.y) / 2;
    }
  });
  return result;
}

/// ENTITY HELPERS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Convert entity coordinates to gameworld gameworld coordinates.
 *  entity: { id, x, y, h, nop } - tracker coords
 *  trackerObject: { id, pos, valid } - game coords
 */
function m_TransformAndUpdate(entity) {
  // tracker space position
  let x = entity.x;
  let y = entity.y;
  let z = entity.h;

  console.log('entity', ...entity);
}

/// TRACKER ENTITY FILTERING PARAMETERS ///////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function UpdateFilterSettings() {
  // 	needs update to use Settings
  MAX_NOP = DEFAULT.ptMaxAge;
  MIN_AGE = DEFAULT.ptMinAge;
  SRADIUS = DEFAULT.ptRadius;
  MIN_NOP = MIN_AGE / 2;
  console.log('SET PTRACK DEFAULT VALUES', MAX_NOP, MIN_AGE, SRADIUS);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SetFilterTimeout(nop) {
  if (nop === undefined) return;
  if (nop < MIN_AGE) {
    console.warn('Timeout', nop, "can't be less than Age Threshold", MIN_AGE);
    return;
  }
  MAX_NOP = nop;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SetFilterAgeThreshold(age) {
  if (age === undefined) return;
  if (age > MAX_NOP) {
    console.warn('Age', age, "can't be greater than tout1", MAX_NOP);
    return;
  }
  MIN_AGE = age;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SetFilterFreshnessThreshold(threshold) {
  if (threshold === undefined) return;
  if (threshold > MIN_AGE / 2) {
    console.log(
      'Threshold',
      threshold,
      'should be lower compared to AgeThreshold'
    );
  }
  MIN_NOP = threshold;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SetFilterRadius(rad) {
  if (rad === undefined) return;
  if (Number.isNaN(rad)) {
    console.warn('SetFilterRadius expects a number, not', rad);
    return;
  }
  SRADIUS = rad;
}

/// MODULE EXPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
