/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Agents Phase Machine Interface

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import SyncMap from 'lib/class-syncmap';
import DisplayObject from 'lib/class-display-object';
import {
  GetAllAgents,
  DefineInstance,
  DeleteBlueprintInstances,
  GetAllInstances
} from 'modules/datacore/dc-agents';
import * as RENDERER from 'modules/render/api-render';
import { MakeDraggable } from 'lib/vis/draggable';
import * as TRANSPILER from 'script/transpiler';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_AGENTS');
const DBG = true;
const DO_TESTS = !UR.IsRoute('/app/compiler');

const DOBJ_SYNC_AGENT = new SyncMap({
  Constructor: DisplayObject,
  autoGrow: true,
  name: 'AgentToDOBJ'
});

DOBJ_SYNC_AGENT.setMapFunctions({
  onAdd: (agent, dobj) => {
    dobj.x = agent.x;
    dobj.y = agent.y;
    dobj.skin = agent.skin;
    dobj.frame = agent.prop.Costume.currentFrame.value;
    dobj.mode = agent.mode();
    dobj.dragging = agent.isCaptive;
  },
  onUpdate: (agent, dobj) => {
    dobj.x = agent.x;
    dobj.y = agent.y;
    dobj.skin = agent.skin;
    dobj.frame = agent.prop.Costume.currentFrame.value;
    dobj.mode = agent.mode();
    dobj.dragging = agent.isCaptive;
  }
});

/// CONSOLE-LEFT STATUS FAKERY ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// CONSOLE
let HCON;
let FCON;
let X = 0;
let INC = 1;
const ZIP = '=@=';
const ZIP_BLNK = ''.padEnd(ZIP.length, ' ');
// UR.SystemHook('SIM/VIS_UPDATE', frameCount => {
//   HCON.plot(`framecount: ${frameCount}`, 1);
//   if (frameCount % 6) return;
//   HCON.plot(ZIP_BLNK, 3, X);
//   X += INC;
//   HCON.plot(ZIP, 3, X);
//   const XS = `${X}`.padStart(3, ' ');
//   HCON.plot(`X: ${XS}`, 5);
//   if (X < 1) INC = 1;
//   if (X > 24) INC = -1;
//   if (Math.random() > 0.5) {
//     HCON.gotoRow(6);
//     HCON.print(`dummy datalog: ${Math.random().toFixed(2)}`);
//   }
//   if (Math.random() > 0.95) HCON.clear(6);
// });

/// PROGRAMMING INTERFACE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentSelect() {}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** placeholder function
 *  This creates a single agent just for testing while the user is editing
 *  a script.
 *  If the agent instance already exists, it replaces the existing instance.
 */
export function AgentProgram(blueprint) {
  if (!blueprint) return console.warn(...PR('no blueprint'));
  // original initializer
  // for (let i = 0; i < 20; i++) TRANSPILER.MakeAgent(`bun${i}`, { blueprint });

  // Remove any existing agent instances
  let instances = GetAllInstances();
  instances.forEach(instance => {
    if (instance.blueprint === blueprint) {
      TRANSPILER.RemoveAgent(instance);
    }
  });
  // And clear the INSTANCES map for the blueprint
  DeleteBlueprintInstances(blueprint);

  // Initiate a new instance for the submitted blueprint
  // using a unique name.
  DefineInstance({
    blueprint,
    name: `${blueprint}${Math.trunc(Math.random() * 1000)}`,
    init: []
  });

  // Make an agent for each instance
  instances = GetAllInstances();
  instances.forEach(spec => {
    // Make an instance only for this blueprint, ignore others
    // otherwise other blueprints will get duplicate instances
    if (spec.blueprint === blueprint) {
      TRANSPILER.MakeAgent(spec);
    }
  });

  // Announce instances so UI can update
  // Mostly used by PanelInstances and Inspectors
  UR.RaiseMessage('HACK_INSTANCES_UPDATED', instances);
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentUpdate(frameTime) {
  const allAgents = GetAllAgents();
  allAgents.forEach(agent => {
    agent.agentUPDATE(frameTime);
  });

  // TEMP DISPLAY HACK: This should move to the DisplayListOut phase
  // force agent movement for display list testing
  DOBJ_SYNC_AGENT.syncFromArray(allAgents);
  DOBJ_SYNC_AGENT.mapObjects();
  const dobjs = DOBJ_SYNC_AGENT.getMappedObjects();
  RENDERER.UpdateDisplayList(dobjs);
  UR.SendMessage('NET:DISPLAY_LIST', dobjs);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentThink(frameTime) {
  const allAgents = GetAllAgents();
  allAgents.forEach(agent => {
    agent.agentTHINK(frameTime);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentExec(frameTime) {
  const allAgents = GetAllAgents();
  allAgents.forEach(agent => {
    agent.agentEXEC(frameTime);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentReset(frameTime) {
  /* reset agent */
}

/// ASYNC MESSAGE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HandleMessage('SIM_RESET', AgentReset);
UR.HandleMessage('SIM_MODE', AgentSelect);
// UR.HandleMessage('SIM_PROGRAM', AgentProgram);
UR.HandleMessage('AGENT_PROGRAM', AgentProgram);

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('SIM/AGENTS_UPDATE', AgentUpdate);
UR.SystemHook('SIM/AGENTS_THINK', AgentThink);
UR.SystemHook('SIM/AGENTS_EXEC', AgentExec);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {};
