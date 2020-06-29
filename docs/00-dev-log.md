[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S11 MAY 25-JUN 07**

* W1: (Mostly MEME work.) Research lokijs, lowdb, lodash, memoization, assertion, and trigger libraries
* W2: Research deterministic finite automata and libraries (xstate), reactive programming with streams (rxjs), stream computation, the actor model, distributed architectures, message brokering systems, and relation to behavior trees and utility AI.

**SUMMARY S12 JUN 08-JUN 21**

* W1: Agent simulation execution engine starts. Basic agent set/get, value types, condition types, phasemachine
* W2: Agent collections, featurepacks, filters, and event+phase management started

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

