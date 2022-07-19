/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DATACORE AGENT SIMULATION RESOURCES

  Maintains list of agent instances, and also provides a reverse lookup from the
  agent id to instance.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { INSTANCEDEF_ID_START } from 'config/dev-settings';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('DCAGNT');
const DBG = false;

const AGENTS: Map<string, Map<any, IAgent>> = new Map(); // blueprint => Map<id,Agent>
const AGENT_DICT: Map<any, IAgent> = new Map(); // id => Agent
const INSTANCE_DEFS: TInstanceDefsByBP = new Map();
//
let INSTANCEDEF_ID_COUNTER = INSTANCEDEF_ID_START;

/// AGENT SUPPORT UTILITIES ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: Copies all `agent.prop` GVars.  Does not copy SM_Feature props.
 *  Used by CopyAgentProps. */
function m_CopyProps(props: object, targetProps: object) {
  for (const [key, value] of Object.entries(props)) {
    // Test for targetProps[key] b/c non-GVar properties (like `statusHistory`) do not have a setTo
    if (targetProps[key] && targetProps[key].setTo) {
      targetProps[key].setTo(value.value);
    }
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: Blindly copy all featProps.  Used by CopyAgentProps.
 *  NOTE: Ignores Dicts!!!! */
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

/// INSTANCE API METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given the creation parameters, make a new instance. The init program sets
 *  the default values (and any other startup code if needed).
 */
function DefineInstance(instanceDef: TInstanceDef) {
  const { bpid, id, initScript } = instanceDef;
  // console.log(...PR(`saving '${name}' blueprint '${blueprint}' with init`, init));
  if (!INSTANCE_DEFS.has(bpid)) INSTANCE_DEFS.set(bpid, []);
  const bpi = INSTANCE_DEFS.get(bpid);
  // Use the spec'd id, otherwise auto-generate an id
  if (!instanceDef.id) {
    instanceDef.id = String(INSTANCEDEF_ID_COUNTER++);
  }
  instanceDef.id = String(instanceDef.id); // enforce string
  bpi.push(instanceDef);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: replace an instanceDef by id with an updated definition */
function UpdateInstance(instanceDef: TInstanceDef) {
  const { bpid, id } = instanceDef;
  const bpi = INSTANCE_DEFS.get(bpid);
  const index = bpi.findIndex(i => i.id === id);
  if (index < 0)
    console.error(...PR(`UpdateInstance couldn't find instance ${id}`));
  bpi[index] = instanceDef;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: deleted an instanceDef by id if it exits */
function DeleteInstance(instanceDef: TInstanceDef) {
  const { bpid, id } = instanceDef;
  const bpi = INSTANCE_DEFS.get(bpid);
  if (!bpi) return; // already deleted
  const index = bpi.findIndex(i => i.id === id);
  if (index < 0 && DBG)
    // This warning can be ignored because when deleting a blueprint,
    console.warn(...PR(`DeleteInstance couldn't find instance ${id}`));
  bpi.splice(index, 1);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return an array all instanceDefs for all blueprint types */
function GetAllInstances() {
  const instances = [];
  const map = [...INSTANCE_DEFS.values()];
  map.forEach(i => instances.push(...i));
  return instances;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: retrieve an instanceDef by a bpid (name) and id */
function GetInstance({ bpid, id: instanceDefId }) {
  const bpi = INSTANCE_DEFS.get(bpid);
  if (bpi === undefined) return undefined;
  const index = bpi.findIndex(i => i.id === instanceDefId);
  if (index < 0) return undefined;
  return bpi[index];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return the instance definitions that are blueprint */
function GetInstancesType(blueprint: string) {
  if (typeof blueprint !== 'string')
    throw Error(`bad blueprint typeof ${typeof blueprint}`);
  if (!INSTANCE_DEFS.has(blueprint)) INSTANCE_DEFS.set(blueprint, []);
  return INSTANCE_DEFS.get(blueprint);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: clear the blueprint-to-instanceDefs map. Used when starting a
 *  new sim round
 */
function DeleteAllInstances() {
  INSTANCE_DEFS.clear();
  INSTANCEDEF_ID_COUNTER = INSTANCEDEF_ID_START;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: delete all the instanceDefs associated with a particular blueprintName
 */
function DeleteInstancesByBlueprint(bpName) {
  INSTANCE_DEFS.set(bpName, []);
}

/// AGENT API METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This will copy the feature Map and all 'prop' properties from orig to target
 *  @param origAgent
 *  @param targetAgent a freshly minted agent with no settings
 */
function CopyAgentProps(origAgent: IAgent, targetAgent: IAgent) {
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** save agent by type into agent map, which contains weaksets of types
 *  AGENTS has instances by blueprint name, which is a Map of agents
 *  AGENT_DICT has instances by id
 */
function SaveAgent(agent) {
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
/** To delete the agent, we need to remove it from: AGENT and AGENT_DICT.
 *
 *  1. AGENT map values are a second map of `agents`.
 *     `agents` key is a SM_Agent.id, which is based on an sm-object counter.
 *  2. AGENT_DICT values are also a map of `agents`
 *     with the same SM_Agent.id as the key.
 */
function DeleteAgent(instancedef) {
  const { bpid, id } = instancedef;
  if (!AGENTS.has(bpid)) {
    console.error(...PR(`blueprint ${instancedef} not found`));
    return;
  }
  const agents = AGENTS.get(bpid);
  // Release cursors before deleting
  agents.forEach((a, key) => {
    if (a.hasFeature('Cursor') && a.blueprint.name !== 'Cursor' && a.cursor) {
      a.callFeatMethod('Cursor', 'releaseCursor');
    }
  });
  agents.delete(id);
  AGENTS.set(bpid, agents);
  AGENT_DICT.delete(id);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function DeleteAgentByBlueprint(bpName) {
  const agents = AGENTS.get(bpName);
  AGENTS.delete(bpName);
  if (agents) agents.forEach(a => AGENT_DICT.delete(a.id));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return SM_Agent array by type */
function GetAgentsByType(bpName) {
  const agentSet = AGENTS.get(bpName);
  if (!agentSet) {
    // console.warn(...PR(`agents of '${bpName}' don't exist...yet?`));
    return [];
  }
  return [...agentSet.values()];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetAgentById(id): IAgent {
  const agent = AGENT_DICT.get(id);
  if (agent) return agent;
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetAllAgents() {
  const arr = [];
  const maps = [...AGENTS.values()];
  maps.forEach(map => {
    arr.push(...map.values());
  });
  return arr;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetAgentByName(name): IAgent {
  const agents = GetAllAgents();
  const agent = agents.find(a => a.meta.name === name);
  if (agent) return agent;
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DeleteAllAgents() {
  AGENTS.clear();
  AGENT_DICT.clear();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  DefineInstance,
  UpdateInstance,
  DeleteInstance,
  GetAllInstances,
  GetInstance,
  GetInstancesType,
  DeleteAllInstances,
  DeleteInstancesByBlueprint,
  CopyAgentProps,
  //
  SaveAgent,
  DeleteAgent,
  DeleteAgentByBlueprint,
  //
  GetAgentsByType,
  GetAgentById,
  GetAllAgents,
  GetAgentByName,
  DeleteAllAgents
};
