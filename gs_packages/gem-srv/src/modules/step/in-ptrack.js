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

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('IN-PTRACK', 'TagInput');

/// INITIALIZE ENTITY POOL //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PTM = new PTrackEndPoint();

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
  return PTM.GetEntities(ms);
}

/// MODULE EXPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
