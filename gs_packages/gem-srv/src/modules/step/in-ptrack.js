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

/// INITIALIZE ENTITY POOL //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PTM = new PTrackEndPoint();
const VALID_ENTITIES = new SyncMap({
  Constructor: EntityObject,
  autoGrow: true,
  name: 'GoodEntityList'
});
/*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    VALID_ENTITIES is a SyncMap that maps the raw entity data from
    the PTrack Endpoint into stable pieces
:*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
VALID_ENTITIES.setMapFunctions({
  onAdd: (raw, eo) => {
    eo.copy(raw);
  },
  onUpdate: (raw, eo) => {
    eo.x = raw.x;
    eo.y = raw.y;
  }
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
  PTM.UpdateFilterSettings();
  console.groupEnd();
} /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: main way to retrieve a valid array of current entity inputs in
 *  the system
 */
export function GetInputs(ms) {
  const raw = PTM.GetEntities();
  // PTM.ClearCachedEntities(); // expressly clear diction
  // if syncFromArray and mapObjects is working correctly, don't need to
  // clear cached entries
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

/// MODULE EXPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
