/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  AGENT CONCEPTUAL TEST CODE

  WORKING EXPRESSIONS

  * setting/getting properties inside an agent context
  * possibly setting/getting properties from a global context
  * writing a method as a function (agent, param)
    ..that manipulates properties and participates in the lifecycle (features)
  * writing a condition as a function that returns truthy/falsey valies
    - writing a condition as a function that returns a ValueRange
      with truthy/falsey interpretation
    - defining types with built-in conditional checks
    - chained conditions
  * accesssing a collection of agents
  * filtering a collection of agents using a condition
  * executing a method conditionally

  NEXT EXPRESSIONS

  what is an event / trigger / observable / pipe
  how do conditions relate to events and triggers



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { GBoolean, GValue, GRange } from './script-engine';

/// CONTEXT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// global agent lists
const agentSet = new Set(); // the set of all agents
const agentGroups = new Map(); // agents by type

const dummyAgent = {
  id: 1,
  name: '',
  costume: {},
  position: { x: 1, y: 1 }
};

// global agent condition tests
const agentTests = {
  hasProp: (agent, prop) => !!agent[prop]
};
const action = {
  moveTo: (context, x, y) => {}
};
const expression = {
  val: a => GValue(a)
};
const mailbox = [];

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** set property of agent
 *  @param {string} prop property name
 *  @param {any} value value to set
 */
function setProperty(prop, value) {
  dummyAgent[prop] = value;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** get property of agent
 *  @param {string} prop property name
 *  @returns {any}
 */
function getProperty(prop) {
  return dummyAgent[prop];
}

/// PROGRAMMING INTERFACE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentProgram() {
  console.groupEnd();
  console.log(`
  AgentProgram June 14 Goals

  o - create a dummy agent
  x - set property (variable)
  x - get property (variable)
  x - get a collection
  x - define a condition
  x - filter collection by condition
  x - calculate value of expression
  x - execute action w/ parameters
  x - execute action conditionally
  o - respond to event
  o - respond to conditional event
  o - define block (function)
  o - execute block (function)
  o - phasemachine autoupdates, triggers
  `);

  // create a dummy agent
  dummyAgent.name = 'DUMDUM';
  agentSet.add(dummyAgent);

  // set a property
  setProperty('testCount', 10);
  // define a 'when' condition
  // when myvar > 10 && myvar < 20 do something once or more (detect vs duration)
  const n = getProperty('myvar');
  // const condition = comparisonTests.isBetween;
  // const agent = dummyAgent;
  // const agentFilter = agent => comparisonTests.isBetween(agent.myvar, 10, 20);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentUpdate(frame) {
  // get a property
  const name = getProperty('name');
  // respond to an event
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentThink(frame) {
  // get a collection of references
  const agents = [...agentSet];
  const test = agentTests.hasProp;
  const R1 = 'name';
  const set = agents.filter(A1 => test(A1, R1));
  console.log(set.length);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentExec(frame) {
  // execute an action with parameters
  // save to variable
  // dummyAgent.myvar = math.add(frame, 1);
  // execute action conditionally
  // if (comparisonTests.isGreaterThan(dummyAgent.myvar, 2)) {
  //   dummyAgent.myvar = math.add(frame, 1);
  // }
  //
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
