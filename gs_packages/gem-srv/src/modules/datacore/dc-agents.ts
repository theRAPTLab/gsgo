/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  AGENTS

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { IAgent, TInstanceMap, TInstance } from 'lib/t-script.d';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const PR = UR.PrefixUtil('DCAGNT');
const DBG = false;

export const AGENTS: Map<string, Map<any, IAgent>> = new Map(); // blueprint => Map<id,Agent>
export const AGENT_DICT: Map<any, IAgent> = new Map(); // id => Agent
export const INSTANCES: TInstanceMap = new Map();
//
const INSTANCE_COUNTER_START_VAL = 9000; // reserve ids < 9000 for User Defined instances?
let INSTANCE_COUNTER = INSTANCE_COUNTER_START_VAL;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given the creation parameters, make a new instance. The init program sets
 *  the default values (and any other startup code if needed).
 */
export function DefineInstance(instanceDef: TInstance) {
  const { bpid, id, initScript } = instanceDef;
  // console.log(...PR(`saving '${name}' blueprint '${blueprint}' with init`, init));
  if (!INSTANCES.has(bpid)) INSTANCES.set(bpid, []);
  const bpi = INSTANCES.get(bpid);
  // Use the spec'd id, otherwise auto-generate an id
  if (!instanceDef.id) {
    instanceDef.id = String(INSTANCE_COUNTER++);
  }
  instanceDef.id = String(instanceDef.id); // enforce string
  bpi.push(instanceDef);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function UpdateInstance(instanceDef: TInstance) {
  const { bpid, id } = instanceDef;
  const bpi = INSTANCES.get(bpid);
  const index = bpi.findIndex(i => i.id === id);
  if (index < 0)
    console.error(...PR(`UpdateInstance couldn't find instance ${id}`));
  bpi[index] = instanceDef;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function DeleteInstance(instanceDef: TInstance) {
  const { bpid, id } = instanceDef;
  const bpi = INSTANCES.get(bpid);
  if (!bpi) return; // already deleted
  const index = bpi.findIndex(i => i.id === id);
  if (index < 0 && DBG)
    // This warning can be ignored because when deleting a blueprint,
    // sim-agents.FilterBlueprints will have already removed the instance
    // even before AllAgentsProgram gets around to removal with SCRIPT_TO_INSTANCE.mapObjects();
    console.warn(...PR(`DeleteInstance couldn't find instance ${id}`));
  bpi.splice(index, 1);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetAllInstances() {
  const instances = [];
  const map = [...INSTANCES.values()];
  map.forEach(i => instances.push(...i));
  return instances;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetInstance(instanceDef: TInstance) {
  const { bpid, id } = instanceDef;
  const bpi = INSTANCES.get(bpid);
  if (bpi === undefined) return undefined;
  const index = bpi.findIndex(i => i.id === id);
  if (index < 0) return undefined;
  return bpi[index];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the instance definitions that are blueprint */
export function GetInstancesType(blueprint: string) {
  if (typeof blueprint !== 'string')
    throw Error(`bad blueprint typeof ${typeof blueprint}`);
  if (!INSTANCES.has(blueprint)) INSTANCES.set(blueprint, []);
  return INSTANCES.get(blueprint);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function DeleteAllInstances() {
  INSTANCES.clear();
  INSTANCE_COUNTER = INSTANCE_COUNTER_START_VAL;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function DeleteInstancesByBlueprint(blueprint) {
  INSTANCES.set(blueprint, []);
}

/// AGENT UTILITIES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Copies all `agent.prop` GVars.  Does not copy Feature GVars
 *  Used by CopyAgentProps.
 */
function m_CopyProps(props: object, targetProps: object) {
  for (const [key, value] of Object.entries(props)) {
    // Test for targetProps[key] b/c non-GVar properties (like `statusHistory`) do not have a setTo
    if (targetProps[key] && targetProps[key].setTo) {
      targetProps[key].setTo(value.value);
    }
  }
}
/**
 * Blindly copy all featProps.  Used by CopyAgentProps.
 * NOTE: Ignores Dicts!!!!
 */
function m_CopyFeatProps(origFeatProps: any[], targetAgentFeatProps: any) {
  const featProps = [...Object.keys(origFeatProps)];
  featProps.forEach(p => {
    // only copy GVars, skip private variables
    const gvar = origFeatProps[p];
    // if it's gvar, return the value, otherwise skip
    // REVIEW: Ignores DICTS!
    if (gvar !== undefined && gvar.value !== undefined) {
      targetAgentFeatProps[p].setTo(gvar.value);
      // copy min and max values?
      if (gvar.min !== undefined) targetAgentFeatProps[p].min = gvar.min;
      if (gvar.max !== undefined) targetAgentFeatProps[p].max = gvar.max;
    }
  });
}
/**
 * This will copy the feature Map and all 'prop' properties from orig to target
 * @param origAgent
 * @param targetAgent a freshly minted agent with no settings
 */
export function CopyAgentProps(origAgent: IAgent, targetAgent: IAgent) {
  // blueprint is already copied by MakeAgent
  // flags are temporary states that should not be copied?

  // copy props
  m_CopyProps(origAgent.prop, targetAgent.prop);

  // copy features
  targetAgent.featureMap = new Map(origAgent.featureMap);
  // copy featProps
  const origFeatures = [...origAgent.featureMap.keys()];
  origFeatures.forEach(f => {
    m_CopyFeatProps(origAgent.prop[f], targetAgent.prop[f]);
  });

  return targetAgent;
}

/** save agent by type into agent map, which contains weaksets of types
 *  AGENTS has instances by blueprint name, which is a Map of agents
 *  AGENT_DICT has instances by id
 */
export function SaveAgent(agent) {
  const { id, blueprint } = agent;
  const blueprintName = blueprint.name;
  //
  if (!AGENTS.has(blueprintName)) AGENTS.set(blueprintName, new Map());
  const agents = AGENTS.get(blueprintName);
  if (agents.has(id))
    throw Error(`agent id ${id} already in ${blueprintName} list`);
  // save the agent
  agents.set(id, agent);
  // also save the id global lookup table
  if (AGENT_DICT.has(id)) throw Error(`agent id ${id} already in global dict`);
  AGENT_DICT.set(id, agent);
  return agent;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  To delete the agent, we need to remove it from: AGENT and AGENT_DICT.
 *
 *  1. AGENT map values are a second map of `agents`.
 *     `agents` key is a GAgent.id, which is based on an sm-object counter.
 *  2. AGENT_DICT values are also a map of `agents`
 *     with the same GAgent.id as the key.
 */
export function DeleteAgent(instancedef) {
  const { bpid, id } = instancedef;
  if (!AGENTS.has(bpid)) {
    console.error(...PR(`blueprint ${instancedef} not found`));
    return;
  }
  const agents = AGENTS.get(bpid);
  agents.delete(id);
  AGENTS.set(bpid, agents);
  AGENT_DICT.delete(id);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function DeleteAgentByBlueprint(blueprintName) {
  const agents = AGENTS.get(blueprintName);
  AGENTS.delete(blueprintName);
  if (agents) agents.forEach(a => AGENT_DICT.delete(a.id));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return GAgent array by type */
export function GetAgentsByType(bpName) {
  const agentSet = AGENTS.get(bpName);
  if (!agentSet) {
    // console.warn(...PR(`agents of '${bpName}' don't exist...yet?`));
    return [];
  }
  return [...agentSet.values()];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetAgentById(id): IAgent {
  const agent = AGENT_DICT.get(id);
  if (agent) return agent;
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetAllAgents() {
  const arr = [];
  const maps = [...AGENTS.values()];
  maps.forEach(map => {
    arr.push(...map.values());
  });
  return arr;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetAgentByName(name): IAgent {
  const agents = GetAllAgents();
  const agent = agents.find(a => a.meta.name === name);
  if (agent) return agent;
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function DeleteAllAgents() {
  AGENTS.clear();
  AGENT_DICT.clear();
}
