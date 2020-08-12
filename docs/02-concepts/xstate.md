# XState

[XStateJS](https://xstate.js.org/docs)  is a state machine implementation of [State Chart XML](https://www.w3.org/TR/scxml/). The claimed advantages of using it is that handles edge cases for state machines that we otherwise might have to discover the hard way, so it might be good. There are also some interesting support packages for React, graphing, and a [visualizer](https://xstate.js.org/viz/) which might be helpful for working through logic.

There's a simple implementation called **xstate-fsm** for a finite state machine which is good to start with. The full **xstate** packages adds all kinds of things like history, activity, etc. This article on [State patterns for video games](http://gameprogrammingpatterns.com/state.html#so-how-useful-are-they) gives a good overview of FSMs and the extensions that make them more useful. State machines don't replace [Behavior trees]

## Using XState FSM

First you create a **machine**, and then you create a **service** that uses the machine.

### Machine

The machine is the data structure that defines all the states. The machine is comprised of **id**, **initial state**, and a **list of states**. Each state is a property of the **states** object, defining the transitions from one state to another via **events**. 

```javascript
import { createMachine } from '@xstate/fsm';

// Stateless finite state machine definition
// machine.transition(...) is a pure function.
const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: { on: { TOGGLE: 'active' } }, // transition to 'active' on TOGGLE event
    active: { on: { TOGGLE: 'inactive' } }  // transition to 'inactive' on TOGGLE event
  }
});

// access the machine data structures
const { initialState } = toggleMachine;

const toggledState = toggleMachine.transition(initialState, 'TOGGLE');
toggledState.value;
// => 'active'

const untoggledState = toggleMachine.transition(toggledState, 'TOGGLE');
untoggledState.value;
// => 'inactive'
```

Note that the machine definition is only a data structure with accessor methods. To run the machine, you need an implementor **service** to *interpret* it. 

### Service

A service "implements the finite state machine", providing the means to **subscribe** to a state change and **send** events. . 

```js
import { interpret } from '@xstate/fsm';

// toggleMachine was defined in previous code block
const toggleService = interpret(toggleMachine).start();

toggleService.subscribe(state => {
  console.log(state.value);
});

toggleService.send('TOGGLE');
// => logs 'active'

toggleService.send('TOGGLE');
// => logs 'inactive'

toggleService.stop();
```

## Using XState

When a Finite State Machine isn't enough, the full XStateJS package provides additional features. 

* [Hierarchical](https://xstate.js.org/docs/guides/hierarchical.html) State Nodes - You can nest a state inside another one. The returned state name will have a dot in the name (e.g. a 'walk' state that is nested in a 'red' state would be called 'red.walk'). The object notation version can be extracted using the `.value` getter for `Machine.transition()` 
* [Parallel](https://xstate.js.org/docs/guides/parallel.html) State Nodes - You can further define a `states` property inside a `state` definition, creating multiple machines that can run in parallel. 
* [History](https://xstate.js.org/docs/guides/history.html) State Nodes - A special state node that looks up the last active state, or the initial state if there is no history. A history state node isn't a destination in itself.
* [Actions](https://xstate.js.org/docs/guides/actions.html) - are instantaneous "fire and forget" side effects. They can happen on entry, exit, and transition. The actions are defined in an `actions` object of function properties that receives that `context` and `event` that spawned it. 
* [Activities](https://xstate.js.org/docs/guides/activities.html) - an action that takes a non-zero amount of time. The machine definition can include an `activity` property that initialize the activity in code, and returns a function to stop it.
* [Guarded](https://xstate.js.org/docs/guides/guards.html) Transitions - You can specify `guards` that receive context, event and return true. The `cond` property can be specified in a state transition definition to "guard" if the condition isn't met.
* [Context](https://xstate.js.org/docs/guides/context.html) - can specify properties related to the state machine
* [Invoking](https://xstate.js.org/docs/guides/communication.html) Services - It's encouraged to create multiple machines that talk to each other. A parent machine invokes a child machine and listens to events from `sendParent()` or waits for child to complete. These are always hierarchical relationships.
* [Actors](https://xstate.js.org/docs/guides/actors.html) - Similar to invoking services, actors can send messages to other actors, spawn new actors, or change its local state depending on behavior. Actors have their own `send()` interface, and also an optional `subscribe()` and `stop()` . I think a master Actor machine can be used as a template to `spawn()` derivatives. There aren't many examples of this other than [communicating with spawned actors](https://itnext.io/communicating-with-spawned-and-invoked-xstate-actors-in-react-999cca56506b). 
* [Interpreters](https://xstate.js.org/docs/guides/interpretation.html) - This is what actually interprets the state machine in a useful way. 

Looking for examples of xstate in game development:

* This [discussion](https://github.com/davidkpiano/xstate/discussions/255) is a small poll of who is using XState in anything.

* This article by create David K Piano discusses the [shortcomings of Redux](https://dev.to/davidkpiano/redux-is-half-of-a-pattern-2-2-4jo3) and compares to the Actor model.

* This description of What's new in XState 4.7 is also [a nice overview of XState](https://dev.to/davidkpiano/xstate-version-4-7-and-the-future-2ehk).

* On YCombinator [Ask HN: Do You use State Machines for UI Dev](https://news.ycombinator.com/item?id=16072147), has some interesting comments!

* [Making User Interfaces with Finate Automata](https://www.youtube.com/watch?v=VU1NKX6Qkxc) is highly watchable (video 2017 by DavidK)

  

## Related: RXJS

Thisis a stream processing extension. It's like functional JS + time added. 

This is some kind of reactive library for managing events. it might be useful for GEMSTEP. Here's the [primer](https://www.learnrxjs.io/) site for RxJS. It implements a computing paradigm called [Reactive Programming](https://en.wikipedia.org/wiki/Reactive_programming). RxJS is an  implementation of Reactive Programming using the [Reactive Extensions](https://en.wikipedia.org/wiki/Reactive_extensions) approach; the canonical source is [ReactiveX](http://reactivex.io/).

The basic idea seems to be that RXJS creates an "observable event stream" that can be subscribed to. The source of the events is the [Observable](https://rxjs.dev/guide/observable), and these events are consumed by [Observers](https://rxjs.dev/guide/observer). Observers implement `next()`, `error()` and `complete()`. 

[Operators](https://rxjs.dev/guide/operators) are functions that can be applied to the event stream to transform it using Array-like functions like `map()`.  It also provides a number of **debouncing** operations and **timer** operations that would be useful. XState seems to be written with this in mind. There's two kinds of **operators**: Pipeable (creates a new observable) and Creation (creates a new observable from scratch). There are dozens of [operator categories](https://rxjs.dev/guide/operators#categories) to review! Look at the [ReactiveX documentation](http://reactivex.io/documentation) for a clearer view of them. Also see **RxJS Marbles** for  [a bunch of diagrams](https://rxmarbles.com/).

## Related: Behavior Trees and Utility AI

Behavior Trees solve a different problem for game AI. Behavior Trees model planning. Utility AI is a table of weighted evaluative functions, from which the best option is picked to execute. Check this out:

* [Are Behavior Trees a thing of the Past?](https://www.gamasutra.com/blogs/JakobRasmussen/20160427/271188/Are_Behavior_Trees_a_Thing_of_the_Past.php)
* [Behavior Tree vs FSM vs HFSM](https://forum.unity.com/threads/behavior-trees-and-finite-state-machine-discussion.462903/#post-3007583)

## Related: The Actor Model

This is an old concurrency execution model! [From Hewitt video](https://www.youtube.com/watch?v=7erJ1DV_Tlo):

 It is a unit of computation, embodying:

1. processing
2. storage
3. communications

The basic idea of the actor. When an actor receives a message. The conceptual model is that 1 message is handled at a time, and can do one of the following:

1. Can create more actors
2. Can send messages to actors it has addresses for
3. "Can designate what it does with the next message it receives (to myself)"

Addresses and identity aren't the same thing. Addresses are very broad, can designate a group of identities and so forth. 

Other references

*  [Requirements for an Actor Programming Language](http://www.dalnefre.com/wp/2020/01/requirements-for-an-actor-programming-language/) is a very tidy breakdown. This is superior to the common reference [The actor model in 10 minutes](https://www.brianstorti.com/the-actor-model).

## Related: URSYS

URSYS messages is sort of a form of the Actor Model, but it's hard coded. It's also similar in some respect to Kafka, but not formalized. URSYS might be expressed as its own thing: **A distributed computing environment for authoring learning research and game-like multi-user applications.** 

Some interesting things to note distributing computing models. There's this [video](https://www.youtube.com/watch?v=tpspO9K28PM) that describes it and is a nice overview of the history of such systems.

1. **Three-tier application architecture** - user interface, business/data logic, data access. This is "pre-cloud" architecture. It's called a "monolithic architecture". Client server. That's what we're doing. The middle tier ideally is stateless: all the stuff has to receive from the client. 
2. **Sharded architectures** - The idea is [client - app - data] is perfect and avoid distributed. Shards try to create this, making many copies of the app, and routes clients through a ROUTER to these app instances. Each app has their own database. Slack is an example...each shard can handle a bunch of organizations. Problem: sharding the database gets complicated when there's too much write traffic and replication no longer works, and then start directing traffic based on some kind of key. Failures in the network create a partition (difference between data) and then the zookeeper needs to elect a NEW master. 
3. **Lambda** - For analyzing events. Makes distinction between "streaming" (log of events, unbounded, Kafka) and "batch data" (living in a place, bounded). There's (1) long-term storage for bounded analysis with high latency. There's also (2) a temporary queue of unbounded events for low latency analysis. The (1) and (2) gets written to some kind of low latency scalable database on the back end. Weaknesses: complicated to operate/maintain TWICE, but great scalability
4. **Streaming** - Integration is a first class concern (different systems talking to each other). Life is dynamic. Databases are static. Table is streams and streams is tables. Services kept close, stream computation tied to stream?
   INTEGRATION: apps want to talk to each other, it gets complicated. Can clean it up by just having services exchange messages on a common message bus (similar to 2005 enterprise service bus but not the same).  This is like a microservices architecture with data streamed to the message bus (Kafka). 
   DATABASE ASBSTRACTION: database writes can be pushed into topics, and topics don't have to expire right away! Storing data in messages! :O
5. FIRST CLASS MESSAGES: Event happens to system, it gets consumed. Later on, a service can Request from the individual. 

Other systems to look into for ideas:

* Cassandra - a distributed database
* Electrode - walmart.com's site is react+nodejs packaged up!
* Apache Beam - streaming event thing
* Spark - a framework for analyzing data
* Apache Kafka - an event queue / messaging thing. Producer, consumers, and topics. Topics are named queues of messages. Topics live on a broker running Kafka. Topics can be partitioned across multiple machines because you need a cluster of brokers, but you give up ordering with this. 
* The Streams API for Kafka is worth looking at. Doesn't requires its own cluster! Can put the stream API right in the service!
* NoSQL in 2010 - CAP Theorem says "if you are building distributed database" - **consistent** (most recent thing is thing I read it) - **available** - **partition** tolerant...YOU CAN'T HAVE ALL THREE THINGS. 
* Kafka is a form of [stream processing](https://en.wikipedia.org/wiki/Stream_processing), which has a rich and storied history. MQTT is an internet of things messaging broker system, but it doesn't have stream processing. Kafka has Kafka Connect that can integrate with the MQTT brokers. INTERESTING. Here's a interesting look at [Kafka and MQTT](https://techbeacon.com/app-dev-testing/what-apache-kafka-why-it-so-popular-should-you-use-it) history back in 2010.

Distributing Computation Notes - from this video [Distributed Systems in One Lesson](https://www.youtube.com/watch?v=Y6Ev8GIlbxc)

It's bad, but not as bad in 2017. 

* **MapReduce** is not one...**map** function splits everything into words key-value pairs (like in word counting). Then shuffle happens to move the collected maps from every computer onto one computer, which runs **reduce** to count all the results. It's cool if your data is already distributed. Used by **Hadoop**. Still widely deployed, becoming a legacy technology (in 2017). Has a good distributed filesystem (HDFS). **Spark** has taken over mindshare of Hadoop.  Has a more general data model that is useful. Programming model is more friendly (transform/action). **Kafka** is something for distributed computation using streams, real-time analysis not batch jobs...messaging *plus* computation.
* **Messaging** - loosely coupled subsystems, microservice-y, messages consumed by subscribers. 

## Ramifications for GEMSTEP

I can see how XState could be used to implement a lot of our agent behavior as an interim language. The ability to compose machines and spawn actors could provide a lot of infrastructure for us. The ability to model individual properties as libraries of machines that are composed into larger machines is kind of neat.

For something like **Position**, we would have a machine that has:

* context: x, y, vx, vy
* states: idle
* events: updatePosition, setVelocity
* actions: update

How do you trigger the state machine? Do you step through each one using `next()`?





