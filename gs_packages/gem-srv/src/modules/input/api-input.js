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
  /** TESTING HERE **/
  const m_entities = PTRACK.GetInputs(500);
  if (m_entities.length > 0) console.log('entity.x', m_entities[0].x);
  else console.log('no entity');
  /* WHAT NOW? */
}, 500);

/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function Init() {
  PTRACK.Connect(document.domain);
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
