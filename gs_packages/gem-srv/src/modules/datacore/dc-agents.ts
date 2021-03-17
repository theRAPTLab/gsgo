/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  AGENTS

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { IAgent, TInstanceMap, TInstance } from 'lib/t-script.d';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('DCAGNT', 'TagRed');
export const AGENTS: Map<string, Map<any, IAgent>> = new Map(); // blueprint => Map<id,Agent>
export const AGENT_DICT: Map<any, IAgent> = new Map(); // id => Agent
export const INSTANCES: TInstanceMap = new Map();
//
let INSTANCE_COUNTER = 1000;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given the creation parameters, make a new instance. The init program sets
 *  the default values (and any other startup code if needed).
 */
export function DefineInstance(instanceDef: TInstance) {
  const { blueprint, id, init, name = '<none>' } = instanceDef;
  // console.log(...PR(`saving '${name}' blueprint '${blueprint}' with init`, init));
  if (!INSTANCES.has(blueprint)) INSTANCES.set(blueprint, []);
  const bpi = INSTANCES.get(blueprint);
  // Use the spec'd id, otherwise auto-generate an id
  if (!instanceDef.id) {
    instanceDef.id = INSTANCE_COUNTER++;
  }
  bpi.push(instanceDef);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetAllInstances() {
  const instances = [];
  const map = [...INSTANCES.values()];
  map.forEach(i => instances.push(...i));
  return instances;
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
  INSTANCE_COUNTER = 100;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function DeleteBlueprintInstances(blueprint) {
  INSTANCES.set(blueprint, []);
}

/// AGENT UTILITIES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
 *  REVIEW: We are referencing `agent.meta.name` in order to look up
 *  the GAgent.id.  Is there a better way to look up the agent id
 *  using the information in `instancedef`?
 *
 *  To delete the agent, we need to remove it from: AGENT and AGENT_DICT.
 *
 *  1. AGENT map values are a second map of `agents`.
 *     `agents` key is a GAgent.id, which is based on an sm-object counter.
 *     The problem is that `instancedef` does not include the GAgent.id,
 *     `instancedef` does have the unique instance name, e.g. `Fish4519`
 *     as do the GAgent objects in the `agents` map saved as
 *     `agent.meta.name`.
 *  2. AGENT_DICT values are also a second map of `agents`
 *     with the same GAgent.id as the key.
 */
export function DeleteAgent(instancedef) {
  const { blueprint, name } = instancedef;
  if (!AGENTS.has(blueprint)) {
    console.error(...PR(`blueprint ${blueprint} not found`));
    return;
  }
  const agents = AGENTS.get(blueprint);
  const agentsArray = Array.from(agents.values()); // convert for finding
  let agent = agentsArray.find(a => a.meta.name === name);
  if (agent === undefined) {
    console.error(...PR(`agent ${name} not found`));
    return;
  }
  agents.delete(agent.id);
  AGENT_DICT.delete(agent.id);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return agent set by type */
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
  console.warn(...PR(`agent ${id} not in AGENT_DICT`));
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetAgentByName(name): IAgent {
  const agents = GetAllAgents();
  const agent = agents.find(a => a.meta.name === name);
  if (agent) return agent;
  console.warn(...PR(`agent ${name} not found`));
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
export function DeleteAllAgents() {
  AGENTS.clear();
}
