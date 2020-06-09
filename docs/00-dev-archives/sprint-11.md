SUMMARY S11 MAY 25-JUN 07

* W1: (Mostly MEME work.) Research lokijs, lowdb, lodash, memoization, assertion, and trigger libraries
* W2: Research deterministic finite automata and libraries (xstate), reactive programming with streams (rxjs), stream computation, the actor model, distributed architectures, message brokering systems, and relation to behavior trees and utility AI.

---

## May 25 Continuing

Continuing from Sprint 10...we're still working on **inserting the game loop**. 

**Q. Where to put the gameloop?**
A. I think probably a new module that hooks into it. But how will it get called without being run on the server?

* [x] **insert gameloop lifecycle into exec**
  making new modules/sim/mainloop...
  how to hook into init? Need to explicitly load modules in _app and initialize them manually.
  add stub calls to gameloop
* [x] **create gameloop lifecycle module???**
  similar to ur-exec, but for game loops with its own lifecycle.
  maybe add a custom phase group to ur-exec

**Q. Where is the definition for Stage 2 proposal?**
A. It's [here](https://wasda) 

## June 02 How it Works

Reacquainting myself with the project for a 15 minute push to keep the project top of mind...

I actually can't remember what it's doing now. Ok, we have **DoGameStep()** happening at 30fps. 

```
sim/
	_loop         this is the main loop, importing the following
	agents      
	conditions
	inputs
	manager
	referee
```

Loop is our main Sim controller. It exposes the following API methods:

```
SIM.Initialize
SIM.LoadSimulation
SIM.StartSimulation
SIM.PauseSimulation
SIM.EndSimulation
SIM.ExportSimulation
SIM.ResetSimulation
```

After `_app.jsx` boots URSYS, it's drives the simulation lifecycle by issuing EXEC OPS to all SystemHook subscribers. The `_loop` manager is what implements our **SimulationStep** function. It's here that we'll coordinate the different managers:

```
  # STATE UPDATE PHASE
    GetInputAll        // update the inputs data for this tick
    PhysicsUpdate      // update autonomous physics
    TimerUpdates       // update ongoing timers
    ConditionsUpdate   // update any simulation conditions

  # THINKING PHASE
    AgentsUpdate       // agent autonomous functions update
    ManagersUpdate     // managers of agents evaluate agents
    ManagersThink      // manager AI, queue decision
    AgentThink         // agent AI, queue decision
    ManagersOverride   // manager micromanage AI as necessary

  # EXECUTION PHASE
    AgentsExecute      // agents execute decision
    ManagersExecute    // managers execute decision

  # EVALUATION PHASE
    SimStateEvaluate   // update values for non-agent UI
    RefereeEvaluate    // check for change in simulation
```

This maybe isn't a bad time to introduce **typescript** in our underlying models!

## June 4 - Ramping-up for SIM PUSH

Very stressful times in the world consuming attention. Very slow progress this week clearing space to even start this work.

## June 7 - Gathering Thoughts

Here's what's on my list of things to do to get my head around this. There is  a lot to build and since it's not clear what I should build first, I will just start to build something so I can see it. 

* [ ] **write agent base class**
  first need to outline the simulation loop and data needs
  stub out data needs and also the data model
  make stub data modules
* [ ] create agents in gameloop module
* [ ] iterate over agents per cycle
* [ ] write costume, location, input placeholders
* [ ] write interaction set code
* [ ] write interaction processing

SCRATCHPAD THINKING

We're getting a basic agent loop going. We need some kind of agent hierarchy. Let's copy the stuff out of the files...we have some basics:

* name
* x, y
* visible
* costume
* color

I dove down a **deep rabbit holes** of state, distributing computing and messaging systems in preparation for writing the agent base class..

### Thoughts on GEMSTEP after reading stuff

1. XSTATE gives us **state machines** that model **state nodes** and **transitions** triggered by **events**. The machine is defined by a simple JSON structure. A state machine always has a **current value** which is the name of the state. 
2. XSTATE also implements **state charts** which add **context**, orthogonal (parallel) and hierarchical (nested) states, **history** nodes, and **guarded transitions** as well as  instantaneous **actions** and non-zero time **activities**. 
3. XSTATE can **invoke** child machines and listens to them. Child machines can be Promises, Callbacks, Observables (e.g. **RxJS**) or other XSTATE machines. 
4. XSTATE implements the **actor model** which . You create an actor by spawning a state machine, and this can (1) receive messages (2) send messages and (3) handle messages based on its current "behavior", which is (a) change local state (b) send messages to other actors or (c) spawn new actors.
5. There are some fancy options in the state machine definitions (e.g. `after` is a built-in timer, part of deferred states)  so you need to **read all the documentation** to see what's available.

#### Q. Is XSTATE useful for implementing agents and lifecycle?

I think we want to stick with **invocation** and **conditional matching** operating on **sets** of **agents** as our primary scripting conventions. I think we'll be creating our own wrapper around XSTATE, URSYS, RxJS, Behavior Trees, and Utility AI. 

The underlying concept though is **event streaming** which has **event sources** that correspond to invocation, conditions, triggers, etc. This is more an RxJS thing than an XSTATE thing. That means that **RxJS** is more likely what we use to handle the event queueing, and we design an interface that makes it look more invocation, declaration, conditional in its form. 

#### Q. Do I need to adjust URSYS or our existing lifecycle stuff?

We've already implemented the URSYS lifecycle as a state machine (Promises are a form of state machine). The actual application runtime, though, is probably runnable as an XSTATE machine with various submachines. I like the idea of writing our own interpreter that invokes other machines (called **services** in the XSTATE parlance). 

For now I won't worry about the how of implementing the overall state; we're in prototype mode and we want to make a first bad pass at this.

#### Q. What might the declaration / invocation / condition interface look like?

All agents share a number of states, so they might share state machine invocations to make them work properly. They might also retain observables. 

```
Agent imports AgentMachine which describes how it works flexibly
Agent uses AgentMachine to maintain its internal state overall.
Agent authors hook into the AgentMachine to write their code.
Agent implements an event mailbox
Agent can subscribe to observables that emit useful stuff.
```

A declaration in an Agent looks like:

```
.prop = "something" // becomes part of the agent context
```

An invocation looks like:

```
actionName parameters 
// returns a value and is set in context

package.actionName parameters
// returns a value OR is set in namespace context
// possibly a state machine or behavior tree or who knows
// is either immediate, time blocking, or async non-blocking?

// blocks run in parallel unless linked with THEN
// statements within blocks always run sequential
```

A condition looks like:

```
when MESSAGE (agent || set) actionName parameters
when MESSAGE (agent || set) package.actionName parameters
when MESSAGE (agent || set) block
```

The `MESSAGE` can be substituted with an expression that produces a message as the result of a conditional test:

```
when (.prop is 10) (agent || set) send MESSAGE
when MESSAGE (agent || set) actionName parameters
// message is sent on next frame

when (.prop is 10) (agent || set) actionName parameters 
```

There are probably **simple state machines** that would be useful data structures to produce. The modeler tool is essentially a state machine!

#### Q. Can GEMSTEP be modeled as a XSTATE Machine + RxJS?

Maybe! There is a basic loop that each agent has, and the "program" is compiled into context, actions, activities, and invocations that run during different parts of the loop so they can make decisions.

>  Insight: The student modeling activity is necessarily messy because there's no distinction made between states, state transitions, context, actions, activities, observables, and invocations, parallel, streams, and computation. And that's not even the only way we can do it...there are other modeling strategies such as behavior trees and utility functions that apply algorithms to computation. 

#### Q. So what is the first step of implementation?

Even though students may not be aware of all these distinctions, we have to be. The current scripting language is designed as a condition/event driven state machine with each node capable of invoking a number of actions or setting some kind of internal state. It's probably easier to **design the UI** at this point to reflect these concepts.

So I think I might take some time tomorrow to draw out some concepts using appropriate software. 

Let's draw a representation of the World Agent. It manages multiple super agents such as The Map and the Viewport which communicate with each other via Observable Streams. The World Agent is the home of all data observables.

* Agents themselves have a simple lifecycle. They perform computation periodically based on whatever observable event stream is driving them. These computed values can be used either to change internal state or send a message. They are essentially actors.
* implement and assign simple declaration, computation, invocation, and conditional invocation to a lifecycle phase
* implement simple blocks with `then` continuation for serial operation (`pipe`)
* Implement parallel blocks that become observers