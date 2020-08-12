**SUMMARY S13 JUN 22-JUL 05**

* W1: Execution engine refinements:  value types, condition types, template storage, queue programming
* W2: Condition engine integration. Hit snag in implementing conditions executing deferred functions.

---

## June 22 - Highlights of Sprint 12

* xstatejs, rxjs as potential computing stuff
* research distributed computing and state machine concepts
* phasemachine extraction and expansion
* agent: set property, get collection, filter collection
* agent: execute with parameters, execute conditionally
* agent: memory contexts in `agent.props`
* "how do observables work in software design?" with rxjs
* "how do agent conditions and execution work? [see agents doc](02-concepts/agents.md)
* intermediate javascript code for agent execution (see `agents.js`)
* agent: conditions and interactions will be "cached" during early gameloop phaseop
* agent: move timer out of UREXEC and into SIM



## June 22 - FeaturePacks, Etc.

FEATURES are "mini programs" that can subscribe to GAMELOOP phases like Agents and AgentSets. 

*** WHUT ***
All interactive elements also implement an EVENTQUEUE that is associated with the GAMELOOP. 

Unlike Agents, FEATURES do not have their own data. All Features use an agent instance as its memory store, able to read/write and call any properties or features that are implemented on it. In this way, a Feature can add complex additional behaviors to any agent.

*** PROGRAMMING ***

Agents implement the PROGRAM operation, which creates the template for any agents created during the GAMELOOP. This is where a FEATURE can be attached using the Agent's `useFeature()` method.  The feature is added to a feature table. 

During programming, Agents do only one of three things that can affect a Feature:

**CLASS 1 OPS:** declare PROPERTIES with `GSValue` classes - A feature may provide methods that set properties in agent instances.

**CLASS 2 OPS**: declare INTERACTIONS between AgentTypes -  A feature may declare an INTERACTION or CONDITION that creates an AGENTSET just as Agents can. This occurs on every simulation step.

**CLASS 3 OPS:** specify CONDITIONS that calculate property value changes or invoke Feature methods at periodic intervals (every simulation step, animation step, user-specified timer interval, or on received event)

The programming phase creates the template code that will be executed during *Initialization* and subsequent phase operations. Operation class 1 happens only once during Programming. Operation classes 2 and 3 occur during *Runtime*.

*** RUNTIME ***

```
GAMELOOP PHASES

PHASE_LOAD: A ['RESET', 'SETMODE', 'WAIT']
            B ['PROGRAM']
            C ['INIT', 'READY']
PHASE_LOOP: D ['INPUTS', 'PHYSICS', 'TIMERS', 'CONDITIONS', 'COLLECTIONS']
						E ['AGENTS_UPDATE', 'GROUPS_UPDATE', 'FEATURES_UPDATE']
						F ['FEATURES_THINK', 'GROUPS_THINK', 'AGENTS_THINK', 'GROUPS_RETHINK']
						G ['FEATURES_EXEC', 'AGENTS_EXEC', 'GROUPS_EXEC']
						H ['SIM_EVAL', 'REFEREE_EVAL']
						I ['RENDER']
```

**For Features:** Features can fully participate in the GAMELOOP, which includes `PHASE_LOAD`and `PHASE_LOOP`. This makes Features act like mini-programs running in the simulation loop, with self-contained logic and code to set up its machinery. 

**For Agents:** During the Programming PhaseOp, the main Feature API method `initAgent(agent)` is called during (B). This adds the _Agent Template_ to the feature's Initialization List, which will prepare properties inside the instance's `prop` object.

The **simulation window** contains Agent ***Instances***, which are created from the Agent *Templates* defined in the Programming phase. These instances are created during (C) before entering `PHASE_LOOP`. 

As mentioned above, only CLASS 2 and 3 operations are tested during runtime. 

1. System state is updated in (D) so agents, groups, and features have up-to-date information available every frame. System state keeps track of which Agents, AgentSets, and Features are interested in a particular state (conditions, triggers, etc), and **queues events** to each of them for processing in later phases. These event queues are implemented as observables.
2. In each subsequent phase, agents, groups, and features have a chance to acts on observables in the event queue, and potentially push more events that later phases can operate on. Agents, groups, and features may also implement their own observable streams based on piping events from a source to a destination. 



## June 24 - Implementation Task List

* [x] Implement Class Ops 1: Properties during Programming Phase

* [ ] Implement Class Ops 2: Interaction Declaration during Programming Phase

  * [ ] i. Agent, Agent, Condition creates a key in the **Conditions** collection for an observable
  * [ ] ii.. Feature, Condition creates a key in the Conditions collection for an observable
  * [ ] iii. During (D): stuff the condition event into appropriate agents or make it available from AgentTemplate
  * [ ] iv. During (E), (F), (G): pull the condition event and do something with it, pushing it further down
  * [ ] v. Implement **EventQueues** as necessary...?

* [ ] Test Class Ops 2

  * [ ] timer -> invoke method
  * [ ] animframe -> invoke method
  * [ ] intersection -> invoke method
  * [ ] condition met -> invoke method

  

Above is the list of things to do! First thing on the list is to implement Class Ops 1, which are properties during the programming phase. 

### URSYS_Initialize

Defined in `index-client`

```
URSYS_Initialize() accepts an array of initializers to execute once.
It returns true when it initializes, false if it didn't.
It checks if initialization had already occurred by chec
It calls URExec.SystemHook() to register NET_CONNECT to establish network conn.
After this is done, then looks for UR_Initialize() from each module and invokes
it, passing a function that accepts a name for the startup sequence.
```

### PhaseMachine Class

```
constructor(shortName, pmDef, dbgPrompt)

HOOK SUBSCRIBES
	HookModules(moduleArray)
  Hook(op, f, scope)
  
EXECUTION
  Execute(op, ...args)
  ExecutePhase(phaseName, ...args)
  ExecutePhaseParallel(phaseName,...args)

OPTIMIZATION UTILITIES
  GetHookFunctions(op)
  GetPhaseFunctionsAsMap(phaseName)
  
TESTING
	MockHook(op, callback)
	
```



### Sim System

This is the main entry point for the simulation system. It creates

```
Initialization from Parent in _APP.JSX UR.URSYS_Initialize
  UR_Initialize()URExec SUBSCRIBE to...
:APP_STAGE
:APP_START
:APP_RUN
:APP_UPDATE
:APP_RESET

GameLoop DEFINE PhaseMachine
PHASE_LOAD:
PHASE_LOOP:

Calls

API Methods
  LoadSimulation() 
  RunSimulation()
  StepSimulation()
  StartSimulation()
  UpdateSimulation()
  PauseSimulation()
  EndSimulation()
  ExportSimulation()
  ResetSimulation()

```



### Agents Modules

This is a logic module currently

```
import GSBoolean, GSNumber
import AgentFactory
import Features

GameLoop SUBSCRIBE to...
:SETMODE
:PROGRAM
:AGENTS_UPDATE
:AGENTS_THINK
:AGENTS_EXEC

AgentProgram()
AgentSelect()
AgentThink()
AgentUpdate()
AgentExec()
PM_Boot()
```



## June 25 - Notes on Typescript

I took another stab at using Typescript for a new library. I have decided that Typescript will not be part of our development environment if I can help for the following reasons:

1. **Compile-time static analysis is a miniscule win for high cost** - Javascript is untyped and therefore prone to mistakes in assigning properties to objects or mistyping names of functions. However, these are very fast crashes that are relatively easy to debug. Furthermore, using the live linting extension *already* highlights mispelled and unused variables. 
2. **It's not possible to use Typescript trivially** - One of the original conceits was that you could just add Typescript to your toolchain and start adding it incrementally to your code. While it's true that you can do this in the toolchain, the moment you change your source file extensions from `js` to `ts` or `jsx` to `tsx` you have to conform everything that uses a type. 
3. **Typescript errors are very verbose** - They are seldom short or prescriptive. They are exceedingly descriptive spanning multiple lines requiring a deeper knowledge of computer language metaconcepts. 
4. **Typescript decorations gets in the way of expressive, readable code** - This is the biggest dealbreaker. We are writing code that we expect casual developers to read and understand. We spend a lot of time trying to clarify our code so it tells a story as you read it, with some footnotes in comments to provide necessary context. Typescript, by comparison, litters code with some many declarations that it quickly becomes overwhelming unless you have access to a separate document that describes everything.
5. **Typescript is a terrible environment for rapid prototyping** -  It gets in the way of concepting the flow code during the prototyping stage because of the dozens of warnings it throws the moment you add a Typescript keyword. This is a constant distraction that doesn't aid in casual design approaches. 

There are a couple of uses I can think of: 

1. **Typescript is increasingly used in open source Javascript libraries, so familiarity with it would be helpful.** Not much more to say about that. Even then, Typescript is never a requirement for using those libraries; it's more useful when you have to look at source to figure out what the hell it's doing, when there is an absence of good documentation.
2. **Typescript could be useful in very strictly designed implementation of protocol-handling code**. If you have the time to create a nice hierarchy of objects and data types, Typescript would allow you to express it. That said, it doesn't help you test the code or guard against runtime errors. 

## June 25 - Implementing Agent Templates

After a few false starts, I have a pretty clean (I think) implementation of our Agent class and an Agent Factory with a reasonable Composition model that avoids duplicating functions across objects. Here's how **programming a template** looks now:

```js
// Create an Agent Template named "Flower" and set initial conditions
AgentFactory.AddTemplate('Flower', agent => {
  agent.prop('x').setTo(100);
  agent.prop('y').setTo(200);
  agent.prop('skin').setTo('flower.png');
  agent
    .defineProp('currentHealth', new GSNumber(100))
    .setMin(0)
    .setMax(100);
  agent.defineProp('isAlive', new GSBoolean(true));
  agent.addFeature('Movement')
    .setController('student');
});
```

And here's what **instantiation of a template** looks like now:

```js
// Create an agent from the template
const posie = AgentFactory.MakeAgent('My Flower',{ template:'Flower' });
```

## June 26 - Implementing Conditions

With this software design in place, I think I can move on to the Class operations. 

* [x] Implement Agent Template Programming and Instantiation

* [x] Implement Agent Serialization

* [x] Implement Class Ops 1: Properties during Programming Phase

* [ ] Implement Class Ops 2: Interaction Declaration during Programming Phase

  * [ ] i. Agent, Agent, Condition creates a key in the **Conditions** collection for an observable
  * [ ] ii.. Feature, Condition creates a key in the Conditions collection for an observable
  * [ ] iii. During (D): stuff the condition event into appropriate agents or make it available from AgentTemplate
  * [ ] iv. During (E), (F), (G): pull the condition event and do something with it, pushing it further down
  * [ ] v. Implement **EventQueues** as necessary...?

* [ ] Test Class Ops 2

  * [ ] timer -> invoke method
  * [ ] animframe -> invoke method
  * [ ] intersection -> invoke method
  * [ ] condition met -> invoke method

* [ ] Implement Class Ops 3: Conditions that change specific agents or Agent Sets

* [ ] Implement Class Ops 3: Feature invocation at periodic intervals (flexible timers)

The easiest thing to implement is the **OnTick** handler. Codewise it looks like:

```
const agent = AgentFactory('flower',{template:'Flower'});
// at runtime for one instance or programming time for all agents
agent.onTick(agent=>{
	agent.prop('x').add(1);
	agent.prop('y').add(1);
	agent.prop('x').gt(10)
		.exec( // true/false, 
			agent=>{agent.prop('x').setTo(0)}, 
			agent=>{agent.prop('y').setTo(1)}
		);
// define user method
agent.defineMethod('sin',(agent,value)=>{ stuff }));
```

The implication of this is that .onTick() accepts a callback function that will be fired at the right time.

## June 27-29 - Weekend Push

I'm working through how events and conditions relate to the current Agent/Template API.

**reboot**

745PM // is to **find the flow---any flow---and lock onto it**. I'm noticing I'm getting a headache from looking at the screeen with these glasses, so I should change them. Adjusted and refit my fixed-focus glasses.

800PM // finding the flow...where did I leave off. I'm adding the timer feature. I'm adding it to a live agent. I'm noting that an agent has three possible sources of a method: (1) agent class (2) feature method and (3) added method to object.

1030PM // finished documenting and isolating the Agent class (see class-agent.js)

1115PM // now looking at agent processing of **conditions** and **events**, which are the same thing in some ways. The execution model I'm using relies on the agent to forward certain operations to certain stages of the lifecycle. There is similar to the Actor model in that during EXEC, there are two things that can happen:

* the agent can change itself
* the agent can send a message to another agent

I don't have **message sending between agents** implemented though, so I have to think about this.

QUESTION: **What do conditions look like?**

```
agent.if(condition).or(condition).then(agent=>{
	agent.doStuff
});
```

The programming implementation of this looks something like:

```
(1) agent.if/or ...
		generate a cascade of new gbooleans + gcomparisons
(2) ...then(func)
		save the cascade of gbooleans+comparisons under a unique 'agent signature' 
```

The actual execution of the above probably looks like:

```
AGENTS_UPDATE   autonomous agent updates
GROUPS_UPDATE   autonomous group updates
FEATURES_UPDATE autonomous feature updates
CONDITIONS      (1) execute condition chains and forward func to subscribers
GROUPS_THINK
AGENTS_THINK    (2) read event stream and build exec stream
GROUPS_VETO			
AGENTS_EXEC			(3) process exec stream and invoke all functions
GROUPS_EXEC

```

QUESTION: **What does message forwarding look like?**

```
agentset.when(touch('type1','type2')).then((me,you)=>{
	me.doStuff()
	you.request('prop')
	you.tell('method',...args)
});
```

Implementing **condition chains**

* The `GSBoolean` type makes use of **comparison functions** which currently aren't defined. It only returns **truthy/falsey** results
* For `GSBoolean` to do useful work, we need to define the actual comparison functions.
* Comparison functions operate only on GSVars, and are stored in some kind of library.

```
if agent.prop('x').lt(num).then()
// literal: number.lt -> boolean
if agent.prop('x').lt(agent.prop('y')).then()
// if (x<y)
// value: number.lt ( number) -> boolean
if agent.prop('x').lt(agent.prop('y').add(10).sub(agent.prop('x')).then()
// if (x<y+10-x)
if agent.prop('x').lt(agent.prop('y').div(10).sub(agent.prop('x')).then()
// if (x<y/10-x)
if agent.prop('x').lt(GSNumber(agent.prop('y').div(10))-agent.prop('y')).then()
// if (x<((y/10)-x))

To reconstruct this expression at runtime from the script engine, we probably need to tokenize the script input. Ultimately we want a function expresion that returns TRUE

const condition = Comparisons.lt; // return exprA < exprB
const exprA = GSNumber()
const exprB = GSNumber()
```

**THIS QUICKLY BECOMES VERY COMPLICATED**... I think it might make sense to implement just a very simple set of expressions that use **numeric literals only.**

**Back to simple condition triggering**...maybe we can just use functions for now and use an expression parser.

Our simpler case looks like this:

```
if agent.test(parms) then doSomething - any test for just an agent
if agentset.test(parms) then doSomething - any tests involving a set
- turns into -
save (a) test, (b) parms, (c) necessary object, and (d) doSomething method
1. during tests phase, retrieve params and context and forward result to think phase
2. during think phase, examine streams of results, process, and forward to exec phase
3. during exec phase, execute all doSomethings with agent or agentset

for agent.tests, doSomething receives (agent)
for agentset.tests, doSomething receives (agent, target)
```

THINGS TO GATHER

* the **test** is a function that receives values from the **parms** we provide
  * agent tests operate only on **agent** or **agentset** comparison
  * property tests operate only on properties or methods that return properties.
* we also provide the **doSomething** function.
* the test is run with the **parms**
  * the test, if true, forwards an **event** to each subscribed **agent** with the **doSomething** function
* during agent.THINK, each event is potentially accepted or rejected or filtered, and forwarded
* during agent.EXEC, the **doSomething** function is executed on the agent

* [x] Add `SaveAgent()` and `GetAgentSet()` to Agent class so we can retrieve a set of agents by type
* [x] For the test:
  * [x] `MakeTypeKey(agent, ...gvars)` returns a unique key for the type of agent
  * [x] called by `Agent.test()`
  * [x] make a `condition` to pass to `test()` in 

Rudimentary flow:

```js
/// agents.js - programming phase
AgentFactory.AddTemplate('Flower',agent=>{
	const gt = (agent, gvars) => {
	  const [a,b] = GSVar.GetValues(gvars);
	  return a>b;
	}
	const exec = agent => {
		// do something with agent
	}
	agent.addTest(gt,[agent.prop('x'),10],exec);
});

/// class-agent.js - test addition
class Agent {
  // add test during programming
  // TODO: what is the final form of condition?
	addTest(condition, gvars=[], execFunc) {
    const key = m_MakeTypeKey(this, gvars);
    // TODO: save the condition, gvars, execFunc by key
    this.queue(condition, gvars, execFunc);
  }
  queue(condition, gvars=[], execFunc) {
    // TODO: create a condition event and push on a queue that
    // will be read during lifecycle...somehow
  }
}

/// class-agent.js - lifecycle static methods
/*/
conditions run after UPDATE.
conditions have references to their original gvar objects
all the conditions stored by key in the conditions store are run
if a condition uses the same TEMPLATE+TEST+GVARSIG, it's stored and run just once
/*/
```

I left off at class-agent.

* [ ] write condition key store - 

* [ ] create a condition class around name, testFunc, result interface

* [ ] hook agentfactory into lifecycle

  * [ ] hook CONDITIONS to read all conditions and run them
  * [ ] hook AGENT_THINK to read condition events and forward
  * [ ] hook AGENT_EXEC to read execution events and execute


## June 29 - MONDAY RAMPUP...HUR, HAR...

REVIEW

```
AgentFactory.AddTemplate('Flower',agent=>{});   // make template 'Flower'
AgentFactory.MakeAgent('Momo',{type:'Flower'}); // make 'Flower' agent named 'Momo'
Agent.addTest(condition, gvars=[], agent=>{});  // add a test to an agent
AgentSet.???                                    // add a test to an agent set
```

The **addTest** method has two groups of parameters:

1. `condition` and `gvars` is what's used to evaluate to true/false
2. `agent=>{}` is the function executed if the condition passes.

There are at least **two versions of addTest** for Agents and AgentSets. There are **many conditions** to define and evalute as part of our toolkit. Also, we have to write **lifecycle hooks** to run (1) and (2) at the right time in any arbitrary agent instance or AgentSet, predictably handing it in stages using **reactive streams**. OOF.

I keep forgetting that **tests can be reused**. The reuse depends on the kind of test:

1. individual agent test: needs to have **gvars** passed as parameters to the condition function
2. agent type test: needs to have **agent + propnames** passed as parameters to the condition function
3. agentset test: needs to have **agentA, agentB** passed as parameters to the condition function

#### Condition Packaging

Let's start by writing a hypothetical condition package.

**Just write some code to see some kind of flow** (add this to post later)

## June 30 - TUESDAY MIDNIGHT

Writing some code to get moving again...this is a tricky thing to conceptualize. 

Start with the programming stastement in agents.js. 

```
AgentSet
	.when().agent('moop').test('touch',{radius:10}).agent('foop')
	.then(agent=>{});

when() returns a condition object
	.agent(type) pushes agent type on the arg stack, returning self
	.touches() will push the touch test with options on the test stack, returning self
	.then() queues the execFunction, then pushes the entire condition into the conditions update lifecycle.
```

I've implemented:

* Several **stack utilities** to push **argument objects** on a stack, which will be used to populate the **test's args** when it's invoked. Eventually these might use the `var-*` classes, since these all support `value` emissions and serialization.
* A **Condition** class to implement the chain: `agent()`, `prop()`, `test()`, `then()`
* A **m_testfactory** map to store **factory functions** that generate **test functions w/ options** that return **results** of any type. Probably more than true/false...in some cases AgentSets
* A **m_conditions** map to the generated test functions by **test+arguments** signature
* new **var-agent-*** variable prop types! feature, prop, set, and template.

We're still working on that **when()-then()** call.



```
Agent
	.if().agent('moop.x').test('lt',10)
	.then(agent=>{});
	
if() returns a condition object
	Condition.prop('x') pushes modifier on arg stack
	Condition.test('lt',10) pushes arg 10 on arg stack and retrieves test
	Condition.then() queues execFunction, then pushes the entire condition in the conditions update lifecycle
```

Let's look at **if()-then()** call.

The **stack operations** need a bit of clarity.

* stack holds GSVariables which can report a `value` and a `type` 
* Condition,

We want to make a new **test class** that has some additional metadata in it.

**CURRENT STUCK POINT**

* tests work on the stack, and are executed at TEST TIME later. The values are stored on the stack during programming.
* However, we need to r**egenerate the stack** each time the test is run, not just once
* Also, we need to get the **agent instance** during **doThink** and **doExec**

I NEED TO DIAGRAM THIS

* [ ] made new classes `ObjectMap` and `SetMap` using Typescript Generics
* [ ] use new generics in new module `simulation-data`
* [ ] add utility modulies `type-defs` and `type-checks` 

## June 30 - Conditional Programming Review

Things I'm concerned about in our conditional programming.

The conditional program has to run on every frame, resetting each time. Therefore it needs program storage and some local storage. Rather than allocate stuff by address, we can make it a stack-based machine and implement ops that use the stack.

The big sticking point is automatically caching conditional tests for when() and if() conditions. But maybe I should give up on that because I'm overcomplicating it. 

Other concerns:

* being able to express everything I need in the language
* being able to reuse condition tests 
* not overdoing it!!!
* reducing overhead of stack with GSVars on it
* too many GSVar types? Or is it a diferrent type
* is the stack-based machine itself a GSVar, or its own thing (e.g. a StackMachine)

```
TENTATIVE STACK MACHINE OBJECT - has PROGRAM and STACK
	OpFunctions are function generators defined in a library, producing StackMachineFunctions
	StackMachineFunctions of form (agent,stack)=>{}
	StackMachineFunctions can pop parms from STACK and push results to STACK
	PROGRAM is a list of StackMachineFunctions generated by OpFunctions during programming phase
	STACK is reset when program is RUN
	STACK is comprised of GSVar objects
	PROGRAM runs until no more functions are left in its list

TENTATIVE OPFUNCTION LIST
	PushAgentSet(aType)      f = (agent,stack)=>stack.push(AGENTS.get(aType));     // +GSAgentSet
	PushProp(propName)       f = (agent,stack)=>stack.push(agent.prop(propName));  // +GSVar
	PushVar(GSVar,...args)   f = (agent,stack)=>stack.push(new GSVar(...args));    // +GSVar
	Test(func)               f = (agent,stack)=>stack.push(test(agent,stack));     // -/+ GSBoolean
	Expression('.x=1')       f = (agent,stack)=>{ /* do the things */ }            // -/+
	Effect(func)             f = (agent,stack)=>stack.push(func(agent,stack));     // -/+
	PopProp(propName,val)    f = (agent,stack)=>agent.prop(propName).set(stack.pop().value  // -
	SetProp(propName,val)    f = (agent,stack)=>agent.prop(propName).set(val)
	Method(methodName,...args)
	Feature(methodName,...args)

EXAMPLE PROGRAM GENERATION
	PROGRAM.clear();
	PROGRAM.add(PushProp('x'));       
	PROGRAM.add(PushVar(GSNumber,10)); 
```

It's a neat idea, but I'm **still stuck** trying to just implement the condition. Let me remind myself what conditions are supposed to do:

```
during PROGRAMMING:
  a condition is a test function that runs either on an AGENT or an AGENTSET
  a condition also has an effect function that runs when the test function passes
  conditions test functions are run during CONDITION
  conditions test functions receive (agent) parameter at minimum

during CONDITION:
  if a condition test function evaluates to true:
    the function can modify itself or send a message
    to modify itself, it must queue a message to its internal THINK or EXEC
    to send a message, it can queue a message to its AgentSet master to dispatch
    to modify itself based on external modules, it must queue a message that requeues to its think or exec

during THINK or EXEC:
	the THINK and EXEC queues are checked for functions to execute

```

This is VERY SIMILAR to what I was talking about with the "StackMachine". The messaging architecture is also very similar to URSYS. 

Both systems have:

* libraries of stateless functions that receive data at runtime

The **bridging concerns** between StackMachines and Agent Conditions are:

1. While devs can easily write fixed-function test/effect functions to implement conditions, this doesn't meet the **requirement for student programming with dropdowns**. This is the scripting language requirement / script builder. 
2. The StackMachine is the way I can think of to implement an arbitrary set of operations that follow one-after-the other. Our Script Builder can use the StackMachine OpFunctions to generate programs, and it seems systematically extensible.
3. A **hybrid approach** would maybe use `eval()` to create code, but I have just read that eval only works in global scope and is slow. You can also use a string constructor with `Function()` which is faster, but also only accesses global scope. This makes it impossible for us to use it to access local objects.
4. **So we're stuck implementing some kind of interpreter.** I think we would eventually have to do that even if we did use one of those language definition things; there still needs to be an engine that runs the script!
5. Someone must have written one. Domain Specific Language interpreters? Here's something on [DSLs in Javacript](http://sriku.org/blog/2012/04/14/creating-dsls-in-javascript-using-j-expressions/) and some general background on [DSLs](https://tomassetti.me/domain-specific-languages/), but there don't seem to be plug-and-play interpreter modules.
6. For reactive programming, it might be interesting to look at [VHDL]() for how it defines circuits. 
7. There's also this [thread on ycombinator](https://news.ycombinator.com/item?id=11998581) about writing parsers in javascipt, particular something called a [Parser Combinator](https://en.wikipedia.org/wiki/Parser_combinator), which is a way of using a 'parser function' that takes input and produces structured out. There's something called [ParJS](https://github.com/GregRos/parjs) that is implemented in Javascript that might be useful when it gets to parsing time. In this [list of parser combinators](https://tomassetti.me/parsing-in-javascript/#parserCombinators) Parsimmon is the one that seems t be the thing. ParJS is also mentioned. THen there's Chevrotain which is a Parsing DSL. I looked at this all months ago. 
8. From this [medium article on parsing](https://medium.com/basecs/leveling-up-ones-parsing-game-with-asts-d7a6fc2400ff): Then Abstract Syntax Tree (AST) is the simplified version of the "concrete syntax" tree (CST, also known as a Parse Tree). The stuff we care about is the "abstract syntax", because that we can EXECUTE. This "**intermediate code representation** or the "**IR**" is the last stage of th front-end of the compiler. 
9. There are **rules engines** like [json-rules-engine](https://www.npmjs.com/package/json-rules-engine) which can represent a language, but it doesn't really do anything. [pointfree](https://www.npmjs.com/package/@thi.ng/pointfree) is a forth-style **stack execution engine**, intriguing! Part of [thi.ng/umbrella](https://github.com/thi-ng/umbrella/) which has extensible "words". This might be a basis for what I'm doing. 
10. Also there's a nice **object-path** library called [object-path](https://www.npmjs.com/package/object-path) and it's also part of [lodash](https://lodash.com/docs/4.17.15#get) `get` now.

LIBRARIES TO LOOK AT:

* lodash for `_.get(object,'path')`
* object-path and object-path-immutable
* thi.ng/pointfree for stack-based engine



```
if() - get CONDITION OBJECT
.	push gsReferences on the PROGRAM
  .	gsAgentRef, gsPropRef are references to grab data out of an agent instance
. push gsStackExec objects condition stack
	
	the instructions look like this, and do not have their own storage
  gsPropRef.exec = (agent,stack) => stack.push(agent[this.prop])
  gsExec.exec = (agent, stack) => const [a,b,c] = stack; stack.push(this.func(a,b,c))
  gsAdd.exec = (agent,stack) => const [a] = stack; stack.push(this.value+a);

then() - package stack into an executable function returning true/false
	// lock programming stack
	const test = agent => {
		const program = [...this.program];
		const stack = [];
		while (stack.length>0) {
			
		}
	};
	
```

The Big Remaining Question:

**How to implement deferred execution with conditional branching defined in the agent template in agent instances?**