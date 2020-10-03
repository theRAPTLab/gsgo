/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Simulation Data is a pure data module that can be included anywhere
  to access global data.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import PixiTextureMgr from 'lib/class-pixi-asset-mgr';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('RUNTIME-CORE');

/// INSTANCE MAPS /////////////////////////////////////////////////////////////
const AGENTS = new Map(); // template => Map<id,Agent>
const AGENT_DICT = new Map(); // id => Agent

/// SCRIPT MACHINE ASSETS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FEATURES = new Map();
const TEMPLATES = new Map();
const CONDITIONS = new Map();

/// PIXI JS ASSET MANAGEMENT //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ASSET_MGR = new PixiTextureMgr();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// ASSET LOADING API METHODS /////////////////////////////////////////////////
const ASSETS_GetResource = ASSET_MGR.getAsset;
const ASSETS_GetResourceById = ASSET_MGR.getAssetById;
const ASSETS_LoadManifest = ASSET_MGR.loadManifest;

/// AGENT SET UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** save agent by type into agent map, which contains weaksets of types */
function AGENTS_Save(agent) {
  const { type } = agent.meta;
  const { id } = agent;
  if (!AGENTS.has(type)) AGENTS.set(type, new Map());
  // agents is a Map of agents
  const agents = AGENTS.get(type);
  // retrieve the set
  if (agents.has(id)) throw Error(`agent id ${id} already in ${type} list`);
  agents.set(id, agent);
  // also save the id global lookup table
  if (AGENT_DICT.has(id)) throw Error(`agent id ${id} already in global dict`);
  AGENT_DICT.set(id, agent);
  return agent;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return agent set by type */
function AGENTS_GetTypeSet(type) {
  const agentSet = AGENTS.get(type);
  if (agentSet) return [...agentSet.values()];
  console.warn(...PR(`agentset '${type}' not in AGENTS`));
  return [];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AGENT_GetById(id) {
  const agent = AGENT_DICT.get(id);
  if (agent) return agent;
  console.warn(...PR(`agent ${id} not in AGENT_DICT`));
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AGENTS_GetArrayAll() {
  const arr = [];
  const maps = [...AGENTS.values()];
  maps.forEach(map => {
    arr.push(...map.values());
  });
  return arr;
}

/// CONDITION UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function CONDITION_Save(condition) {
  console.log('unimplemented; got', condition);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function CONDITION_Get(signature) {
  console.log('unimplemented; got', signature);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function CONDITION_All() {
  const conditions = CONDITIONS.entries();
  return [...conditions];
}

/// TESTING UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** test agent set */
function TestAgentSets(type) {
  const agents = AGENTS.get(type);
  return [...agents] || [];
}

/// TESTING UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function OnSimReset() {}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('SIM', 'RESET', OnSimReset);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export shared data structures
export { AGENTS, TEMPLATES, FEATURES, CONDITIONS, ASSET_MGR };
/// export agent creation methods
export {
  ASSETS_GetResource,
  ASSETS_GetResourceById,
  ASSETS_LoadManifest,
  AGENTS_Save,
  AGENT_GetById,
  AGENTS_GetTypeSet,
  AGENTS_GetArrayAll,
  CONDITION_All,
  CONDITION_Save,
  CONDITION_Get,
  TestAgentSets
};
