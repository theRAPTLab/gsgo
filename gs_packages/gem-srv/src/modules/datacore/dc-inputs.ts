/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Inputs Phase Machine Interface

  This should be a pure data class that maintains a list of input objects
  and the agents it updates.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as ACBlueprints from '../appcore/ac-blueprints';
import InputDef from '../../lib/class-input-def';
import SyncMap from '../../lib/class-syncmap';
import { DeleteAgent } from './dc-agents';
import { DistanceTo, Lerp, Rotate } from '../../lib/util-vector';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SAMPLE_FPS = 30;
const INTERVAL = (1 / SAMPLE_FPS) * 1000;
let FRAME_TIMER;

let STAGE_WIDTH = 100; // default
let STAGE_HEIGHT = 100; // default

export const INPUT_GROUPS = new Map(); // Each device can belong to a specific group
export const INPUTDEFS = []; //
const ACTIVE_DEVICES = new Map();

const PR = UR.PrefixUtil('DCINPT');
const DBG = false;

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Transforms unit values to project values
 * @param numberString CharControl output is -0.5 to 0.5
 * @returns
 */
function transformX(numberString: string) {
  const n = Number(numberString);
  return n * STAGE_WIDTH;
}
function transformY(numberString: string) {
  const n = Number(numberString);
  return n * STAGE_HEIGHT;
}

// "UADDR_340" to "340"
function UADDRtoID(uaddr) {
  return String(uaddr).substring(6);
}
// "CC340_0" to "340"
function COBJIDtoID(cobjid) {
  // pozyx
  if (cobjid.startsWith('ft-pozyx')) return String(cobjid).substring(8);
  // CharControl
  const re = /([0-9])+/;
  const result = re.exec(cobjid);
  if (result === null)
    throw new Error(`dc-inputs: Unable to retrieve id of ${cobjid}`);
  return re.exec(cobjid)[0];
}
// "CC340_0" to "340_0"
function COBJIDtoID_n(cobjid) {
  return String(cobjid).substring(2);
}
// "UDEV_340:0" to "340"
function UDIDtoID(udid) {
  const re = /([0-9])+\w/;
  return re.exec(udid)[0];
}

/// DATA UPDATE ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Control Object (from CharControl) Sync to InputDef
const COBJ_TO_INPUTDEF = new SyncMap({
  Constructor: InputDef,
  autoGrow: true,
  name: 'CObjToAgent'
});
COBJ_TO_INPUTDEF.setMapFunctions({
  onAdd: (cobj: any, inputDef: InputDef) => {
    inputDef.x = transformX(cobj.x);
    inputDef.y = transformY(cobj.y);
    // HACK Blueprints into cobj
    inputDef.bpid = cobj.bpid;
    inputDef.label = cobj.label;
    inputDef.framesSinceLastUpdate = 0;
  },
  onUpdate: (cobj: any, inputDef: InputDef) => {
    inputDef.x = transformX(cobj.x);
    inputDef.y = transformY(cobj.y);
    inputDef.bpid = cobj.bpid;
    inputDef.label = cobj.label;
    inputDef.framesSinceLastUpdate = 0;
  },
  shouldRemove: (inputDef, map) => {
    // Inputs do not necessarily come in with every INPUTS phase fire
    // so we should NOT be removing them on every update.

    // HACK: Remove agent if no update for 4 seconds
    inputDef.framesSinceLastUpdate++;
    if (inputDef.framesSinceLastUpdate > 120) {
      return true;
    }

    // HACK
    // Remove agents that no longer have active devices
    // cobj = {id, name, blueprint, bpname, valid, x, y}
    //         id = "CC340_0"
    return !ACTIVE_DEVICES.has(COBJIDtoID(inputDef.id));

    // HACK Never Remove for now.
    // return false;

    // REVIEW: At some point, we'll want remove when CharControllers
    //         drop out.  This is hack where we insert a frameCount
    //         into the def to keep track
    //
    // const REMOVAL_THRESHOLD = -1;
    // const instance = map.get(cobj.id);
    // console.error('shouldRemove', cobj, map, instance);
    // if (instance) {
    //   instance.frameCount = instance.frameCount++ || 0;
    //   if (instance.frameCount > REMOVAL_THRESHOLD) return true;
    // }
  }
});
/**
 *
 * @param changes {valid: boolean, selected: object[], quantified: object[] }
 *                devObject = { udid = "UDEV_340:0",
 *                              meta = { uaddr: "UADDR_340", uapp, uapp_tags, uclass, uname }
 *                            , inputs, outputs}
 */
function UpdateActiveDevices(changes) {
  // `changes` only contains the devices that notify is announcing
  // we actually want to update ALL devices.
  const devices = UR.GetDeviceDirectory();
  const inputDevices = devices.filter(d => d.meta.uclass === 'CharControl');
  ACTIVE_DEVICES.clear();
  inputDevices.forEach(d => ACTIVE_DEVICES.set(UDIDtoID(d.udid), true));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// POZYX DATA UPDATE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// Default
export const POZYX_TRANSFORM = {
  scaleX: 0,
  scaleY: 0,
  translateX: 0,
  translateY: 0,
  rotate: 0,
  useAccelerometer: true
};

// VU
// export const POZYX_TRANSFORM = {
//   scaleX: -0.0002, // -0.0002
//   scaleY: 0.00016, // 0.0003
//   translateX: -4200, //0
//   translateY: -6000, //0
//   rotate: 0, // -160
//   useAccelerometer: true
// };

// IU
// add when finished

// BEN
/* export const POZYX_TRANSFORM = {
  scaleX: -0.0002, // -0.0002
  scaleY: 0.0003, // 0.0003
  translateX: 0,
  translateY: 0,
  rotate: -160, // -160
  useAccelerometer: true
}; */

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_PozyxTransform(position: {
  x: number;
  y: number;
}): { x: number; y: number } {
  let tx = Number(position.x);
  let ty = Number(position.y);

  // 1. Rotate
  const rad = (POZYX_TRANSFORM.rotate * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  tx = tx * c - ty * s;
  ty = tx * s + ty * c;

  // 2. Translate
  tx += POZYX_TRANSFORM.translateX;
  ty += POZYX_TRANSFORM.translateY;

  // 3. Scale
  tx *= POZYX_TRANSFORM.scaleX;
  ty *= POZYX_TRANSFORM.scaleY;

  return { x: tx, y: ty };
}
/// Returns a value between 0 and 1 to use for lerps
function m_GetAccelerationMultiplier(n: number): number {
  // acceleration units in mg (gravity)
  // Adjust thresholds and values to smooth behavior
  if (n > 1000) return 0.8; // fast
  if (n > 500) return 0.5; // medium
  if (n > 250) return 0.1; // deliberate move
  if (n > 50) return 0.05; // sleep threshold / standing still
  return 0; // n <= 50, resting on a hard surface, don't move at all
}
/// Use accelerometer data to reduce jitter
function m_PozyxDampen(
  lastPosition: { x: number; y: number },
  rawEntityPosition: { x: number; y: number },
  acc: { x: number; y: number; z: number }
): { x: number; y: number } {
  //  api-input retrieves entity data at 30fps.
  //  but Pozyx only sends updates at 15fps.
  //  So every other frame is repeated with the same values.
  //  To smooth this out, we only move toward the entity position
  //  rather than jumping straight to the entity position.

  // lastPosition is already transformed
  const newPosition = m_PozyxTransform(rawEntityPosition);

  // If accelerometer movement is high, allow large movement
  // If acceleromoter movement is low, allow only small movmeent
  const gforce = Rotate(acc, POZYX_TRANSFORM.rotate); // rotate accelerometer readings to match stage
  gforce.x = Math.abs(gforce.x); // we just want magnitude
  gforce.y = Math.abs(gforce.y);
  let xm = m_GetAccelerationMultiplier(gforce.x); // x multiplier
  let ym = m_GetAccelerationMultiplier(gforce.y);

  // protect against sleep jump
  // While wearables sleep, they have a tendency to emit bad positions
  if (
    gforce.x < 250 &&
    gforce.y < 250 &&
    DistanceTo(lastPosition, newPosition) > 0.25
  )
    return lastPosition;

  // lerp
  // => still hitchy
  const x = Lerp(lastPosition.x, newPosition.x, xm);
  const y = Lerp(lastPosition.y, newPosition.y, ym);

  // console.log(
  //   // acc.x,
  //   // limiter.x,
  //   Number(xm).toFixed(2),
  //   // Number(dx).toFixed(4),
  //   // acc.y,
  //   // limiter.y,
  //   Number(ym).toFixed(2)
  //   // Number(dy).toFixed(4)
  // );

  return { x, y };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function GetDefaultPozyxBpid() {
  const bpidItem = ACBlueprints.GetPozyxControlDefaultBpid();
  if (bpidItem) return bpidItem.id;
  throw new Error('dc-inputs.GetDefaultpozyxzBpid could not find a default bpid');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const POZYX_TO_COBJ = new SyncMap({
  Constructor: InputDef,
  autoGrow: true,
  name: 'TrackedEntityToCObj'
});
POZYX_TO_COBJ.setMapFunctions({
  onAdd: (entity: any, cobj: InputDef) => {
    const { x, y } = m_PozyxTransform({ x: entity.x, y: entity.y });
    cobj.x = x;
    cobj.y = y;
    // HACK Blueprints into cobj
    cobj.bpid = GetDefaultPozyxBpid(); // GetDefaultPozyxBPName();
    cobj.label = String(entity.id).startsWith('ft-pozyx')
      ? entity.id.substring(8)
      : entity.id;
  },
  onUpdate: (entity: any, cobj: InputDef) => {
    let pos = { x: entity.x, y: entity.y };
    if (entity.acc && POZYX_TRANSFORM.useAccelerometer) {
      // has accelerometer data
      pos = m_PozyxDampen(cobj, pos, entity.acc); // dampen + transform
    } else {
      pos = m_PozyxTransform(pos);
    }

    cobj.x = pos.x;
    cobj.y = pos.y;
    cobj.bpid = GetDefaultPozyxBpid(); // GetDefaultPozyxBPName();
    cobj.label = String(entity.id).startsWith('ft-pozyx')
      ? entity.id.substring(8)
      : entity.id;
  },
  shouldRemove: cobj => false
  // Inputs do not necessarily come in with every INPUTS phase fire
  // so we should NOT be removing them on every update.
  // HACK: Remove agent if no update for 4 seconds
  // inputDef.framesSinceLastUpdate++;
  // if (inputDef.framesSinceLastUpdate > 120) {
  //   return true;
  // }
});
export function GetTrackerMap() {
  return POZYX_TO_COBJ;
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SetInputStageBounds(width, height) {
  STAGE_WIDTH = width;
  STAGE_HEIGHT = height;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export async function InputInit(bpname: string) {
  // STEP 1 is to get a "deviceAPI" from a Device Subscription
  const devAPI = UR.SubscribeDeviceSpec({
    // set group here
    selectify: device =>
      device.meta.uclass === 'CharControl' &&
      device.meta.uapp_tags.includes(`bp_${bpname}`),
    quantify: list => list,
    notify: changes => {
      UpdateActiveDevices(changes);
      // NOTE: `removed` is not implemented yet.
      // There's a HACK in client-netdevices to always send a notify
      // update to get around this.
      // const { valid, added, updated, removed } = changes;
      // console.error(...PR('notify', changes));
    }
  });
  INPUT_GROUPS.set(bpname, devAPI);
  // console.error('input_groups', INPUT_GROUPS);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function InputUpdate(devAPI, bpname) {
  // STEP 2 is to grab the getController('name') method which we
  // can call any time we want without mucking about with device
  // interfaces
  const { getController, deviceNum, unsubscribe } = devAPI;
  const { getInputs, getChanges, putOutputs } = getController('markers'); // group = markers

  // WORKING VERSION
  const raw_cobjs = getInputs().slice();
  // HACK: Stuff Blueprint spec into the cobjs for now
  // Technically cobjs should not have a blueprint parameter
  // but InputDefs need it to be able to generate an agent.
  const overriden_cobjs = raw_cobjs.map(o => {
    o.bpid = bpname;
    o.label = o.id;
    return o;
  });
  if (DBG) console.log('cobs', overriden_cobjs);
  COBJ_TO_INPUTDEF.syncFromArray(overriden_cobjs);
  COBJ_TO_INPUTDEF.mapObjects();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function InputsUpdate() {
  // The basic pipeline is:
  // inputs => INPUTDEFS => AGENTS
  //
  // Inputs from all sources (charcontrol, PTrack, Pozyx, faketrack)
  // are all converted to INPUTDEFS here.

  // 1. Process Char Control inputs
  const blueprintNames = Array.from(INPUT_GROUPS.keys());
  INPUTDEFS.length = 0; // Clear INPUTDEFS with each update
  blueprintNames.forEach(bpname => {
    InputUpdate(INPUT_GROUPS.get(bpname), bpname);
  });
  // 2. Process PTrack, Pozyx, FakeTrack Inputs
  //    PTRACK_TO_COBJ is regularly updated by api-input.StartTrackerVisuals
  // SRI: it would have been much clearer if you coded a parallel structure
  // for the above to show COBJ_TO_INPUTDEF was used by both methods
  COBJ_TO_INPUTDEF.syncFromArray(POZYX_TO_COBJ.getMappedObjects());
  COBJ_TO_INPUTDEF.mapObjects();
  // 3. Combine them all
  INPUTDEFS.push(...COBJ_TO_INPUTDEF.getMappedObjects());
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetInputGroups(): any {
  return INPUT_GROUPS;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetInputDefs(): object[] {
  return INPUTDEFS;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Trigger deletion of Input Agents after agent blueprint is recompiled
 * Input agents should re-create themsevles with next INPUT cycle
 */
export function InputsReset() {
  const defs = GetInputDefs();
  defs.forEach(d => DeleteAgent(d));
}
