# Asynchronous Concepts

## Hooks vs Events vs Messages

In URSYS parlance, a Hook is different from an Event in the following way:

* **Hooks** tell user code WHEN to do something. We use them to customize the URSYS lifecycle to our program environment and needs.
* **Events** tell you that WHAT HAPPENED asynchronously. We only receive Events from the operating system and underlying HTML5/Javascript features

URSYS Hooks look similar to URSYS Messages, but are different in the following way:

* **Hooks** are initiated by URSYS internal operations. You write hook functions to **do something required** at the right time to make URSYS work the way it is supposed to. 
* **Messages** are initiated by user code. It's a general purpose way to initate a send-receive-respond data transaction between URSYS endpoints. They can be used to implement an Event-like sender/handler, distribute data across the network, and implement asynchronous transactions. They can also be used as a bridge between URSYS modules and other code systems. 

# URSTATE

As I develop the GEMSTEP simulation interface I'm struck by all the kinds of state we have, and how it affects the overall user experience.

* Application Lifecycle
* Game Lifecycle
* Agent Behaviors
* Referee Evaluate
* SimState Evaluate 

Each of these have:

* a "current state"
* a selection of possible "next states"
* an associated "scope"
* "scope properties" that can be inspected
* "conditions" that are truthy or falsey
* "triggers" that test conditions to potentially emit a "next state"

# LINKING EVENTS AND STATE

A Finite State Machine 

