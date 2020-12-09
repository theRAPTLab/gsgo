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
let INSTANCE_COUNTER = 100;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given the creation parameters, make a new instance. The init program sets
 *  the default values (and any other startup code if needed)
 */
export function DefineInstance(instanceDef: TInstance) {
  const { blueprint, init, name = '<none>' } = instanceDef;
  // console.log(...PR(`saving '${name}' blueprint '${blueprint}' with init`, init));
  if (!INSTANCES.has(blueprint)) INSTANCES.set(blueprint, []);
  const bpi = INSTANCES.get(blueprint);
  instanceDef.id = INSTANCE_COUNTER++;
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

/// AGENT UTILITIES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** save agent by type into agent map, which contains weaksets of types
 *  AGENTS has instances by blueprint name, which is a Map of agents
 *  AGENT_DICT has instances by id
 */
export function SaveAgent(agent) {
  const { id, blueprint } = agent;
  const name = blueprint.name;
  //
  if (!AGENTS.has(name)) AGENTS.set(name, new Map());
  const agents = AGENTS.get(name);
  if (agents.has(id)) throw Error(`agent id ${id} already in ${name} list`);
  // save the agent
  agents.set(id, agent);
  // also save the id global lookup table
  if (AGENT_DICT.has(id)) throw Error(`agent id ${id} already in global dict`);
  AGENT_DICT.set(id, agent);
  return agent;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return agent set by type */
export function GetAgentsByType(bpName) {
  const agentSet = AGENTS.get(bpName);
  if (!agentSet) {
    console.warn(...PR(`agents of '${bpName}' don't exist...yet?`));
    return [];
  }
  return [...agentSet.values()];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetAgentById(id) {
  const agent = AGENT_DICT.get(id);
  if (agent) return agent;
  console.warn(...PR(`agent ${id} not in AGENT_DICT`));
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
