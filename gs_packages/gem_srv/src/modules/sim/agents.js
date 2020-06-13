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

import { GBoolean, GValue, GRange, Agent } from './script-engine';

/// CONTEXT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// global agent lists
const agent = new Agent();

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PROGRAMMING INTERFACE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentSelect() {
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
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentProgram() {
  /*/
  define agent MyAgent
    .name setTo "Bob the Agent"
    .x setTo 100
    .y setTo 200
    .skin setTo "balloon.png"
    define property .currentHealth as Number
      setTo 0
      max 10
      min 0
  /*/
  agent.prop('name').setTo('Bob the Agent');
  agent.prop('x').setTo(100);
  agent.prop('y').setTo(200);
  agent.prop('skin').setTo('balloon.png');
  agent.defineProp('currentHealth', new GValue()).setTo(0);
  agent
    .prop('currentHealth')
    .setMin(0)
    .setMax(10);
  console.log('*** AGENT PROGRAMMING RESULTS ***', agent.export());

  /*/
  define agent MyAgent
    use feature Movement
      setController "student"
    use feature Costume
      setCostumes {1:"slowbee.png", 2:"fastbee.png"}
      showCostume 1
  /*/
  const MovementPack = {
    name: 'Movement',
    initialize: () => {},
    reset: () => {},
    setController: x => {
      console.log(`setting control to ${x}`);
    }
  };
  agent.addFeature(MovementPack).setController('student');

  /*/
  // the collection of any bees that is touching any hive
  when Bee touches Hive
    if @Bee.nectar greaterThan 0
      @Bee.nectar subtract 1
      @Hive.nectar add 1
  /*/
  /*/
  // the collection of Bees matching a condition
  when Bee.energy greaterThan 0
    @Bee.energy subtract 1
    if (@Bee.energy isZero)
      @Bee die

  when MyTimer.elapsed greaterThan 10
    @MyTimer reset
    World.pollution add 1

/*/
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentUpdate(frame) {
  const healthProp = agent.prop('currentHealth');
  console.log(healthProp.value, healthProp.nvalue);
  if (healthProp.eq(5).true()) console.log('!!! 5 health');
  healthProp.add(1);
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
function PM_Boot(gloop) {
  gloop.Hook('SELECT', AgentSelect);
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
