/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PTRACK INTERFACE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as PTRACK from 'modules/step/in-ptrack';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM-INPUT', 'TagRed');

/// CHEESE TESTING ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let FRAME_COUNT = 0;
setInterval(() => {
  const raw_entities = PTRACK.GetRawEntities();
  console.log(raw_entities);
  // console.log(raw_entities.length);
  /** HERE **/
}, 2000);

/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function Init() {
  PTRACK.Connect(document.domain);
  PTRACK.InitializeTrackerPiecePool({ count: 5 });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function ConnectTracker() {
  console.log(...PR('should connect to PTRACK'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function DisconnectTracker() {
  console.log(...PR('should disconnect from PTRACK'));
}

/// PHASE MACHINE INTERFACES //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('UR/LOAD_CONFIG', () => {
  const addr = document.domain;
  console.log(...PR('Initializing Connection to', addr));
  Init(addr);
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('SIM/INPUTS', () => {
  console.log('sim/input');
});
