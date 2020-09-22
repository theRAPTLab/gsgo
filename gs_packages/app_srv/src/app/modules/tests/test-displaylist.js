/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DisplayList Tests

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import Pool from '../vis/lib/class-pool';
import MappedPool, { TestArrayEntities } from '../vis/lib/class-mapped-pool';
import { AGENTS_GetArrayAll } from '../sim/runtime-datacore';
import DisplayObject, { TestValidDOBJs } from '../vis/lib/class-display-object';
import Sprite from '../vis/lib/class-sprite';
import * as RENDERER from './test-renderer';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TEST = true;
const PR = UR.PrefixUtil('TestDisplayList', 'TagBlue');

/// CREATE POOLS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ENTITY_POOL = new Pool('PTRK', {
  Constructor: DisplayObject
});
const DOBJ_POOL = new Pool('DOBJ', {
  Constructor: DisplayObject,
  autoGrow: true
});
const SPRITE_POOL = new Pool('SPRITE', {
  Constructor: Sprite,
  autoGrow: true
});

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function u_NullAdd(srcObj, newObj) {
  // console.log(...PR('add', srcObj, newObj));
}
function u_NullUpdate(srcObj, updobj) {
  // console.log(...PR('update', srcObj, updobj));
}
function u_NullRemoveIsOk(testObj) {
  // console.log(...PR('test', testObj));
  return true;
}
function u_NullRemove(remObj) {
  // console.log(...PR('remove', remObj));
}
function u_PrintArgs(...args) {
  console.log(...PR('args', [...args]));
}

/// CREATE MAPPED POOLS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ENTITY_TO_DOBJ = new MappedPool(ENTITY_POOL, {
  onAdd: u_NullAdd,
  onUpdate: u_NullUpdate,
  shouldRemove: u_NullRemoveIsOk,
  onRemove: u_NullRemove
});
const DOBJ_TO_SPRITE = new MappedPool(SPRITE_POOL, {
  onAdd: u_NullAdd,
  onUpdate: u_NullUpdate,
  shouldRemove: u_NullRemoveIsOk,
  onRemove: u_NullRemove
});

/// TEST API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Create DataObjects from the AGENTS map in DATACORE.
 */
function TestSyncAgents() {
  const AGENT_TO_DOBJ = new MappedPool(DOBJ_POOL, {
    onAdd: u_NullAdd,
    onUpdate: u_NullUpdate,
    shouldRemove: u_NullRemoveIsOk,
    onRemove: u_NullRemove
  });
  // the AGENTS map is keyed by type, containing Sets of agent instances
  const agents = AGENTS_GetArrayAll();
  const startCount = agents.length;
  console.assert(TestArrayEntities(agents), 'agents do not pass test');

  /* TEST 1 */
  console.group('initial sync');
  let { added: a1, removed: r1, updated: u1 } = AGENT_TO_DOBJ.syncFromArray(
    agents
  );
  console.assert(
    a1.length === startCount,
    `added count should be ${startCount}, not ${a1.length}`
  );
  console.assert(r1.length === 0, `removed should be 0, not ${r1.length}`);
  console.assert(u1.length === 0, `updated should be 0, not ${u1.length}`);
  console.groupEnd();

  /* TEST 2 */
  console.group('followup sync - no change');
  let { added: a2, removed: r2, updated: u2 } = AGENT_TO_DOBJ.syncFromArray(
    agents
  );
  console.assert(a2.length === 0, `added should be 0, not ${a2.length}`);
  console.assert(r2.length === 0, `removed should be 0, not ${r2.length}`);
  console.assert(
    u2.length === startCount,
    `updated should be ${startCount}, not ${u2.length}`
  );
  console.groupEnd();

  /* TEST 3 */
  console.group('followup sync - lost objects');
  let halfArray = agents.slice(0, Math.floor(startCount / 2));
  let { added: a3, removed: r3, updated: u3 } = AGENT_TO_DOBJ.syncFromArray(
    halfArray
  );
  console.assert(a3.length === 0, `added should be 0, not ${a3.length}`);
  const rem = startCount - halfArray.length;
  console.assert(r3.length === rem, `removed should be ${rem}, not ${r3.length}`);
  const hal = halfArray.length;
  console.assert(u3.length === hal, `updated should be ${hal}, not ${u3.length}`);
  console.groupEnd();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Generate and Inspect Display Lists updating from Agents
 */
function TestDisplayList() {
  console.group('generate display objects');
  const AGENT_TO_DOBJ = new MappedPool(DOBJ_POOL, {
    onAdd: (sobj, dobj) => {
      dobj.x = sobj.x();
      dobj.y = sobj.y();
      dobj.skin = sobj.skin();
      dobj.visual = SPRITE_POOL.allocate();
    },
    onUpdate: (sobj, dobj) => {
      dobj.x = sobj.x();
      dobj.y = sobj.y();
      dobj.skin = sobj.skin();
    },
    shouldRemove: dobj => {
      SPRITE_POOL.deallocate(dobj);
      dobj.visual = undefined;
    },
    onRemove: u_NullRemove
  });

  /* TEST 4 - Inspect Display List */
  // the AGENTS map is keyed by type, containing Sets of agent instances
  const agents = AGENTS_GetArrayAll();
  const startCount = agents.length;
  console.assert(TestArrayEntities(agents), 'entities do not pass test');

  AGENT_TO_DOBJ.syncFromArray(agents);
  const dobjs = AGENT_TO_DOBJ.getSyncedObjects();

  console.log('agents', agents);
  console.log('display objects', dobjs);

  console.assert(TestValidDOBJs(dobjs), 'display objects are not valid');
  //
  console.groupEnd();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  Generate Periodic Display Lists
 */
const AGENT_TO_DOBJ_UPDATE = new MappedPool(DOBJ_POOL, {
  onAdd: (sobj, dobj) => {
    dobj.x = sobj.x();
    dobj.y = sobj.y();
    dobj.skin = sobj.skin();
    dobj.visual = SPRITE_POOL.allocate();
  },
  onUpdate: (sobj, dobj) => {
    dobj.x = sobj.x();
    dobj.y = sobj.y();
    dobj.skin = sobj.skin();
  },
  shouldRemove: dobj => {
    SPRITE_POOL.deallocate(dobj);
    dobj.visual = undefined;
  },
  onRemove: u_NullRemove
});

function TestUpdateDisplayList(frameTime) {
  const agents = AGENTS_GetArrayAll();
  // move the agents around manually by random jiggle
  agents.forEach(agent => {
    const rx = Math.round(5 - Math.random() * 10);
    const ry = Math.round(5 - Math.random() * 10);
    const x = agent.x() + rx;
    const y = agent.y() + ry;
    agent.prop('x').value = x;
    agent.prop('y').value = y;
  });
  AGENT_TO_DOBJ_UPDATE.syncFromArray(agents);
  // test single object updates
  // const dobj = DOBJ_POOL.get(510);
  // console.log('dobj x,y=', dobj.x, dobj.y);
  const displayList = AGENT_TO_DOBJ_UPDATE.getSyncedObjects();
  // console.log(...PR('Update List'));
  RENDERER.HandleDisplayList(displayList);
}
function TestInit() {
  console.log(...PR('Init'));
}
function TestRender(frameTime) {
  // console.log(...PR('Render'));
}

/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('SIM', 'INIT', TestInit);
UR.SystemHook('SIM', 'VIS_UPDATE', TestUpdateDisplayList);
UR.SystemHook('SIM', 'VIS_RENDER', TestRender);

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { TestSyncAgents, TestDisplayList };
