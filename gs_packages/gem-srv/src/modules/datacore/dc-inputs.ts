/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Inputs Phase Machine Interface

  This should be a pure data class that maintains a list of input objects
  and the agents it updates.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import InputDef from '../../lib/class-input-def';
import SyncMap from '../../lib/class-syncmap';
import { DeleteAgent } from './dc-agents';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SAMPLE_FPS = 30;
const INTERVAL = (1 / SAMPLE_FPS) * 1000;
let FRAME_TIMER;

let STAGE_WIDTH = 100; // default
let STAGE_HEIGHT = 100; // default

let BPNAMES = []; // names of user-controllable blueprints
let POZYX_BPNAMES = [];

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
  const re = /([0-9])+\B/;
  // console.log(re.exec(cobjid));
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
// Control Object Sync to InputDef
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
    inputDef.bpname = cobj.bpname;
    inputDef.name = cobj.name;
    inputDef.framesSinceLastUpdate = 0;
  },
  onUpdate: (cobj: any, inputDef: InputDef) => {
    inputDef.x = transformX(cobj.x);
    inputDef.y = transformY(cobj.y);
    inputDef.bpname = cobj.bpname;
    inputDef.name = cobj.name;
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
export const POZYX_TRANSFORM = {
  scaleX: -0.0001, // -0.0001
  scaleY: 0.0001, // 0.001
  translateX: 0,
  translateY: 0,
  rotate: -190 // -190
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_PozyxTransform(position: {
  x: number;
  y: number;
}): { x: number; y: number } {
  let tx = Number(position.x);
  let ty = Number(position.y);

  // 1. Translate
  tx += POZYX_TRANSFORM.translateX;
  ty += POZYX_TRANSFORM.translateY;

  // 2. Rotate
  const rad = (POZYX_TRANSFORM.rotate * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  tx = tx * c - ty * s;
  ty = tx * s + ty * c;

  // 3. Scale
  tx *= POZYX_TRANSFORM.scaleX;
  ty *= POZYX_TRANSFORM.scaleY;

  return { x: tx, y: ty };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Return the first pozyx controllable blueprint for now
 * Eventually we'll add a more sophisticated map
 */
function GetDefaultPozyxBPName() {
  if (POZYX_BPNAMES.length < 1)
    throw new Error('No pozyx controllable blueprints defined!');
  return POZYX_BPNAMES[0];
}
export function SetPozyxBPNames(bpnames: string[]) {
  POZYX_BPNAMES = [...bpnames];
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
    cobj.bpname = GetDefaultPozyxBPName();
    cobj.name = entity.id;
  },
  onUpdate: (entity: any, cobj: InputDef) => {
    const { x, y } = m_PozyxTransform({ x: entity.x, y: entity.y });
    cobj.x = x;
    cobj.y = y;
    cobj.bpname = GetDefaultPozyxBPName();
    cobj.name = entity.id;
  },
  shouldRemove: (cobj, map) => {
    // Inputs do not necessarily come in with every INPUTS phase fire
    // so we should NOT be removing them on every update.
    // HACK: Remove agent if no update for 4 seconds
    // inputDef.framesSinceLastUpdate++;
    // if (inputDef.framesSinceLastUpdate > 120) {
    //   return true;
    // }
  }
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
/**
 * Determines which blueprint types can be controlled by user inputs
 * @param bpnames
 */
export function SetInputBPnames(bpnames: string[]) {
  BPNAMES = [...bpnames];
}
export function GetInputBPnames() {
  return BPNAMES;
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
    o.bpname = bpname;
    o.name = o.id;
    return o;
  });
  if (DBG) console.log('cobs', overriden_cobjs);
  COBJ_TO_INPUTDEF.syncFromArray(overriden_cobjs);
  COBJ_TO_INPUTDEF.mapObjects();
}
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
  COBJ_TO_INPUTDEF.syncFromArray(POZYX_TO_COBJ.getMappedObjects());
  COBJ_TO_INPUTDEF.mapObjects();
  // 3. Combine them all
  INPUTDEFS.push(...COBJ_TO_INPUTDEF.getMappedObjects());
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetInputGroups(): any {
  return INPUT_GROUPS;
}
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
  console.error('delete input agents');
  defs.forEach(d => DeleteAgent(d));
}
