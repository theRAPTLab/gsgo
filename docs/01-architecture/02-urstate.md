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

