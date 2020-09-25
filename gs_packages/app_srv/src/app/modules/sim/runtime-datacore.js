/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Simulation Data is a pure data module that can be included anywhere
  to access global data.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('RUNTIME-CORE');

/// INSTANCE MAPS /////////////////////////////////////////////////////////////
const AGENTS = new Map();

/// RUNTIME ASSETS ////////////////////////////////////////////////////////////
/// Visual assets (such as sprites) are not stored in datacore but
/// are available in the renderer classes. Datacore is for pure model data.
const FEATURES = new Map();
const TEMPLATES = new Map();
const CONDITIONS = new Map();

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
  // console.log(`AGENTS now has ${AGENTS.get(type).size}`);
  agents.set(id, agent);
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
export { AGENTS, TEMPLATES, FEATURES, CONDITIONS };
/// export agent creation methods
export {
  AGENTS_Save,
  AGENTS_GetTypeSet,
  AGENTS_GetArrayAll,
  CONDITION_All,
  CONDITION_Save,
  CONDITION_Get,
  TestAgentSets
};
