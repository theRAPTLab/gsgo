PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

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

**SUMMARY S2103 FEB 08 - FEB 21**

* W1: new keywords, compiler tech documentation
* W2: network/input design, keyword jsx assist

**SUMMARY S2104 FEB 22 - MAR 07**

* W1: refactor ursys for new code, ben key/jsx help
* W2: multinet design, start implement of directory. URSYS call bug found.

**SUMMARY S2105 MAR 08 - MAR 21**

* W1: URSYS debug remote-to-remote call, declare nofix because not needed with current data flow
* W2: Start implementing device routing and skeleton input system 

---

# SPRINT 2106 / MAR 22 - APR 04

## MAR 25 THU - picking up from where I left off

I need to store the NET:UR_DEVICES message on the client in a way that is searchable using a client-side API. 

**Q. Where is the client-side API?**
A. `class-udevice` and `client-netdevices` 

## MAR 26 FRI - Adding client API for devices

The idea is that we can register devices of a certain type, and then query the device directory to find matches. Let's go through the steps of registering a faketrack device.

* [x] **Faketrack** says it has x, y, h properties
  * [x] HookPhase UR/APP_READY
  * [x] send device registration
* [x] **Tracker** query devices
  * [x] `client-netdevices` receives device map via NET:UR_DEVICES
  * [x] `client-netdevices` process device map into queryable object db
  * [x] `client-netdevices` has to be queryable by uclass
  * [x] list of inputs updates with UADDR as proof of concept

It turns out that I need to make a Differencer available in URSYS. So this is a second iteration of the original Pool, MappedPool, and SyncMap classes in GEMSTEP

The essential elements of Differencer:

```
new Differ(uniqueKey)
Differ.update(array or map)
const { added, removed, deleted } = Differ.getChanges()
```

It's a pretty simple class. It doesn't require pooling because these are not expensive pieces. We just need to know what changed since the last call, and get the ids

* [ ] add **DifferenceCache** to URSYS (variation of MappedPool, SyncMap)

  * [ ] **intake** a collection of objects with unique key
* [ ] **retrieve** the current list of objects
  * [ ] extension: can **hook** adds, updates, and removes during intake
  * [ ] extension: **retrieve** the differences since the last retrieval: updated, added, removed
  
  

## APR 02 FRI - Slow progress

The dental emergency knocked me on my ass last week and this week. Trying to recover from two weeks of delay and not get mad about it.

I had been working on the DifferenceCache which is supposed to help the device system **be aware of changes** in a way that's different from a SyncMap, which handles much more than changes. DifferenceCache probably should be used in MappedPool so the code is reused, but we'd have to write tests for it so maybe not.

DifferenceCache is being tested in-module and has better reporting of PASS/FAIL

### Using DifferenceCache in device directory

The current protocol will just rebroadcast the entire device list at once, so our difference cache will be used to see what was added/removed.

* [ ] FakeTrack registers itself
* [ ] Tracker detects registrations, but not deletions

Tracker shows a list of devices in its sidebar; I want this to always reflect the current device pool.

* [ ] `Tracker.updateDeviceList()` is called 






---

# FUTURE QUEUE

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

