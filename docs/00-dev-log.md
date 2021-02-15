[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S20 SEP 28-OCT 11**

* W1: DisplayObjects w/ actables (drag). Generator and Tracker. URSYS diagram+enable network calls.
* W2: Sim-driven rendering. X-GEMSTEP-GUI review+integration. URSYS + gsgo refactor. 

**SUMMARY S21 OCT 12 - OCT 25**

* W1: fast compile. source-to-script/ui compilers.
* W2: researched and integrated arithmetic expressions

**SUMMARY S22 OCT 26 - NOV 08**

* W1: Parse/Evaluation, Source-to GUI and SMC, GUI compiler API
* W2: Tokenize, GUI for ModelLoop, script-to-blueprint-to-instance

**SUMMARY S23 NOV 09 - NOV 22**

* W1: Save/instance agent blueprint, runtime expression evaluation
* W2: Start conditions, start a second gemscript tokenizer for blocks

**SUMMARY S24 NOV 23 - DEC 06**

* W1: handle multiline blocks, agentset and event conditions
* W2: finalize event conditions, delivery, break

**SUMMARY S2025 DEC 07 - DEC 20**

* W1: Port FakeTrack/PTrack into GEMSRV
* W2: Simplify agent prop, method, features for use by non-Sri peeps
* W2.1: Prep for Dec 23 demo, review features with Ben

**SUMMARY S2101 JAN 11 - JAN 24**

* W1: Ramp up 2020. Draft of System Overview docs.
* W2: Script Engine review of patterns, issues, needed fixes

**SUMMARY S2102 JAN 25 - FEB 07**

* W1: Parse dotted object ref, expand args. Add keywords `prop`, `featProp`, `featCall` touse dotted object refs. Need to insert context into runtime in three or four places.
* W2: inject correct context for runtime.


---

# SPRINT 2103 - FEB 08 - FEB 21

* **TODO** - make sure can pass parameters to tests
* **TODO** fix `when` to be able to pass parameters to tests
* **TODO** - add stack operations for gvars and keywords

This sprint is for **adding FakeTrack** input as well as related systems for **device directory and input management**, possibly also **distributed state updates**. 

## FEB 09 TUE - Designing Input Manager

There are two parts to this:

(1) Device Addressibility

* Main Server (on WAN) is for LAPTOPS to connect to a SIMULATION SERVER
  * simulation server is a beefy laptop
  * is an URSYS endpoint
* Connecting devices select the role they want to use (this chooses the app)
  * First  come, first served for roles
  * Chromebooks for Script Editor, iPads for annotation/viewing
* The global simulation state is owned by Simulation Server
  * global simulation state is distributed to all devices

(2) Input Routing

* Inputs are Devices with Roles and InputType

I started `step/wip-role-mgr` to start blocking out functions. Putting it aside and looking now at adding some script keywords.

### Script Improvements

Switching to this...let's first look at **stack operations**: I think what we want to do is add `push()` and `pop()` to the gvars through `SMObject`

* [ ] The gvar methods don't have access to `state` because they are invoked with parameters, so we need to do a bit of massaging in the keywords themselves
* [ ] in `p[methodName](...args);` this is invoking the method name with args. Maybe we need a variation called `pushProp`?
* [ ] Alternatively, maybe we need to make all the gvar methods accessible as methods?
* [ ] Maybe we can always return the value by shoving the last returned value into an accumulator?
* [ ] how to write `prop agent.x setTo agent.y` ?
  * [ ] as `propPush` and `propPop`

## FEB 10 WED - bug fixing featPropPush

#### BUG

There's a **bug** with featPropPush() where ref[0] for `featPropPush agent.Costume.costumeName` is undefined instead of 'agent'

* [ ] the `refArg` coming into the compile() is already incorrect. This is produced by TRANSPILER
* [ ] compile() is called by r_CompileUnit() which calls r_ExpandArgs()
* [ ] `r_DecodeArg()` is already getting a bogus objref, so it's probably happening in `ScriptifyText()`
* [ ] so let's check `class-gscript-tokenizer` to **ensure there are no bugs in it**

There were several parse and logic bugs after running all the compiler tests. Seems to work now

* [x] featPropPush works?
* [x] featProp works?
* [x] prop works/
* [x] dbgStack works?
* [x] propPush works
* [x] propPop works?
* [x] featPropPop works?
* [x] dbgOut works?
  * [x] crash on objref
  * [x] no works on expression
  * [x] added agent context to passed contet
* [x] setCostume is wrapping things in multiple [ ] 
  * [x] state.pop was returning an array for a single item pop

### Stack Operations

* [x] propPush, featPropPush - uses objrefs only, not expressions
* [x] propPop, featPropPop - uses objrefs only, not expressions
* [x] state.pop() fixed to return default top value, not an array of one value
* [ ] dbgOut - can it still handle expressions?
* [ ] prop - can it handle expression assignments?
* [ ] prop - can it handle objref assignments?
* [ ] dbgOut, dbgStack - better way to implement output limits?

## FEB 11-12 THU/FRI - Documenting Compiler

Spent a couple of days figuring out how to document it using Typora+Mermaid, billed for half the time because was experimenting with Mermaid diagram generation. **New file is `tech-compiler-internals.md`**

Next up: INPUT STREAM RESUME...try to get to it over the weekend, then we can start writing more interesting Features.



## FEB 15 MON - Message System and I/O work through

I'm creating a new "MessageStream" class to figure out how this might work. I want:

* [ ] all the registered messages with parameters in one place in new `MessageStream` class
* [ ] use `MessageStream` to send all possible messages to server instead of `Messager` class
* [ ] handles URSYS **messages** and URSYS **device addressing**/netlist stuff and 

I'm not clear on what this will look like. But i

---

**ADDITIONAL THINGS TO IMPLEMENT**

+ set the skin from a list of assets? - good
+ some way to load/save? - make cheese API to save a file (port)
  + include both templates and instance list
+ simple prop set like nectar count - we have
+ get faketrack integrated into Movement feature
+ spawn list for instancing
+ how to show the selection dropdown for each type
+ Target Content Areas
  + Use Fish/Algae content area to model: x-gemscript (aquatic_blueprints001.gs)
  + If we get done, move to blueprints002.gs (advanced)

* After I get OnTick working as the basic scriptevent in the user event system, will outline what's in the current engine as of today for the team, with an eye toward using this a foundation for introducing how to write simulations with it (a kind of informational and concise primer?) Then afterwards document the most recent things.

**TODO** AFTER ALPHA DEC 1

* **parameter passing** between scripts is kind of ambiguous, because of the number of execution contexts. Need to document all the execution contexts and try to make sense of it.
* no **filter result caching** in place yet
* no real tests implemented yet
* combine test functions into functions table, require that name begins with TEST_AB, TEST_A, or TEST
* the state object needs to have its **context** loaded so this values are available at runtime. How do we insert it before it runs? Maybe 
* provide a better debug output experience
* make sure that Agent blueprint inheritance is implemented
* `queueSequence [[ ]] [[ ]] [[ ]] ...`
* `on TimeElapsed 1000 [[ ... ]]`

**BACKLOG**

```
Renderer + Display Lists
[ ] implement/test entity broadcasts
[ ] how to integrate multiple display lists together?
[ ] finalizing coordinate system
[ ] bring back location

Network:
[ ] design device persistant naming and reconnection between reloads
[ ] maybe use JWT to establish identities? 

Input:
[ ] Read Event List
[ ] Update Display Object from events that change things
[ ] Convert local interactions to Agent or Display Object changes
[ ] Write Event List
[ ] Important formal input mechanisms
[ ] Asset capture 

Observations:
[ ] NOTE: The difference between PhaseMachine and messages synchronicity
[ ] extension: text script format `[define]` to output a define bundle, etc

Conditional When Engine:
[ ] slow...speed it up

Persistant Data
[ ] server?
[ ] assets?
[ ] bundle-based asset management outside of git?
[ ] handle app packaging, asset packing, identitifying groups, students, orgs that it belongs to. 

```

---

