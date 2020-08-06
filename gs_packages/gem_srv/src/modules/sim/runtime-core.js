/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Simulation Data is a pure data module that can be included anywhere
  to access global data.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const AGENTS = new Map();
const TEMPLATES = new Map();
const FEATURES = new Map();

/// PHASEMACHINE API //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SIM_ModuleInit(gloop) {
  gloop.Hook('SETMODE', () => {});
}
/// AGENT SET UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** save agent by type into agent map, which contains weaksets of types */
function AGENTS_Save(agent) {
  const { id, type } = agent.meta;
  if (!AGENTS.has(type)) AGENTS.set(type, new Set());
  const agents = AGENTS.get(type);
  if (agents.has(id)) throw Error(`agent id${id} already in ${type} list`);
  // console.log(`AGENTS now has ${AGENTS.get(type).size}`);
  agents.add(agent);
  return agent;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return agent set */
function AGENTS_GetSet(type) {
  const agents = AGENTS.get(type);
  return agents || [];
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// PhaseMachine required initialization point
export default {
  SIM_ModuleInit
};
/// export shared data structures
export { AGENTS, TEMPLATES, FEATURES };
/// export agent creation methods
export { AGENTS_Save, AGENTS_GetSet };
