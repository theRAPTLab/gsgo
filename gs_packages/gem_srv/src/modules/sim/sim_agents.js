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

import BooleanProp from './props/var-boolean';
import NumberProp from './props/var-number';
import AgentFactory from './agents/agentfactory';
import AgentSet from './agents/class-agentset';
import StackMachine from './agents/stackmachine';
import Agent from './lib/class-agent';
import { AGENTS, TEMPLATES } from './runtime-core';

/// FACTORY UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 *  Templates are factory functions that are stored by name in the
 *  TEMPLATES map. The factory function accepts an agentName that
 *  is used to create the base agent.
 *  When calling this function, provide the templateName and a function
 *  that will be used to add additional properties, features, and methods
 *  to the agent. Use the AgentFactory methods
 *  modify.
 */
function AddTemplate(name, f_Decorate) {
  if (TEMPLATES.has(name)) throw Error(`state template '${name}' already exists`);
  const factoryFunc = agentName => {
    const agent = new Agent(agentName);
    f_Decorate(agent);
    agent.meta.type = name;
    return agent;
  };
  console.log(`storing template: '${name}`);
  TEMPLATES.set(name, factoryFunc);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 *  Factory method to return a new Agent
 *  @param {string} agentName - name of this instance
 *  @param {string} template - name of the template to use (default 'Agent')
 */
function MakeAgent(agentName, options = {}) {
  const { type } = options;
  let agent;
  if (type === undefined) {
    agent = new Agent(agentName);
  } else {
    const factoryFunc = TEMPLATES.get(type);
    if (!factoryFunc) throw Error(`agent template for '${type}' not defined`);
    // return the created agent from template
    agent = factoryFunc(agentName);
  }
  return Agent.SaveAgent(agent);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 *  Convert an agent to a serializable object format
 */
function ExportAgent(agent) {
  // this is our serialization data structure
  const obj = {
    meta: [],
    props: {
      var: [],
      bool: [],
      num: [],
      str: []
    },
    features: []
  };

  // serialize low level agent properties
  const agentKeys = Object.entries(agent.meta);
  agentKeys.forEach(entry => obj.meta.push(entry));
  // serialize all properties by name, value, and addition parameters
  const propKeys = [...agent.props.keys()];
  propKeys.forEach(key => {
    const prop = agent.props.get(key);
    const serialized = prop.serialize();
    obj.props[prop.type].push([key, ...serialized]);
  });
  // collect features by name
  const featKeys = [...agent.features.keys()];
  featKeys.forEach(key => obj.features.push(key));

  // return serialized agent
  return obj;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return an array of agents by type */
function GetAgentsByType(type) {
  return [...Agent.GetAgentSet(type)];
}
/// PROGRAMMING INTERFACE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentSelect() {
  console.groupEnd();
  console.log(`
AgentProgram June 14 Goals

x - create a dummy agent
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
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentProgram() {
  /*/ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - \*\
    define agent MyAgent
      .name setTo "Bob the Agent"
      .x setTo 100
      .y setTo 200
      .skin setTo "balloon.png"
      define property .currentHealth as Number
        setTo 0
        max 10
        min 0
    use feature Movement
      setController "student"
    use feature Costume
      setCostumes {1:"slowbee.png", 2:"fastbee.png"}
      showCostume 1
  \*\ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - /*/
  console.groupCollapsed('Flower Programming');
  AddTemplate('Flower', agent => {
    // all this is direct templating
    agent.prop('x').setTo(100);
    agent.prop('y').setTo(200);
    agent.prop('skin').setTo('flower.png');
    agent
      .defProp('currentHealth', new NumberProp(100))
      .setMin(0)
      .setMax(100);
    agent.defProp('isAlive', new BooleanProp(true));
    agent.addFeature('Movement').setController('student');
    // this stuff has to create smcode runtime programs
  });
  console.groupEnd();
  /*/ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - \*\
    creation test
  \*\ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - /*/
  console.group('Creation Testing');
  const names = ['posie', 'peony', 'daisy', 'rose', 'tulip', 'honeysuckle'];
  const smc_init = StackMachine.SMC_GetInit();
  names.forEach(name => {
    const agent = MakeAgent(name, { type: 'Flower' });
    StackMachine.Exec(smc_init, agent);
  });
  console.log('Flowers', GetAgentsByType('Flower'));
  console.log('Mugworts', GetAgentsByType('Mugworts'));
  console.groupEnd();

  /*/ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - \*\
    when MyTimer.elapsed greaterThan 10
      @MyTimer reset
      World.pollution add 1
  \*\ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - /*/
  console.groupCollapsed('World Programming');
  AddTemplate('World', world => {
    world.addFeature('Timer');
  });
  // save creation template
  console.groupEnd();

  /*/ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - \*\
    when Bee touches Hive
    if @Bee.nectar greaterThan 0
      @Bee.nectar subtract 1
      @Hive.nectar add 1
  \*\ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - /*/
  console.groupCollapsed('Interaction Programming');
  AgentSet.defineGroup('Bee');
  AgentSet.when('Bee') // set of Bees
    .touches('Hive') // filtered Bees touching Hive
    .queueEvent('touches', 'Bee'); // operating on set
  /*/
  when Bee.energy greaterThan 0
    @Bee.energy subtract 1
    if (@Bee.energy isZero)
      @Bee die
  /*/
  AgentSet.when('Bee')
    .filter(bee => {
      return bee.speed > 10;
    })
    .queueEvent('speedExcess');
  console.groupEnd();

  /*/ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - \*\
    condition programming
  \*\ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - /*/
  console.groupCollapsed('OnTick Testing');
  const ticker = MakeAgent('TickyTicky');
  ticker.addFeature('Timer');
  console.groupEnd();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentUpdate(frame) {
  // const healthProp = agent.prop('currentHealth');
  // console.log(healthProp.value, healthProp.nvalue);
  // if (healthProp.eq(5).true()) console.log('!!! 5 health');
  // healthProp.add(1);
  const agents = GetAgentsByType('Flower');
  const smc_update = StackMachine.SMC_GetUpdate();
  agents.forEach(agent => StackMachine.Exec(smc_update, agent));
  //
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentThink(frame) {
  //
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentExec(frame) {
  //
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentReset(frame) {
  console.log('AgentReset');
}

/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SIM_ModuleInit(gloop) {
  gloop.Hook('RESET', AgentReset);
  gloop.Hook('SETMODE', AgentSelect);
  gloop.Hook('PROGRAM', AgentProgram);
  gloop.Hook('AGENTS_UPDATE', AgentUpdate);
  gloop.Hook('AGENTS_THINK', AgentThink);
  gloop.Hook('AGENTS_EXEC', AgentExec);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  SIM_ModuleInit,
  MakeAgent, // create an agent instance from template
  AddTemplate, // add template function by name
  ExportAgent, // return serializable object representing an agent instance
  GetAgentsByType // return a list of agents by type
};
