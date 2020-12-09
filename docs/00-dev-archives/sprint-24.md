**SUMMARY S24 NOV 23 - DEC 06**

* W1: handle multiline blocks, agentset and event conditions
* W2: finalize event conditions, delivery, break

---



# SPRINT 24

## NOV 23 MON - Task List to Recover

### Completing the Compiler

1. step away from the text block parser because it isn't easy or obvious.
2. make examples for manual ScriptUnit compiling by hand
3. make tests for examples
4. specifically parsing of: expressions, program blocks
5. integrate faketrack into simulation input
6. once that works, can actually write interactions, conditions

### Making Script Examples for IU/Vanderbilt

1. start with aquatic and try writing direct ScriptUnit code

### Framing the December 1st Deliverable - Ben will keep the flame here

* can we have them program anything with direct scriptunit entry?
* provide some basic keywords that make things change on the screen
* provide some basic features to handle movement
* provide some basic sprites they can use
* for unimplemented keywords: print out the keyword (like debug printing code style) so researchers can at least make-up placeholders on the fly as they try to write programs.

RIGHT NOW

* Ben is de-facto in charge of scripting development of keywords, needed features, using/defining the syntax in terms of what it needs to do with what parameters
* Sri is creating the final bits of the compiler to handle conditions which are comprised of a test, a p-consequent, and a p-alternate.
* When the compiler text-to-blueprint works, we can focus on the stuff Ben has been working on above. And then implementing whatever needs to be there for the basic experience.

## NOV 25 WED - RESETTING

I have to rewrite the block extractor and script unit maker so it is **one** module producing script units directly. This should hopefully solve the problem I had yesterday and it will also allow me to bring back the `[[ ]]` syntax!

But first:

* [X] make unknown keyword handling part of the script engine for ben.

That's out of the way now, so we can move on to the major attractions:

**Rewriting the compiler**

* [x] make a test case file
* [x] import `transpiler-2` into `test-compiler` code and invoke test cases
* [x] confirm that the compiler is trying to compile them.
* [x] call the block compiler to examine its output
  * [x] rewrite ExtractifyBlocks to output pure lines
    * [x] for `expr then block`: emit a clean line list
* [x] does it look correct for all tests? Add signature verifier

I ended up **throwing away** ScriptifyText() and made a new version of `gscript-tokenizer` to emit the script units for me. It handles nesting too!

Next up: **compiling the script units**.

### What is Compiling?

This is using the keyword system to emit. We have to make some changes though to how keywords express their payload.

* [x] all keywords now emit TOpcode[] instead of ISMCBundle
* [x] add `#bundle name`  by parsing the source itself
* [x] in `CompileScript()` need to know the blueprint name AND understand compiler directives.

So how does that actually work in the new system?

* [x] **add `#` compiler directives to tokenizer**
* [x] compiler has to check for `#` keyword, defBlueprint in loop
* [x] test compiler works...now to re-enable SaveAgent
* [x] make sure to watch out for returning `{script}` instead of `script`, where script is a `TOpcode[]`. 

Now **fix MakeAgent**

* [x] make sure that the PROGRAM ARRAYS are actually being generated correctly, and are running.
* [x] change the keywords to emit a single prog, not a bundle (let block compiler handle it)
* [x] change the block compiler to also redirect to a specific bundle
* [x] add the new unknown keyword handling `dbgOut`

## NOV 27 FRI - GRANULAR COMPILER OUTPUT

At this point, `MakeAgent()` is working but we have to refine the way that bundles in a template are used. The `ISMCBundle` interface defines the kinds of programs we can expect to run.

**Making the Compiler Output Directives**

I've defined the TSMCBundleType, which describes what kind of bundle it is. We need to do different things depending on the bundle type. We have to write our scripts to emit the right bundle programs to the right parts of the simulation engine!

* [x] update default script to emit programs to the right execution context

  * [x] pragma in `pragma` keyword update to be case insensitive
  * [x] add `SMCBundle` class and support
  * [x] make Transpiler CompileScript use `SMCBundle`
  * [x] update code to insert it in the right place, in `RegisterBlueprint()`
  * [x] **restore blueprint** with granular program access from SMCBundle!
  * [x] add simUpdate, simThink, simExec to class-agent, update sim-agents

**Executing Program Blocks and Conditions**

This is the final hurdle, which I'll tackle in several stages:

* [x] work on`ifProg {{ }} [[ program ]]` to ensure it's working as expected
* [ ] the program blocks are not being expanded...why?
  * [x] are they being processed? In `m_ExpandScriptUnit()` but **no objcode is produced**. 
  * [x] are they being saved? **no**
  * [x] make a new `CompileBlock()` method for recursive expansion of parameters
  * [x] rename `CompileLoop()` to `CompileToBundle()`
  * [x] test in `ifProg` which is our basic IF statement

The **var** props return a value, which gets put on the stack. **We need to clean up the stack semantics!!!**

* [ ] the `var-*` property classes return values. When they're invoked inside `propMethod.tsx` at runtime, 

## NOV 28 SAT - LAST CONDITIONALS

The first conditional is **when**, which looks something like:

```
when AgentA touches AgentB [[
	consequent
]]

when AgentA [[ test ]] [[
	consequent
]]
```

* This creates a "global condition" bundle, consisting of the starting parameter, a filtering test function, and a consequent program block.
* The program consequent is executed for all agents referenced, and they should be passed in the **global context** at runtime. I'm not sure how this will be passed.
* These global conditions can be defined anywhere. If they are defined inside an Agent blueprint, this is a **special case** that includes those agent instances as the global context. However, we probably won't support that for now, as it's tricky.

OK...let's just make a when keyword and see what we can do with it.

* [x] first make `when.tsx` and detect the two signatures for singles or pairs
* [x] why is bundle.name = BLUEPRINT? off-by-one because `#` is the keyword and `BLUEPRINT` is the next arg, not name
* [x] `GetAgentsByType()` is being called before the agents are created when `SaveBlueprint()` is called by the Compiler interface. **LIFECYCLE BUG**
* [x] The conditions have to run globally though...are they? **NO**
  * [x] they are run once at blueprint compile time, which is wrong. It should be stored in the CONDITIONS dictionary in runtime-datacore
* [x] Integrate CONDITIONS into sim lifecycle
  * [x] implement datacore `SaveCondition(condition)`
  * [x] implement datacore `GetCondition(signature)`
  * [x] implement datacore `GetAllConditions()`
  * [x] add `DeleteAllConditions()`
  * [x] in `sim-conditions`, add the execution
    * [x] CONDITIONS gets erased too at runtime by AgentProgram **LIFECYCLE BUG**
    * [x] move the clear into `Compiler` for now, so AgentProgram doesn't clobber during AGENT_PROGRAM message
    * [x] add the wiring back for queueing messages and executing them later

#### IT WORKS!!!

Doesn't do very much, but the conditions seem to be working and executing. 

## NOV 29 SUN - EVENTS

ScriptEvents are detected and delivered to an AgentSet that has subscribed to it.

syntax: `on ScriptEvent args [[ block ]]` where `ScriptEvent` is something like **Tick** or **Interval**

The `on` keyword emits a program that does...?

* [ ] after compiliing the bundle, check if there are any event registration program arrays
* [ ] We need to pass it the **blueprint name** when running the context, so the generated code can call runtime-datacore `RegisterEvent()` 

I've added **SubscribeToScriptEvent** and **HandleSimEvent** to receive events. 

What's still missing is a way to specify parameters for the tetst.

```
When an event is fired, it's intercepted by the ScriptEvent handler that determines what to do.
* look up all the registered 
```

## NOV 30 MON - EVENTS IMPLEMENTATION / DELIVERY

need to add **event registration** as part of RegisterBlueprint. It already runs "AddGlobalCondition" for all the condition programs.

It's roughly working, but there is a block compiler error with `ifExpr {{ }} [[ ... ]]`

```
["onEvent","Tick", [
	"// control number of times dbgOut fires",
	"ifExpr {{ agent.prop('name').value==='bun0' }} ",
	// SHOULD BE
  // "ifExpr", "{{ agent.prop('name').value==='bun0' }}", 
  // MISSING [[
  	"dbgOut", 'mytick', 'agent instance', {{ agent.prop('name').value }}
  // SHOULD BE
	//"dbgOut 'my tick' 'agent instance' {{ agent.prop('name').value }}",
	// missing [[
	"setProp 'x'  0",
	"setProp 'y'  0"
	// missing ]] 
	]
]

```

The script tokenizer is missing the containing block in an array, and is just dumping it.

* tokenize goes through each line one at a time, recieving a "nodes" array
  * units get the nodes arrayfrom gobbleLIne
* gobbleLine
  * next line, check for comment or directive
  * otherwise process this line by gobbleToken
* The bug is happening on the SUBSEQUENT pass during EXPAND ARGS

```
upper level compile onEvent Tick [array 5]
this is fed by scriptifytext, which tokenizes source strings.
I think by gobbling space with trim(), I threw off the string parsing counts? 
```

The dbgOut is running twice for bun0, which means the expression is somehow evaluating true. I'm not sure why it started working again. There was an issue with Conditions Registrations throwing an error, but I don't see how this would fix things. 

Seems to work now though...committing careful changes. **NOTE** that some of the problem might have been related to stale scriptevent handlers in the system before I wrote DeleteAllScriptEvents().

## DEC 04 FRI - Ramping up on app design

Talked to Ben about some of his screen design ideas. We have the idea of a MISSION CONTROL with an OBSERVER, a SCRIPTER, and SCENE BUILDER role. We have to create a bunch of data structures to play around with this, but for now I just want to figure out how the SIM module will handle instancing.

On MISSION CONTROL, this is running the simulation, which consists of instances of blueprints. Where are the blueprints gathered from? On startup, there is probably a structure that contains all the available blueprints, and this can be added-to- and removed. Some kind of general blueprint manager with the usual create/read/update/delete cycle. Promising technologies are **RXDB** built on **PouchDB**, both pure Javascript solutions that look like they'll fit in well with our dataflow approach.

So...what data structures need to be in the **Sim Lifecycle**?

sim runstates:

* free-run - blueprints and instancing lists can be updated on-the-fly
* session - blueprints are fixed, and the initial instance list is stored as part of the run. start, pause. data is captured. 

Let's do some initial code outlining:

* [x] there are some run modes in sim, and some resources. So probably looking in `api-sim` is a good place to start.

* [x] make a new branch `mission-control`

* [x] review `api-sim`, write reference into WHIMSICAL document

  * [ ] the script interface is essential a text window that is named for the blueprint. It uses TRANSPILER to convert the text into ScriptUnits, which are then saved to the db and synchronized with the mission control
  * [ ] the blueprint editor might have you choose the default sprite from there
  * [ ] the **instancer** allows you to create a bunch of instances by dragging it into the window. 
  * [ ] the **input assigned** tells mission control how to handle **inputs** from other devices, which are comprised of:
    * a role, jwt-token, uaddr identifies the input
    * inputs received from the input, and when they are allowed (some are controls, other are data updates)
    * for inputs: a **map** of the role/input data to a **simulation entity** : these are either an agent factory (the name of a blueprint) or a pointer factory (the position only). Ultimately both end up consolidating to an instance on the screen
    * annotations are directed to the appropriate widget that handles it (widgets are probably implemented as feature classes)
  * [ ] The user interface for input assignment is a list of devices that can be added to a column pool that sorts into:
    * simulation controller (run/stop/free)
    * script controller
    * instance controller
    * annotation controller
    * observer controller

* [x] Detour into **cleaning up datacore** because it's getting hard to navigate all the data structures. Managing the InstanceList and other structures will go in a new module `dc-sim`

* [ ] What does the **free run** look like from the MISSION CONTROLLER perspective

  * gather the list of instances to run! A list of blueprints. Let's call this **InstanceList**

  * [ ] 

  



FREE WRITING

We have three modes: the "sim off", "free run sim" mode, the "recording" mode, the "annotation" mode, and the "playback" mode



---

**TODO** NOV 30

* After I get OnTick working as the basic scriptevent in the user event system, will outline what's in the current engine as of today for the team, with an eye toward using this a foundation for introducing how to write simulations with it (a kind of informational and concise primer?) Then afterwards document the most recent things.