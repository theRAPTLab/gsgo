/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Condition Class
  A collection of functions for different kinds of tests

  # CREATING AN EFFECT FUNCTION

    Effects are changes made to an agent. Agents are allowed to either:

    A. CHANGE their INTERNAL STATE state...
    B. or SEND a MESSAGE to another agent.

    This is a restriction borrowed from "The Actor Model", which is applicable
    to our simulation model.

    All Effect Functions are defined as: agent => { ... }

  # CONDITIONALLY EXECUTING AN EFFECT

    Effect functions can be run anytime an agent instance is available.
    However, to conditionally execute an effect we need to run a
    TEST FUNCTION. There are three different kinds of test functions:

    1. TEMPLATE:  testFunc = [keys, values]   => boolean
    2. INSTANCE:  testFunc = [gvars]          => boolean
    3. SET:       testFunc = (agent1, agent2) => boolean

    Test Functions accept a number of parameters that
    are inspected to return either TRUE or FALSE. Test Functions are
    "pure" functions (they do not modify data).

    Test Functions are part of a function library, covering lots of tests.
    Test

    NOTE: Test Functions can be also used as FILTER Functions, producing an
    AgentSet, but that is not the same as a CONDITIONAL EFFECT.

  # DEFINING CONDITIONAL EFFECTS

    A Conditional combines (a) Test Functions and (b) Effect functions for
    (c) a set of agents as designated by a CONDITION SELECTOR

    For multi-agent interaction tests, the conditional test can be run just
    once. Any agent subscribing to a specific CONDITION SELECTOR will be
    run through the condition's Effect function. SELECTORS take the following
    form:

    1. TEMPLATE: unique by AGENT_TYPE + TEST_ID
    2. INSTANCE: unique by AGENT_ID + TEST_ID
    3. SET:      unique by AGENT_TYPE + AGENT_TYPE + TEST_ID
    4. FILTER:   unique by AGENT_TYPE + TEST_ID

    These selectors are generated automatically as conditions are
    programmed in agents.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import GSVar from '../properties/var';
import GSPropRef from '../properties/var-prop-ref';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let last_agent;

/// TEST FACTORY //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const m_testfactory = new Map();

m_testfactory.set('touches', (stack, options = {}) => {
  // this test takes two AgentTypes and returns a set of matching agents
  const { radius = 1 } = options;
  const test = (aType1, aType2) => {
    console.log(`test ${aType1} touch ${aType2} within ${radius} units`);
    return []; // return AgentSet (potentially empty)
  };
  // return the test to be stored in condition table by argument signature
  return test; // (atype1, atype2) => AgentSet
});

const lt = stack => {
  // this test compares the last two numbers on the stack a,b
  const b = stack.pop().value;
  const a = stack.pop().value;
  return a < b;
};
m_testfactory.set('lt', lt);
const gt = stack => {
  // this test compares the last two numbers on the stack a,b
  const b = stack.pop().value;
  const a = stack.pop().value;
  return a > b;
};
m_testfactory.set('gt', gt);

/// CONDITION MAP /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const m_conditions = new Map();

/// STACK UTILITIES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** retrieve index-back from stack */
function stack_Back(stack, back = 1) {
  return stack[stack.length - 1 - back];
}
/** push 'agent' arg on stack */
function stack_PushAgent(stack, str) {
  if (!GSVar.IsAgentString(str)) throw Error(`invalid agent string ${str}`);
  stack.push({ type: 'agent', id: str });
  // save last agent pushed to use as context for props
  last_agent = str;
}
/** push 'agent.prop' arg on stack, using last pushed agent */
function stack_PushProp(stack, prop) {
  if (!GSVar.IsPropString(prop)) throw Error(`invalid prop string ${prop}`);
  if (!last_agent) throw Error('agent must be pushed before prop');
  stack.push(new GSPropRef(prop));
}
/** retrieve actual values from the argument stack
 *  requires writing an arguments class though
 */
function stack_GetValues(stack) {
  return stack.map(arg => arg.value);
}

/** converts the test object and stack parameters into a hash key */
function ConditionHashKey(test, stack) {
  return test.name + stack.length; // dumb placeholder
}

/// CLASS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Condition {
  constructor() {
    this.stack = []; // array objects
    this.tests = []; // condition functions using stack params
    this.effects = []; // effects to run using stack
  }

  /** agentType is string 'agent' or 'agent.prop' */
  agent(agentType) {
    stack_PushAgent(this.stack, agentType);
    // return chainable self
    return this;
  }

  /** save a prop reference on the stack */
  prop(propName) {
    this.stack.push(new GSPropRef(propName));
    // return chainable self
    return this;
  }

  /** testName is string 'test' which will be used to save a test function
   *  testfactory has testmaking functions that accept the stack and args
   *  the testmaking function uses the stack+args to create a test function
   *  that uses the values on the stack to compute its result, using them up.
   *  The arguments on the stack can be literal values or property references
   *  that are retrieved at runtime.
   */
  test(testName, ...args) {
    const testMaker = m_testfactory.get(testName);
    if (!testMaker) throw Error(`test ${testName} doesn't exist`);
    // push the args on the stack
    this.stack.push(args);
    // generate the key from test parameters and values on stack
    const key = ConditionHashKey(testMaker, this.stack);
    // make the test function, which will consume args on the stack
    const test = testMaker(this.stack);
    // save test with arg key
    m_conditions.set(key, test);
    // save test to run later
    this.tests.push(key);
    // return chainable self
    return this;
  }

  then(execFunc) {
    this.effects.push(execFunc);
  }

  signature() {}
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Condition;
