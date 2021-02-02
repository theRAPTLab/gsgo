**SUMMARY S15 JUL 20-AUG 02**

* W1: opcode design, agent-script interaction design, diagram entire system
* W2: refactor to match system model, implement opcode/function execution engine, simplify system

---

### JUL 22 Wednesday 0145 - reloading brain

* [ ] create printable refs for interactive intents and current stack machine opcodes so I can look at them
* [ ] reviewed the smc state class and documented it
* [ ] feeling need to draw pictures of everything again...when I wake up (0300 pause)

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
* [x] Look at `AddTemplate()`, `MakeAgent()` factory calls

First I'm reviewing the agent class and tidying it up a bit. Getting a bit lost in the features + props in agents.

* [x] restore functions, refactor, tidy, debug base opcodes
* [x] add debug opcodes
* [x] typescript hardening

### JULY 31 Friday 0800 - Hard Stuff?

Today we have to do the following to complete the runtime engine:

* [x] convert the examples in `agents.Program()` to actual smc_methods

Yay, it works. Had to add several new opcodes and refine Feature class, as well as makes T_Stackable very strictly T_Scopeable, since the types are not compatible with each other

* [x] find a home for smc_methods and agent definition, simulating UI (in `commander.ts`)

This is where it can live for now. Next, we need to run our conditions, There are two kinds:

* [ ] opcode inline conditions: `pushProp('x'), lt(10,[ opcodes ])` and ` test([ opcodes]), flagZ([opcodes]) `

* [ ] conditions phase: need to run checks on AgentSet('Flower') or AgentSet('Flower','Bees')

  ```
  ab = AgentSet('Flower','Bees')
  		.filter('touches')  // runs a testprogram called touches = (a,b)=>{ check intersection code }
  ab.subscribe(program) // foreach pair that matches, send program to appropriate queue
  // program will be called with AgentSet on the stack, program can pop-em out
  
  AgentSets all run during Condition and run all filters and send matches
  CONDITIONS.add(ab); // run during conditions phase, 
  
  
  a = AgentSet('Flower')
  a.filter('prop')  load touches filter, produces a collection of matches
  a.subscribe(program)
  
  
  ```



