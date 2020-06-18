[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S11 MAY 25-JUN 07**

* W1: (Mostly MEME work.) Research lokijs, lowdb, lodash, memoization, assertion, and trigger libraries
* W2: Research deterministic finite automata and libraries (xstate), reactive programming with streams (rxjs), stream computation, the actor model, distributed architectures, message brokering systems, and relation to behavior trees and utility AI.

---
## June 08 - Pushing into Implementation

I will probably use **xstatejs** and **rxjs** in the simulation engine. I decided though to keep the lifecycle engine from EXEC, since it already works well and is easier to understand as-is.

* [ ] ~~todo: make a stream observable model~~
* [x] install xstate and rxjs
* [ ] ~~define simloop as a machine?~~
  NO...the promise-based system we're using works better
* [x] extract `class-phase-machine` from EXEC
* [x] use `PhaseMachine` in `EXEC`
* [x] clean up PhaseMachine so semantics of invoking a phase (as opposed to an op) will fire on start and end. This might be useful for monitoring.

PhaseMachine gives us the ability to manage our game loop using the same logic as EXEC. 

* [x] simloop `Initialize()` creates a GameLoop PhaseMachine and passes to modules that will use it.

## June 09 - Wiring in Agent

It occurs to me that the tick function might better be handled in SIM rather than APP level. So let's move that functionality out so we can control rate within sim. We can then update PhaseMachine to use an RxJS observable.

* [x] cleanup: client-side UR libraries -> URLibName, LibName, ClassName
* [x] cleanup: server-side UR libraries -> NAME (module convention), ClassName
* [x] cleanup: conform module names, remove dead modules

**Move UPDATE out of URExec**

* [x] remove DOM_ANIMFRAME from URExec
* [ ] *PhaseMachine might accept hardcoded events `RESET` and `NEXT`, etc.*
* [x] remove timer code from URExec
* [x] does sim startup still? Just needed some log statements.
* [ ] Now add back timer code; use RxJS?

Working on the sim stuff...add back timer code. Try RxJS

* [x] use `interval` observable to create timer

### Q. How do you represent a collection?

A collection is a list of agents. There's a big list of agents that we want to filter. So we need a filtering function.

```
X set property
X get a collection
X filter a collection by condition
X execute an action with parameters
X execute an action conditionally
O respond to to an event
```

## June 11 - Wiring in Agent Continued

Very slow going working out bits of work. A bit burned out, so took a sidetrack to write an URSYS exporter so I can get another group of collaborators working with this. 

I have some coverage with filters, expression, actions with parameters, and conditional execution. Still events, conditional events, defined blocks, triggers. 

## June 12 -Events and Observables

```
O defining an event
O responding to an event
O conditional events
O block definition
O triggering events 
O meta: what is a block
O meta: how do observables fit into software design
```

I'm starting to get into the **block structure** of agent programming. I have the individual elements that go into code:

* setting/getting properties inside an agent context
* possibly setting/getting properties from a global context
* writing a method as a function (agent, param)
  * ...that manipulates properties and participates in the lifecycle (features)
* writing a condition as a function that returns truthy/falsey valies
  * ...writing a condition as a function that returns a ValueRange with truthy/falsey interpretation 
  * ...defining types with built-in conditional checks
  * ...chained conditions
* accesssing a collection of agents
* filtering a collection of agents using a condition
* executing a method conditionally 

**THINKING ALOUD** about **CONDITIONS**

**Event Sources** are **Observables**. Observables can be defined as a *queue of objects* that have **Subscribers**. Subscribers track their **subscription id** so they can unsubscribe as needed. There is no other flow control mechanism. Subscribers are called as soon as the Observable decides it's time to emit an event.

To define a **condition** we write an expression
```
[when] [condition] *do the thing*
```

This has two possible interpretations:

* asynchronous event detection based on condition will just do the thing
* conditionally execute the thing

The second interpretation is more of an `if` clause, where `when` is the event-style thing.

We also don't have named events in the scripting language, but behind the scenes we probably want to give them logical names.

So...let's define some stuff!

* primitive conditions are named functions that perform a comparison
* compound conditions are generated from primitive conditions by the user by defining them in the UI. they're implemented as function objects and rely on closures.

There's also the version of conditions used to create **collections**.

```
[when] [collection] [filter] [condition] *do the thing*
[when] [collection] [condition] *do the thing*

[when] [collection] [filter] 
[condition]
[and] [condition]
* do the thing*
```

We'll store the collections as memoized function keys storing collection filter and matching results during `PROGRAM`

The memoized functions will be executed once during `CONDITIONS` , and subscribing objects will have the results queued for the Agent to process later.

Each agent will retrieve the memoized function key results in the results queue during its `AGENT_UPDATE` and execute its  scripts. 

The result of an AGENT FILTERING is an AGENTGROUP. GROUPS are like MANAGERS in the old system but can be created via programming and named.

**THINKING ALOUD ON "DOING THE THING"**

We have a few basics

```
set property on an agent or on all agents in agentgroup
get property of an agent or of all agents in agentgroup (array)
invoke function on agent or on all agents in agentgroup
... which may return an array of return values?
calculate an expression using chaining functions
..write chainable classes for GBoolean, GValue, and GRange
..how to write parenthetical expressions?
invoking a function that does something
```

NOTE: when we have the possibility of returning an array of values, we will choose not to implement that in version 1.0.

## June 12 pt 2 -Script elements

I can now write this intermediary code which is similar to GEMScript

``` js
/*** PROGRAM ***/

const agent = new Agent();
// built-ins
agent.prop('name')
  .setTo('Bob the Agent');
agent.prop('x')
  .setTo(100);
agent.prop('y')
  .setTo(200);
agent.prop('skin')
  .setTo('balloon.png');
// user props
agent.defineProp('currentHealth', new GValue())
  .setTo(0);
agent.prop('currentHealth')
  .setMin(0)
  .setMax(10);
// feature packs
const MovementPack = {
  name: 'Movement',
  initialize: () => {},
  reset: () => {},
  setController: x => {
    console.log(`setting control to ${x}`);
  }
};
agent.addFeature(MovementPack)
  .setController('student');

/*** RUNTIME ***/
const healthProp = agent.prop('currentHealth');
console.log(healthProp.value, healthProp.nvalue);
if (healthProp.eq(5).true()) console.log('!!! 5 health');
healthProp.add(1);

```

ToDo: Sets, Conditions, Filters, Triggers, 

## June 17 - Writing Conditions

It's still fuzzy in my head, but I think I can just work it out as as I go in Agent.

The general idea is to write a condition caching routine, but to do that I need to write the condition first! It's multi-stage.

* [x] in Agent Program, write the conditional expression and what it should do
* [x] Add AgentSet to script-engine.js to figure out how sets work.

Resuming from where I left off at midnight...I'm working on the timers now. Maybe reactive stuff needs to happen? And after this is sorta working, let's do a review.

* [x] implement timer condition
* [x] implement when clauses
* [x] implement filter sets

We have a basic outline of things now in crappy code form. So let's save everything and then start refactoring:

* [ ] make FeaturePack base class
* [ ] make FeaturePack name manager

