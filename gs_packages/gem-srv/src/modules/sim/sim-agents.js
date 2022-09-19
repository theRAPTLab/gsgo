/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Agents Phase Machine Interface

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import UR from '@gemstep/ursys/client';
import InstanceDef from 'lib/class-instance-def';

import SyncMap from 'lib/class-syncmap';
import SM_Agent from 'lib/class-sm-agent';
import DisplayObject from 'lib/class-display-object';

import * as BUNDLER from 'script/tools/script-bundler';
import * as SIMDATA from 'modules/datacore/dc-sim-data';
import * as DCAGENTS from 'modules/datacore/dc-sim-agents';
import * as RENDERER from 'modules/render/api-render';
import * as TRANSPILER from 'script/transpiler-v2';
import * as ACBlueprints from 'modules/appcore/ac-blueprints';
import * as ACInstances from 'modules/appcore/ac-instances';
import ERROR from 'modules/error-mgr';

import { LOG_DISPLAY_OBJECTS } from 'config/gem-settings';
import { createImportSpecifier } from 'typescript';

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
    dobj.zIndex = agent.zIndex !== undefined ? agent.zIndex : 0;
    if (agent.skin) dobj.skin = agent.skin;
    dobj.color = agent.color; // always copy color, set color = undefined to clear filters
    if (agent.prop.Costume) dobj.frame = agent.prop.Costume.currentFrame.value;
    if (agent.scale !== undefined) dobj.scale = agent.scale;
    if (agent.scaleY !== undefined) dobj.scaleY = agent.scaleY;
    if (agent.orientation !== undefined) dobj.rotation = agent.orientation;
    dobj.visible = agent.visible;
    if (agent.alpha !== undefined) dobj.alpha = agent.alpha;
    dobj.text = agent.statusText; // always set statusText in case it's cleared
    dobj.meter = agent.statusValue; // always set statusValue in case it's cleared
    if (agent.statusValueColor !== undefined)
      dobj.meterClr = agent.statusValueColor;
    dobj.meterPosition = agent.getMeterFlags();
    if (agent.prop.statusHistory) dobj.graph = agent.prop.statusHistory;
    if (agent.mode) dobj.mode = agent.mode();
    if (agent.dragging) dobj.dragging = agent.isCaptive;
    dobj.flags = agent.getFlags(); // always set flags b/c they might be cleared
    dobj.debug = agent.debug; // always set debug b/c vision cone might be removed
    if (agent.statusObject !== undefined) {
      dobj.barGraph = agent.statusObject.barGraph;
      dobj.barGraphLabels = agent.statusObject.barGraphLabels;
    }
  },
  onUpdate: (agent, dobj) => {
    dobj.x = agent.x;
    dobj.y = agent.y;
    dobj.zIndex = agent.zIndex !== undefined ? agent.zIndex : 0;
    if (agent.skin) dobj.skin = agent.skin;
    dobj.color = agent.color; // always copy color, set color = undefined to clear filters
    if (agent.prop.Costume) dobj.frame = agent.prop.Costume.currentFrame.value;
    if (agent.scale !== undefined) dobj.scale = agent.scale;
    if (agent.scaleY !== undefined) dobj.scaleY = agent.scaleY;
    if (agent.orientation !== undefined) dobj.rotation = agent.orientation;
    dobj.visible = agent.visible;
    if (agent.alpha !== undefined) dobj.alpha = agent.alpha;
    dobj.text = agent.statusText; // always set statusText in case it's cleared
    dobj.meter = agent.statusValue; // always set statusValue in case it's cleared
    if (agent.statusValueColor !== undefined)
      dobj.meterClr = agent.statusValueColor;
    dobj.meterPosition = agent.getMeterFlags();
    if (agent.prop.statusHistory) dobj.graph = agent.prop.statusHistory;
    if (agent.mode) dobj.mode = agent.mode();
    if (agent.dragging) dobj.dragging = agent.isCaptive;
    dobj.flags = agent.getFlags(); // always set flags b/c they might be cleared
    dobj.debug = agent.debug; // always set debug b/c vision cone might be removed
    if (agent.statusObject !== undefined) {
      dobj.barGraph = agent.statusObject.barGraph;
      dobj.barGraphLabels = agent.statusObject.barGraphLabels;
    }
  }
});

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// INSTANCE DEF
/**
 * Make or update agent and run its init script.
 * @param {InstanceDef} def
 */
function MakeAgent(def) {
  // TODO: instances are not using the 'name' convention established in merge #208
  // try {
  const bundle = BUNDLER.OpenBundle(def.bpid);
  const refs = { bundle, globals: {} };
  const initScript = TRANSPILER.CompileText(def.initScript, refs);
  BUNDLER.CloseBundle();
  let agent = DCAGENTS.GetAgentById(def.id);
  if (!agent) agent = TRANSPILER.MakeAgent(def);
  agent.exec(initScript, { agent });
  return agent;
  // } catch (caught) {
  //   ERROR(`MakeAgent failed`, {
  //     source: 'simulator',
  //     data: {
  //       def,
  //       refs,
  //       initScript
  //     },
  //     where: 'sim-agents.MakeAgent',
  //     caught
  //   });
  // }
}

/**
 * From `model.instances` script spec to an instance definition
 */
const SCRIPT_TO_INSTANCE = new SyncMap({
  Constructor: InstanceDef,
  autoGrow: true,
  name: 'ScriptToInstance'
});

SCRIPT_TO_INSTANCE.setMapFunctions({
  onAdd: (newDef, def) => {
    def.label = newDef.label;
    def.bpid = newDef.bpid;
    def.initScript = newDef.initScript;
    DCAGENTS.DefineInstance({
      id: newDef.id,
      label: newDef.label,
      bpid: newDef.bpid,
      initScript: newDef.initScript
    });
    MakeAgent(newDef);
  },
  onUpdate: (newDef, def) => {
    def.label = newDef.label;
    def.initScript = newDef.initScript;
    // If blueprint is updated and recompiled
    // the old instance has been removed
    // so we have to check here if it's still there
    if (DCAGENTS.GetInstance(newDef)) {
      DCAGENTS.UpdateInstance(newDef);
    } else {
      DCAGENTS.DefineInstance({
        id: newDef.id,
        label: newDef.label,
        bpid: newDef.bpid,
        initScript: newDef.initScript
      });
    }
    MakeAgent(newDef);
  },
  onRemove: (newDef, def) => {
    DCAGENTS.DeleteInstance(newDef);
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
 *   1. blueprints defined in dc-sim-resources
 *   2. agents in dc-sim-agents
 *   3. instances in dc-sim-agents
 * @param {string[]} namesToKeep array of blueprint names
 */
function FilterBlueprints(namesToKeep) {
  const blueprints = SIMDATA.GetAllBlueprintBundles(); // Array of SM_Bundle
  blueprints.forEach(b => {
    if (!namesToKeep.includes(b.name)) {
      // remove the blueprint
      SIMDATA.DeleteBlueprintBundle(b.name);

      // [We can't rely on SyncMap to remove because it doesn't
      //  sync to blueprints, just to instanceDefs]
      // remove any agents using the blueprint
      DCAGENTS.DeleteAgentByBlueprint(b.name);
      // remove instances using the blueprint
      DCAGENTS.DeleteInstancesByBlueprint(b.name);
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
 * @param {TInstanceDef[]} instanceDefs Array of existing instanceDef (TInstanceDef) objects {id, name, blueprint, init, ...args }
 *                             from dc-sim-agents
 */
export function AllAgentsProgram(data) {
  const { blueprintNames, instancesSpec } = data;
  if (!blueprintNames) return console.warn(...PR('no blueprint'));

  // 1. Remove Unused Blueprints and Agents
  FilterBlueprints(blueprintNames);

  // 2. Create Instances from Script
  SCRIPT_TO_INSTANCE.syncFromArray(instancesSpec);
  SCRIPT_TO_INSTANCE.mapObjects();

  // 3. Reset Global Agent
  //    `instancesSpec` does not include the global agent
  //    so SCRIPT_TO_INSTANCE (#2 above) will not create it.
  //    Instead, we have to manually create it.
  //
  //    Create Global Agent AFTER instances have been created
  //    b/c instances on older projects might have existing ids (e.g. 1)
  //    that will conflict with global being "1" if we initialize it BEFORE instances
  const existingGlobal = SM_Agent.GLOBAL_AGENT;
  const globalBpDef = ACBlueprints.GetBlueprint(ACBlueprints.GLOBAL_AGENT_NAME);
  const globalInstanceDef = {
    id: existingGlobal.id,
    bpid: ACBlueprints.GLOBAL_AGENT_NAME,
    label: globalBpDef.name,
    initScript: globalBpDef.initScript
  };
  const globalAgent = MakeAgent(globalInstanceDef);
  SM_Agent.GLOBAL_AGENT = globalAgent;

  // 4. Broadcast update to network devices
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
  let instances = DCAGENTS.GetAllInstances();
  instances.forEach(instance => {
    if (instance.bpid === blueprint) {
      TRANSPILER.RemoveAgent(instance);
    }
  });
  // And clear the INSTANCE_DEFS map for the blueprint
  DCAGENTS.DeleteInstancesByBlueprint(blueprint);

  // Initiate a new instance for the submitted blueprint
  // using a unique name.
  DCAGENTS.DefineInstance({
    blueprint,
    name: `${blueprint}${Math.trunc(RNG() * 1000)}`,
    init: []
  });

  // Make an agent for each instance
  instances = DCAGENTS.GetAllInstances();
  instances.forEach(instance => {
    // Make an instance only for this blueprint, ignore others
    // otherwise other blueprints will get duplicate instances
    if (instance.bpid === blueprint) {
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
  const allAgents = DCAGENTS.GetAllAgents();
  allAgents.forEach(agent => {
    agent.agentUPDATE(frameTime);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentsEvent(frameTime) {
  const allAgents = DCAGENTS.GetAllAgents();
  allAgents.forEach(agent => {
    agent.agentEVENT(frameTime);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentThink(frameTime) {
  const allAgents = DCAGENTS.GetAllAgents();
  allAgents.forEach(agent => {
    agent.agentTHINK(frameTime);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentExec(frameTime) {
  const allAgents = DCAGENTS.GetAllAgents();
  allAgents.forEach(agent => {
    agent.agentEXEC(frameTime);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentReset(frameTime) {
  /* reset agent */
}

function VisUpdate(frameTime) {
  const allAgents = DCAGENTS.GetAllAgents();
  AGENT_TO_DOBJ.syncFromArray(allAgents);
  AGENT_TO_DOBJ.mapObjects();
  const dobjs = AGENT_TO_DOBJ.getMappedObjects();
  RENDERER.UpdateDisplayList(dobjs);
  if (LOG_DISPLAY_OBJECTS) UR.LogJSON('DISPLAYLIST', dobjs);
  UR.SendMessage('NET:DISPLAY_LIST', dobjs);
}

/// ASYNC MESSAGE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HandleMessage('SIM_RESET', AgentReset);
UR.HandleMessage('SIM_MODE', AgentSelect);
UR.HandleMessage('AGENT_PROGRAM', AgentProgram);
UR.HandleMessage('ALL_AGENTS_PROGRAM', data => AllAgentsProgram(data)); // whole model update

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('SIM/AGENTS_UPDATE', AgentsUpdate);
UR.HookPhase('SIM/AGENTS_EVENT', AgentsEvent);
UR.HookPhase('SIM/AGENTS_THINK', AgentThink);
UR.HookPhase('SIM/AGENTS_EXEC', AgentExec);
UR.HookPhase('SIM/VIS_UPDATE', VisUpdate);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {};
