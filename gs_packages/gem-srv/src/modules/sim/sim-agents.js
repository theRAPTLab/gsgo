/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Agents Phase Machine Interface

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import DisplayObject from '../../lib/class-display-object';
import InstanceDef from 'lib/class-instance-def';
import {
  GetAllAgents,
  DeleteAgent,
  DeleteAgentByBlueprint,
  GetAgentsByType,
  GetAgentById,
  GetAgentByName,
  DeleteAllAgents,
  DefineInstance,
  UpdateInstance,
  DeleteInstance,
  DeleteAllInstances,
  DeleteInstancesByBlueprint,
  GetAllInstances,
  GetInstance,
  GetInstancesType
} from '../datacore/dc-agents';
import {
  GetBlueprint,
  GetAllBlueprints,
  DeleteBlueprint
} from 'modules/datacore/dc-script-engine';
import * as RENDERER from '../render/api-render';
import { MakeDraggable } from '../../lib/vis/draggable';
import * as TRANSPILER from './script/transpiler';
import SyncMap from '../../lib/class-syncmap';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_AGENTS');
const DBG = true;
const DO_TESTS = !UR.IsAppRoute('/app/compiler');

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
    dobj.frame = agent.prop.Costume ? agent.prop.Costume.currentFrame.value : '';
    dobj.scale = agent.scale;
    dobj.scaleY = agent.scaleY || agent.scale;
    dobj.alpha = agent.alpha;
    dobj.text = agent.text;
    dobj.meter = agent.meter;
    dobj.meterClr = agent.meterClr;
    dobj.mode = agent.mode();
    dobj.dragging = agent.isCaptive;
    dobj.flags = agent.getFlags();
  },
  onUpdate: (agent, dobj) => {
    dobj.x = agent.x;
    dobj.y = agent.y;
    dobj.skin = agent.skin;
    dobj.frame = agent.prop.Costume ? agent.prop.Costume.currentFrame.value : '';
    dobj.scale = agent.scale;
    dobj.scaleY = agent.scaleY || agent.scale;
    dobj.alpha = agent.alpha;
    dobj.text = agent.text;
    dobj.meter = agent.meter;
    dobj.meterClr = agent.meterClr;
    dobj.mode = agent.mode();
    dobj.dragging = agent.isCaptive;
    dobj.flags = agent.getFlags();
  }
});

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// INSTANCE DEF

/**
 * From `model.instances` spec to an instance definition
 */
const SCRIPT_TO_INSTANCE = new SyncMap({
  Constructor: InstanceDef,
  autoGrow: true,
  name: 'ScriptToInstance'
});

/**
 * Make or update agent and run its init script.
 * @param {InstanceDef} def
 */
function MakeAgent(def) {
  const initScript = TRANSPILER.CompileText(def.initScript);
  let agent = GetAgentById(def.id);
  if (!agent) agent = TRANSPILER.MakeAgent(def);
  agent.exec(initScript, { agent });
}

SCRIPT_TO_INSTANCE.setMapFunctions({
  onAdd: (newDef, def) => {
    def.name = newDef.name;
    def.blueprint = newDef.blueprint;
    def.initScript = newDef.initScript;
    DefineInstance({
      id: newDef.id,
      name: newDef.name,
      blueprint: newDef.blueprint,
      initScript: newDef.initScript
    });
    MakeAgent(newDef);
  },
  onUpdate: (newDef, def) => {
    def.name = newDef.name;
    def.initScript = newDef.initScript;
    // If blueprint is updated and recompiled
    // the old instance has been removed
    // so we have to check here if it's still there
    if (GetInstance(newDef)) {
      UpdateInstance(newDef);
    } else {
      DefineInstance({
        id: newDef.id,
        name: newDef.name,
        blueprint: newDef.blueprint,
        initScript: newDef.initScript
      });
    }
    MakeAgent(newDef);
  },
  onRemove: (newDef, def) => {
    DeleteInstance(newDef);
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
// UR.HookPhase('SIM/VIS_UPDATE', frameCount => {
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

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Removes any blueprints that do not match `namesToKeep`:
 *   1. blueprints defined in dc-script-engine
 *   2. agents in dc-agents
 *   3. instances in dc-agents
 * @param {string[]} namesToKeep array of blueprint names
 */
function FilterBlueprints(namesToKeep) {
  const blueprints = GetAllBlueprints(); // Array of SM_Bundle
  blueprints.forEach(b => {
    if (!namesToKeep.includes(b.name)) {
      // remove the blueprint
      DeleteBlueprint(b.name);

      // [We can't rely on SyncMap to remove because it doesn't
      //  sync to blueprints, just to instanceDefs]
      // remove any agents using the blueprint
      DeleteAgentByBlueprint(b.name);
      // remove instances using the blueprint
      DeleteInstancesByBlueprint(b.name);
    }
  });
}

/// PROGRAMMING INTERFACE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentSelect() {}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** placeholder function
 *  Main update
 *  This creates MULTIPLE agents from a spec, replacing all instances of the
 *  same blueprint.  This is generally used to initialize a whole model.
 *
 * @param {Object} data { blueprintNames, instancesSpec }
 *
 * @param {string[]} blueprintNames Array of blueprint names
 * @param {Object[]} instancesSpec Array of to-be-defined spec objects {id, name, blueprint, init, ...args}
 *                              from model.instances
 * @param {TInstance[]} instanceDefs Array of existing instanceDef (TInstance) objects {id, name, blueprint, init, ...args }
 *                             from dc-agents
 */
export function AllAgentsProgram(data) {
  const { blueprintNames, instancesSpec } = data;
  if (!blueprintNames) return console.warn(...PR('no blueprint'));

  // I. Remove Unused Blueprints and Agents
  FilterBlueprints(blueprintNames);

  SCRIPT_TO_INSTANCE.syncFromArray(instancesSpec);
  SCRIPT_TO_INSTANCE.mapObjects();
  UR.RaiseMessage('NET:INSTANCES_UPDATE', {
    instances: SCRIPT_TO_INSTANCE.getMappedObjects()
  });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** placeholder function
 *
 *  CURRENTLY ONLY USED BY Compiler
 *  REVIEW: Outdated.  See AllAgentsProgram Update
 *
 *  This creates a SINGLE agent just for testing while the user is editing
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
  instances.forEach(instance => {
    // Make an instance only for this blueprint, ignore others
    // otherwise other blueprints will get duplicate instances
    if (instance.blueprint === blueprint) {
      TRANSPILER.MakeAgent(instance);
    }
  });

  // Announce instance defs so UI can register instance names for inspector monitoring
  // Mostly used by PanelInstances and Inspectors
  UR.RaiseMessage('NET:INSTANCES_UPDATE', { instances });
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentsUpdate(frameTime) {
  const allAgents = GetAllAgents();
  allAgents.forEach(agent => {
    agent.agentUPDATE(frameTime);
  });

  // Move to VisUpdate ala HACK message? Is that DisplayListOut phase?
  //
  // // TEMP DISPLAY HACK: This should move to the DisplayListOut phase
  // // force agent movement for display list testing
  // DOBJ_SYNC_AGENT.syncFromArray(allAgents);
  // DOBJ_SYNC_AGENT.mapObjects();
  // const dobjs = DOBJ_SYNC_AGENT.getMappedObjects();
  // RENDERER.UpdateDisplayList(dobjs);
  // UR.SendMessage('NET:DISPLAY_LIST', dobjs);
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// REVIEW: This call should not be necessary!  It should probably be removed
///         in favor of proper cycles.
///
/// Force AgentsUpdate, then force Render
/// This is used to update data objects and refresh the screen during
/// the initial PLACES call and when an instance is selected in MapEditor
function AgentsRender(frameTime) {
  // AgentsUpdate is not necessary since it just runs PROGRAM UPDATE?
  // AgentsUpdate(frameTime);
  VisUpdate(frameTime);
  Render(frameTime);
}

function VisUpdate(frameTime) {
  const allAgents = GetAllAgents();
  // TEMP DISPLAY HACK: This should move to the DisplayListOut phase
  // force agent movement for display list testing
  DOBJ_SYNC_AGENT.syncFromArray(allAgents);
  DOBJ_SYNC_AGENT.mapObjects();
  const dobjs = DOBJ_SYNC_AGENT.getMappedObjects();
  RENDERER.UpdateDisplayList(dobjs);
  UR.SendMessage('NET:DISPLAY_LIST', dobjs);
}

function Render(frameTime) {
  RENDERER.Render();
}

/// ASYNC MESSAGE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HandleMessage('SIM_RESET', AgentReset);
UR.HandleMessage('SIM_MODE', AgentSelect);

UR.HandleMessage('AGENT_PROGRAM', AgentProgram);
UR.HandleMessage('ALL_AGENTS_PROGRAM', AllAgentsProgram); // whole model update
UR.HandleMessage('AGENTS_RENDER', AgentsRender); // AgentsUpdate + Render

// Pre-Run Workarounds
UR.HandleMessage('NET:HACK_AGENTS_UPDATE', AgentsUpdate);
UR.HandleMessage('NET:HACK_VIS_UPDATE', VisUpdate);
UR.HandleMessage('NET:HACK_RENDER', Render);

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('SIM/AGENTS_UPDATE', AgentsUpdate);
UR.HookPhase('SIM/AGENTS_THINK', AgentThink);
UR.HookPhase('SIM/AGENTS_EXEC', AgentExec);
UR.HookPhase('SIM/VIS_UPDATE', VisUpdate);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {};
