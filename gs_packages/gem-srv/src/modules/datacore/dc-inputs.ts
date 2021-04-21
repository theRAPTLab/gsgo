/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Inputs Phase Machine Interface

  This should be a pure data class that maintains a list of input objects
  and the agents it updates.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import InputDef from 'lib/class-input-def';
import SyncMap from '../../lib/class-syncmap';
import { GetAgentById } from 'modules/datacore/dc-agents';

// TRANSPILER probably should not be in here
// import * as TRANSPILER from 'modules/sim/script/transpiler';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('DCINPT');
const DBG = true;

export const INPUT_GROUPS = new Map(); // Each device can belong to a specific group
export const INPUTDEFS = []; //

/// DATA UPDATE ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Control Object Sync to InputDef
const COBJ_TO_INPUTDEF = new SyncMap({
  Constructor: InputDef,
  autoGrow: true,
  name: 'CObjToAgent'
});
COBJ_TO_INPUTDEF.setMapFunctions({
  onAdd: (cobj, inputDef: InputDef) => {
    inputDef.x = transform(cobj.x);
    inputDef.y = transform(cobj.y);
    // HACK Instance Def
    inputDef.bpname = cobj.bpname;
    inputDef.name = cobj.name;
    console.log('add', cobj, inputDef);
  },
  onUpdate: (cobj, inputDef: InputDef) => {
    inputDef.x = transform(cobj.x);
    inputDef.y = transform(cobj.y);
    inputDef.bpname = cobj.bpname;
    // console.log('update', cobj, inputDef);
  },
  shouldRemove: (cobj, map) => {
    // REVIEW: 2021-04-20 4pm -- System should provide correct shouldRemove response now?
    //
    //
    // inputs do not come in with every INPUTS phase
    // const REMOVAL_THRESHOLD = -1;
    // const instance = map.get(cobj.id);
    // console.error('shouldRemove', cobj, map, instance);
    // if (instance) {
    //   instance.frameCount = instance.frameCount++ || 0;
    //   if (instance.frameCount > REMOVAL_THRESHOLD) return true;
    // }
    // HACK Never Remove for now so we can test inputs
    // return false;
  }
});

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export async function InputInit(bpname) {
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
export function InputsUpdate() {
  const blueprintNames = Array.from(INPUT_GROUPS.keys());
  INPUTDEFS.length = 0; // Clear INPUTDEFS with each update
  blueprintNames.forEach(bpname => {
    // console.warn('working on', b);
    InputUpdate(INPUT_GROUPS.get(bpname), bpname);
  });
  INPUTDEFS.push(...COBJ_TO_INPUTDEF.getMappedObjects());
}
function InputUpdate(devAPI, bpname) {
  const { unsubscribe, getController, deviceNum } = devAPI;
  const { getInputs, getChanges, putOutputs } = getController('markers'); // group = markers
  const raw_cobjs = getInputs().slice();
  // HACK: Stuff Blueprint spec into the cobjs for now
  // Technically cobjs should not have a blueprint parameter
  // but InputSpecs need it to be able to generate an agent.
  const cobjs = raw_cobjs.map(o => {
    o.bpname = bpname;
    o.name = o.id;
    return o;
  });
  // console.log('objs', typeof cobjs, cobjs);

  COBJ_TO_INPUTDEF.syncFromArray(cobjs);
  COBJ_TO_INPUTDEF.mapObjects();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetInputGroups(): any {
  return INPUT_GROUPS;
}
export function GetInputDefs(): object[] {
  return INPUTDEFS;
}

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Transforms unit vectors to project vectors
 * @param numberString CharControl output is -0.5 to 0.5
 * @returns
 */
function transform(numberString: string) {
  const n = Number(numberString);
  // HACK max for now.
  // REVIEW Should read from project data
  const max = 400;
  return n * 2 * max;
}
