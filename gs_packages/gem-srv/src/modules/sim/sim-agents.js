/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Agents Phase Machine Interface

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import UR from '@gemstep/ursys/client';
import InstanceDef from 'lib/class-instance-def';
import {
  GetBlueprint,
  GetAllBlueprints,
  DeleteBlueprint
} from 'modules/datacore/dc-script-engine';
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
import DisplayObject from '../../lib/class-display-object';
import * as RENDERER from '../render/api-render';
import { MakeDraggable } from '../../lib/vis/draggable';
import * as TRANSPILER from './script/transpiler';
import SyncMap from '../../lib/class-syncmap';
import { ClearGlobalAgent } from '../../lib/class-gagent';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_AGENTS');
const DBG = true;
const DO_TESTS = !UR.IsAppRoute('/app/compiler');

const AGENT_TO_DOBJ = new SyncMap({
  Constructor: DisplayObject,
  autoGrow: true,
  name: 'AgentToDOBJ'
});

AGENT_TO_DOBJ.setMapFunctions({
  onAdd: (agent, dobj) => {
    dobj.x = agent.x;
    dobj.y = agent.y;
    // NPC always default to 200 if not set explicitly?
    // so NPC agents (200) always appera on top of input agents (-100)
    dobj.zIndex = agent.zIndex || 200;
    if (agent.skin) dobj.skin = agent.skin;
    if (agent.color) dobj.color = agent.color;
    if (agent.prop.Costume) dobj.frame = agent.prop.Costume.currentFrame.value;
    if (agent.scale) dobj.scale = agent.scale;
    if (agent.scaleY) dobj.scaleY = agent.scaleY;
    if (agent.orientation) dobj.rotation = agent.orientation;
    dobj.visible = agent.visible;
    if (agent.alpha) dobj.alpha = agent.alpha;
    if (agent.statusText) dobj.text = agent.statusText;
    if (agent.statusValue) dobj.meter = agent.statusValue;
    if (agent.statusValueColor) dobj.meterClr = agent.statusValueColor;
    if (agent.prop.statusHistory) dobj.graph = agent.prop.statusHistory;
    if (agent.mode) dobj.mode = agent.mode();
    if (agent.dragging) dobj.dragging = agent.isCaptive;
    dobj.flags = agent.getFlags(); // always set flags b/c they might be cleared
    if (agent.debug) dobj.debug = agent.debug;
  },
  onUpdate: (agent, dobj) => {
    dobj.x = agent.x;
    dobj.y = agent.y;
    // NPC always default to 200 if not set explicitly?
    // so NPC agents (200) always appera on top of input agents (-100)
    dobj.zIndex = agent.zIndex || 200;
    if (agent.skin) dobj.skin = agent.skin;
    if (agent.color) dobj.color = agent.color;
    if (agent.prop.Costume) dobj.frame = agent.prop.Costume.currentFrame.value;
    if (agent.scale) dobj.scale = agent.scale;
    if (agent.scaleY) dobj.scaleY = agent.scaleY;
    if (agent.orientation) dobj.rotation = agent.orientation;
    dobj.visible = agent.visible;
    if (agent.alpha) dobj.alpha = agent.alpha;
    if (agent.statusText || dobj.text) dobj.text = agent.statusText; // clear old text if previously set
    if (agent.statusValue) dobj.meter = agent.statusValue;
    if (agent.statusValueColor) dobj.meterClr = agent.statusValueColor;
    if (agent.prop.statusHistory) dobj.graph = agent.prop.statusHistory;
    if (agent.mode) dobj.mode = agent.mode();
    if (agent.dragging) dobj.dragging = agent.isCaptive;
    dobj.flags = agent.getFlags(); // always set flags b/c they might be cleared
    if (agent.debug) dobj.debug = agent.debug;
  }
});

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// INSTANCE DEF

/**
 * From `model.instances` script spec to an instance definition
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

  // 1. Reset Global Agent First
  ClearGlobalAgent();

  // 2. Remove Unused Blueprints and Agents
  FilterBlueprints(blueprintNames);

  // 3. Create Instances from Script
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
 *  (which Sri uses to test stuff in isolation so please don't break it)
 *
 *  This creates a SINGLE agent just for testing while the user is editing a
 *  script. If the agent instance already exists, it replaces the existing
 *  instance.
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
  DeleteInstancesByBlueprint(blueprint);

  // Initiate a new instance for the submitted blueprint
  // using a unique name.
  DefineInstance({
    blueprint,
    name: `${blueprint}${Math.trunc(RNG() * 1000)}`,
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

export function ClearDOBJ() {
  AGENT_TO_DOBJ.clearMappedObjects();
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentsUpdate(frameTime) {
  const allAgents = GetAllAgents();
  allAgents.forEach(agent => {
    agent.agentUPDATE(frameTime);
  });
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

function VisUpdate(frameTime) {
  const allAgents = GetAllAgents();
  AGENT_TO_DOBJ.syncFromArray(allAgents);
  AGENT_TO_DOBJ.mapObjects();
  const dobjs = AGENT_TO_DOBJ.getMappedObjects();
  RENDERER.UpdateDisplayList(dobjs);
  UR.SendMessage('NET:DISPLAY_LIST', dobjs);
}

/// ASYNC MESSAGE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HandleMessage('SIM_RESET', AgentReset);
UR.HandleMessage('SIM_MODE', AgentSelect);
UR.HandleMessage('AGENT_PROGRAM', AgentProgram);
UR.HandleMessage('ALL_AGENTS_PROGRAM', AllAgentsProgram); // whole model update

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('SIM/AGENTS_UPDATE', AgentsUpdate);
UR.HookPhase('SIM/AGENTS_THINK', AgentThink);
UR.HookPhase('SIM/AGENTS_EXEC', AgentExec);
UR.HookPhase('SIM/VIS_UPDATE', VisUpdate);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {};
