/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  STUB OUT LIST

  * set property
  * get a collection
  * filter a collection by condition
  * execute an action with parameters
  * execute an action conditionally
  * respond to to an event

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONTEXT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// global agent lists
const gAgents = []; // the set of all agents
const gAgentGroups = new Map(); // agents by type
// local agent
const agentContext = {};
// global agent condition tests
const agentTests = {
  hasProp: (a, prop) => !!a[prop]
};
// global agent condition tests
const comparisonTests = {
  isEqualTo: (a, b) => a === b
};

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** set property of agent
 *  @param {string} prop property name
 *  @param {any} value value to set
 */
function setProperty(prop, value) {
  agentContext[prop] = value;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** get property of agent
 *  @param {string} prop property name
 *  @returns {any}
 */
function getProperty(prop) {
  return agentContext[prop];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return set of agents matching agent filter
 */
function getAgentFilter(agentFilter) {
  return gAgents.filter(agentFilter);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a conditional test by name
 */
function getConditionTest(testName) {
  return comparisonTests[testName];
}

/// PROGRAMMING INTERFACE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentProgram() {
  console.groupEnd();
  console.log(`
  AgentProgram June 14 Goals

  o - set property
  o - get property
  o - filter collection by condition
  o - execute action w/ parameters
  o - execute action conditionally
  o - execute block
  o - respond to event
  o - respond to conditional event
  `);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentUpdate(frame) {
  // do agenty things
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentThink(frame) {
  // do agenty things
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentExec(frame) {
  // do agenty things
}

/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PM_Boot(gloop) {
  gloop.Hook('PROGRAM', AgentProgram);
  gloop.Hook('AGENTS_UPDATE', AgentUpdate);
  gloop.Hook('AGENTS_THINK', AgentThink);
  gloop.Hook('AGENTS_EXEC', AgentExec);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  PM_Boot
};
