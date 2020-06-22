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

## June 22 - Reviewing Dan's Project

Ben has the file. Request sent.



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

## June 22.1 - Implementation Task List

* [ ] Implement Class Ops 1: Properties during Programming Phase

* [ ] Implement Class Ops 2: Interaction Declaration during Programming Phase

  * [ ] Agent, Agent, Condition creates a key in the Conditions collection for an observable
  * [ ] Feature, Condition creates a key in the Conditions collection for an observable
  * [ ] During (D): stuff the condition event into appropriate agents or make it available from AgentTemplate
  * [ ] During (E), (F), (G): pull the condition event and do something with it, pushing it further down
  * [ ] Implement **EventQueues** as necessary...?

* [ ] Test Class Ops 2

  * [ ] timer -> invoke method
  * [ ] animframe -> invoke method
  * [ ] intersection -> invoke method
  * [ ] condition met -> invoke method

  







```
WHAT HAPPENS IN PROGRAMMING MODE?
	there's only two things that happen in programming:
	* declaring PROPERTIES - WE HAVE THIS
	* declaring INTERACTIONS - This is where features come in
	
	shared between both are:
	* setting properties via direct assignment or method
	* arithmetic expressions
	* getting/setting properties
	* calling methods
	* conditional execution
	
	So we need to do the feature invocation as part of INTERACTIONS

MovementPack invocation with agent:
	how to declare during program mode? We have access to agent.
	agent.addFeature('Movement') -> addFeature should add itself to MovementPack's list somehow
	agent.feature('Movement') -> feature should invoke the feature with itself as context for the returned object...?

MovementPack communication:
	agent.events.Think(eventName, ()=>{agent.prop.add(x));
	agent.eventQ.Think(eventName, data);
	
	
STUCK STUCK STUCK

agent.addFeature - look up FeaturePack and store in this.features[featureName], calls feature.init(agent);
agent.feature - get this.features[featureName] which implements a bunch of methods.
Each feature method MUST take as first argument the agent, followed by data object.
The feature can (1) modify the agent (2) use agent properties to update its own properties stored in the agent (3) queue an event for a later stage in the agent's event queue.

```



**Next up** FeaturePacks are pretty complicated middleware in that they have to plug-in to the overall gameloop lifecycle.

They are mini programs, which is kindof cool. But they also need to determine when to run during particular phases. 

```

agent.addFeature('Costume'); 	// initialize Costume properties, maybe adds to agent
agent.feature('Costume')			// invoke Costume
	.setColor(agent,'#ffffff');

```

