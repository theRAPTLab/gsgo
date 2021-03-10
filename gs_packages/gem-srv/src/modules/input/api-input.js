/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PTRACK INTERFACE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as PTRACK from 'modules/step/in-ptrack';
import { GetTrackerRP, OutSyncResults } from 'modules/datacore/dc-render';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM-INPUT', 'TagInput');
const DBG = false;

/// CHEESE TESTING ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// this should stuff the changes into datacore
/// and api-render needs to move its data to datacore as well
let CHEESE_COUNT = 0;
const FRAMERATE = 30;
const INTERVAL = (1 / FRAMERATE) * 1000;

/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function Init() {
  console.log(...PR('should initialize'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function ConnectTracker() {
  // turn-on PTRACK module
  PTRACK.Connect(document.domain);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function StartTrackerVisuals() {
  const RP = GetTrackerRP();
  // start test timer
  setInterval(() => {
    const m_entities = PTRACK.GetInputs(500);
    let out = [];
    /** CHEESE TESTING HERE **/
    out.push(...OutSyncResults(RP.syncFromArray(m_entities)));
    RP.mapObjects(); // note that this has to be disabled in api-render
    if (DBG) console.log(...out);
  }, INTERVAL);
}

/// PHASE MACHINE INTERFACES //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('UR/LOAD_CONFIG', () => {
  const addr = document.domain;
  console.log(...PR('Initializing Connection to', addr));
  ConnectTracker(addr);
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('UR/APP_CONFIGURE', () => {
  // this fires after UR/LOAD_ASSETS, so sprites are loaded
  const addr = document.domain;
  console.log(...PR('Starting Tracker Visuals', addr));
  StartTrackerVisuals();
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('SIM/INPUTS', () => {
  console.log('sim/input');
});
