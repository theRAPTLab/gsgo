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

export const INPUT_GROUPS = new Map(); // Each device can belong to a specific group
export const INPUTDEFS = []; //

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
  },
  onUpdate: (cobj: any, inputDef: InputDef) => {
    inputDef.x = transformX(cobj.x);
    inputDef.y = transformY(cobj.y);
    inputDef.bpname = cobj.bpname;
  },
  shouldRemove: (cobj, map) => {
    // Inputs do not necessarily come in with every INPUTS phase fire
    // so we should NOT be removing them on every update.
    //
    // REVIEW: HACK Never Remove for now.
    return false;

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
      const { valid, added, updated, removed } = changes;
      console.log(...PR('notify', changes));
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
  const blueprintNames = Array.from(INPUT_GROUPS.keys());
  INPUTDEFS.length = 0; // Clear INPUTDEFS with each update
  blueprintNames.forEach(bpname => {
    InputUpdate(INPUT_GROUPS.get(bpname), bpname);
  });
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
