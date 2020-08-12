# Agents

## What can Agents DO?

* Agents themselves have a simple lifecycle. They perform computation periodically based on whatever observable event stream is driving them. These computed values can be used either to change internal state or send a message. They are essentially actors.
* implement and assign simple declaration, computation, invocation, and conditional invocation to a lifecycle phase
* implement simple blocks with `then` continuation for serial operation (`pipe`)
* Implement parallel blocks that become observers

## How do Agent Conditions Work?

**WIP**

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
* do the thing *
```

We'll store the collections as memoized function keys storing collection filter and matching results during `PROGRAM`

The memoized functions will be executed once during `CONDITIONS` , and subscribing objects will have the results queued for the Agent to process later.

Each agent will retrieve the memoized function key results in the results queue during its `AGENT_UPDATE` and execute its  scripts. 

The result of an AGENT FILTERING is an AGENTGROUP. GROUPS are like MANAGERS in the old system but can be created via programming and named.

## How Do Agents Do Anything?

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

