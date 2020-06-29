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

import { GSBoolean, GSNumber, AgentFactory, AgentSet } from './script-engine';

/// CONTEXT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
  AgentFactory.AddTemplate('Flower', agent => {
    agent.prop('x').setTo(100);
    agent.prop('y').setTo(200);
    agent.prop('skin').setTo('flower.png');
    agent
      .defProp('currentHealth', new GSNumber(100))
      .setMin(0)
      .setMax(100);
    agent.defProp('isAlive', new GSBoolean(true));
    agent.addFeature('Movement').setController('student');
  });
  console.groupEnd();

  /*/ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - \*\
    when MyTimer.elapsed greaterThan 10
      @MyTimer reset
      World.pollution add 1
  \*\ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - /*/
  console.groupCollapsed('World Programming');
  AgentFactory.AddTemplate('World', world => {
    world.addFeature('Timer');
    world
      .feature('Timer')
      .defineTimer('population')
      .on('elapsed', timer => {
        timer.reset();
        console.log('population timer elapsed');
      });
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
    creation test
  \*\ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - /*/
  console.groupCollapsed('Creation Testing');
  const names = ['posie', 'peony', 'daisy', 'rose', 'tulip', 'honeysuckle'];
  names.forEach(name => {
    const agent = AgentFactory.MakeAgent(name, { template: 'Flower' });
    console.log(`'${name}' as export:`, AgentFactory.ExportAgent(agent));
  });
  console.groupEnd();

  /*/ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - \*\
    condition programming
  \*\ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - /*/
  console.group('OnTick Testing');
  const ticker = AgentFactory.MakeAgent('TickyTicky');
  ticker.addFeature('Timer');
  ticker.feature('Timer').onTick(agent => {
    console.log('ticked', agent.name);
  });
  console.groupEnd();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentUpdate(frame) {
  // const healthProp = agent.prop('currentHealth');
  // console.log(healthProp.value, healthProp.nvalue);
  // if (healthProp.eq(5).true()) console.log('!!! 5 health');
  // healthProp.add(1);
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

/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SIM_ModuleInit(gloop) {
  gloop.Hook('SETMODE', AgentSelect);
  gloop.Hook('PROGRAM', AgentProgram);
  gloop.Hook('AGENTS_UPDATE', AgentUpdate);
  gloop.Hook('AGENTS_THINK', AgentThink);
  gloop.Hook('AGENTS_EXEC', AgentExec);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  SIM_ModuleInit
};
