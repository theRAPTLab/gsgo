/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PTRACK INTERFACE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as PTRACK from 'modules/step/in-ptrack';
import { GetTrackerRP } from 'modules/datacore/dc-render';
import { GetTrackerMap, GetDefaultPozyxBPName } from 'modules/datacore/dc-inputs';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM-INPUT' /* 'TagInput' */);
const DBG = false;

/// CHEESE TESTING ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// this should stuff the changes into datacore
/// and api-render needs to move its data to datacore as well
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
function TrackerSetupIsOnline() {
  const devices = UR.GetDeviceDirectory();
  return devices.find(d => {
    return d.meta.uclass === 'TrackerSetup';
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function StartTrackerVisuals() {
  // REVIEW: Skip starting tracker if there are no pozyx mappings.
  //         Otherwise, dc-inputs will try to create instances with
  //         no blueprint names.
  const defaultPozyxBPName = GetDefaultPozyxBPName();
  if (!defaultPozyxBPName) return;

  const POZYX_TO_COBJ = GetTrackerMap();
  setInterval(() => {
    const entities = PTRACK.GetInputs(500);
    if (DBG) console.log(entities);
    POZYX_TO_COBJ.syncFromArray(entities);
    POZYX_TO_COBJ.mapObjects();

    // This sends entity data to PanelTracker so entity locations
    // can be monitored for setting up transforms.
    if (TrackerSetupIsOnline()) {
      UR.RaiseMessage('NET:ENTITY_UPDATE', {
        entities,
        tentities: POZYX_TO_COBJ.getMappedObjects()
      });
    }
  }, INTERVAL);

  // ORIG CODE
  // const RP = GetTrackerRP();
  // // start test timer
  // setInterval(() => {
  //   const m_entities = PTRACK.GetInputs(500);
  //   let out = [];
  //   /** CHEESE TESTING HERE **/
  //   out.push(...OutSyncResults(RP.syncFromArray(m_entities)));
  //   RP.mapObjects(); // note that this has to be disabled in api-render
  //   if (DBG) console.log(...out);
  // }, INTERVAL);
}

/// PHASE MACHINE INTERFACES //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('UR/LOAD_CONFIG', () => {
  const addr = document.domain;
  console.log(...PR('Initializing Connection to', addr));
  ConnectTracker(addr);
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Orig Call
// UR.HookPhase('UR/APP_CONFIGURE', () => {
//   Probably too early b/c DefaultPozyxBPNames are not loaded yet
//   so we don't know whether or not we can start StartTrackerVisuals
//
// Try SIM/STAGED instead
UR.HookPhase('SIM/STAGED', () => {
  // this fires after UR/LOAD_ASSETS, so sprites are loaded
  const addr = document.domain;
  StartTrackerVisuals();
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('SIM/INPUTS', () => {
  // console.log('sim/input');
});
