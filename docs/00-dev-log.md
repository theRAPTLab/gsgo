[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S12 JUN 08-JUN 21**

* W1: Agent simulation execution engine starts. Basic agent set/get, value types, condition types, phasemachine
* W2: Agent collections, featurepacks, filters, and event+phase management started

**SUMMARY S13 JUN 22-JUL 05**

* W1: features,agents,phases. gsgo clone repo. agent, agentset, event, pm module_init. agent template functions. agent and features into factories, composition. agent API and event forwarding. Conditions class design and message within workflow. test function encoding. 
* W2:  condition class engine, simulation-data consolidations. program+stack machine research

**SUMMARY S14 JUL 06-JUL 19**

* W1: document [architecture](https://whimsical.com/Hd6ztovsXEV4DGZeja1BTB) so I can design [script engine](https://whimsical.com/N9br22U6RWCJAqSiNEHkGG).
* W2: capture activity [interactive intents](https://docs.google.com/document/d/15_z_fw7Lp0qwFL_wPGhRSvNs4DiLxf0yoGR6JFmZdpA/edit) and define [stack machine opcodes](https://docs.google.com/spreadsheets/d/1jLPHsRAsP65oHNrtxJOpEgP6zbS1xERLEz9B0SC5CTo/edit#gid=934723724).

**SUMMARY S15 JUL 20-AUG 02**

* W1: 
* W2: 

---

#### PROMPTING QUESTION FOR SPRINT 15

Q. How to implement deferred execution with conditional branching using new stackmachine opcodes?

### JUL 22 Wednesday 0145 - reloading brain

* [ ] create printable refs for interactive intents and current stack machine opcodes so I can look at them
* [ ] reviewed the smc state class and documented it
* [ ] implement a tasker timer for pacing self in 10-minute increments
* [ ] feeling need to draw pictures of everything again...when I wake up (0300 pause)
* [ ] *interleaving joyful content browsing...needs timing*

Spent some time refining the object hierarchies, largely looking at what essential data structures were shared. It turns out  that opcodes are the universal building block, and programs as lists of opcodes are the same as methods. There are several kinds of opcodes too. 

* `opcodes` are functions that operate on `agents` and `machine state`
  * pure opcodes work directly with values on the stack
  * compound opcodes are generated using opcode generators
* `programs` are lists of opcodes that are run in-order
* both opcodes and programs can be stored once and invoked for any object that implements the `method()` and `prop()` interface

KIND OF STUCK on the object storage requirements

* opcodes are defined in a primitive `ops-` module?



### JUL 23 Thursday 0445 - reloading brain

A thinking day, based on yesterday's building blocks review. 

* updated whimsical diagram, clarifying smc_method, smc_exec
* also clarified the smc_event and smc_action

New process for **developing opcodes**

1. Start with the basics already defined in spreadsheet
2. Add compound opcodes as needed by scripts
3. Add smc_method generators to generate sequences of opcodes with values
4. create programs by capturing output of method generators
5. save programs by name

Kinds of opcodes: 

* immediate mode opcode - pure stack or agent operations (a function)
* compound mode opcode - binding closure values into other opcodes (a function)

methods vs executing methods

* methods - an array of opcodes
* exec - a function that receives parameters, sets up state and scope context, runs method, returns parameters

Time to look at **method calls** and outline them in the diagram

* draw the new class diagram
* simple increment test
* describe the library system

### JUL 24 Friday 0345 - re-reloading brain

I need to clarify how **method** and **feature** methods/props differ. I already have a class for it.

* [x] define feature packs in diagram (and code)
* [ ] write opcodes or method generators go with each
* [ ] method vs smc_method

RESOLVED

* feature props are stored in a GDictionary in `agent.props`, and are created at decoration time

* feature methods are stored as `Feature.Method` in `agent.methods`

* there are **two types of functions** stored in agent.methods

  * regular js functions  `typeof method === 'function'`
  * smc_methods `Array.isArray(method)=== true`
  * the method invocation class checks the type and calls directly or uses `smc_exec`

* features implement both kinds of methods. 

  * RUNTIME stuff is executed using the smc_methods.
  * PHASE-related methods use regular js functions

### JUL 26 Sunday 0630 - reviewing component structure and refactoring

There is a new system hierarchy, and it is time to refactor to reflect it.

Got rid of new Typescript Libraries because type is highly encumbering in prototyping. This is a second-pass kind of thing.

Made a pretty good diagram on Whimsical: [Module Hierarchy V2](https://whimsical.com/BTfD5QmAszjsfWmA8uHy1s).

### JUL 28 Tuesday 1530 - reviewing last week's work

I have the system map. Next is to refactor the code so I can start implementing each section one-by-one. But where to start?

*  1545 start working on module file hierarchy, sidetrack into callgraph diagramming to figure out what has to be adjacent to what. See [Call Graph](https://whimsical.com/3VUjwb6zxn1FkRYUtFmwZ4) on Whimsical.

### JUL 29 Wednesday 1215 - Let's Make Stuff Happen!!!

Everything will live in the sim/ directory. Updated and added to [Module Hierarchy](https://whimsical.com/BTfD5QmAszjsfWmA8uHy1s). Also cleaned up the directory so it still runs, but there's still more cleanup to do (and adjustments to make to the hierarchy)

### JULY 30 Thursday 1315 - Clean UP!!!

Yesterday I refactored and got the loop continuing to work, though there are things that need addressing. 

* [x] commit changes to sim-prototype
* [x] review sim runtime in detail

I made a map of all the methods in the current loop. The bulk of the action is in `agents`, which I've renamed to `sim_agents.js` and all other similar modules that participate in the simloop as controlled by `runtime`. 

I also reviewed the needs of the missing `sim_conditions` module, and added it. I need to add a "clean to import" module for the entire runtime, so I've **renamed** `runtime-data` to `runtime-core`. This will have all the global data structures AND pertinent methods.

* [x] move template and agent stuff to AgentFactory
* [x] move stackmachine...somewhere else

Now for the **hard part**...

* [ ] convert the examples in `agents.Program()` to actual smc_methods
* [ ] find a home for smc_methods and agent definition, simulating UI
* [ ] make conditions module retrieve its conditions list from runtime-core

First I'm reviewing the agent class and tidying it up a bit.



