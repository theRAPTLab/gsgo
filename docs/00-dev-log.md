

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

* W1: opcode design, agent-script interaction design, diagram entire system
* W2: refactor to match system model, implement opcode/function execution engine, simplify system

**SUMMARY S16 AUG 03-AUG 16**

* W1: Added last pieces of script engine: condition objects, agent sets, tests, execution of subprograms.
* W2: Update [script engine docs+diagrams](https://gitlab.com/stepsys/gem-step/gsgo/-/merge_requests/9) as it stands now. Push repo. New wireframe based on Joshua diagram.

**SUMMARY S17 AUG 17-AUG 30**

* W1: Wireframing from Joshua, placeholder components
* W2: Port PTRack, issues with PixiJS and React and SSR.

**SUMMARY S18 AUG 31-SEP 13**

* W1: New FakeTrack progress, resurrect appserv architecture for pixiJS integration
* W2: Refit URSYS. Sprite and display list system architecture for clickable interactions

**SUMMARY S19 AUG 14-SEP 27**

* W1: Pool, MappedPool, Agent to DisplayObject, DisplayObject to SpritePool. Introduce testing modules.
* W2: Renderer, Sprite class, Asset Manager, Render Loop, APPSRV lazy loaded routes, URSYS hardening.

---

## SEP 28 MON - Organization Day

* [ ] **priority**: how about testing the agent programs actually update themselves and this automatically works?

## SEP 29 TUE - Testing Agent Updates via Script

This is a light test until the workweek starts on Wednesday. Let's see if the scripts can actually do what they are supposed to do purely in agent programming, which the renderloop should automatically just do.

* [ ] remove rendering loop from TRACKER and FAKETRACK routes
  * [ ] `Tracker.jsx` starts the simloop by `import modules/sim/runtime`
  * [x] `runtime` imports `sim-*` phase handlers, each which use `UR.SystemHook()` to do its actual processing.
  * [x] `runtime` also provides API methods Load, Start, Export, Reset, and these are triggered by `APP_STAGE`, `APP_START`, etc. 
  * [x] **fix** distinguish between `APP_UPDATE` and `APP_RESTAGE`

This code just runs because it hooks early into the UR phase machine. We want to **run more granularly** for these operations.

* **SimControl**: start, stop (etc)  GameLoop from `Tracker.jsx` GUI
* **AgentProgram**: Agent Definition templates
* **AgentInstance**: Create instances and set initial conditions
* **InputEnable**: inputs-to-entities (`ptrack` and `faketrack` data processing)
* **EntityInput**: reading PTrack and FakeTrack geometry data: frame-to-entity
* **ControlInput**: reading control events from anywhere: cobj-to-message|state
* **DisplayListWrite**: creating the display list object(s): agents-to-dobjs
* **DisplayListRead**: reading a display list from elsewhere: frame-to-dobjs
* **DisplayListRender**: interpreting the display list object(s): dobjs-to-sprite

*FOR NOW* - let's just see if it works. I disabled runtime in Tracker and FakeTrack.

* [x] disable autoJitter in `sim-agents AgentUpdate()`.  Moved to `TestJitterAgents()` in `agent-functions`
* [x] disable autoRotate in `renderer Init()` setup. Moved to `TestRenderParameters()` in `renderer-functions`
* [ ] Look at `TestAgentProgram()` in `agent-functions` and make it update agent positions.
  * [x] set the starting position to random
  * [x] set the starting skin from agent definition
  * [x] fix bugs in render chain
  * [x] make sure that properties are being copied
  * [ ] add agent update to its program

**OOPS** there actually isn't a sample update SMC script in the Test Agent Template yet, because there was no way to see anything happen until now. So our NEXT STEP for WEDNESDAY is

* [x] write an agent jitter SMC program function in `script/cmds/basic-cmds`
* [x] make sure agent update is firing from `sim-agents` (calls `TestAgentUpdate()`)
* [ ] `TestAgentUpdate()` is calling `AGENTS_EXEC()` on each agent, but there is nothing queued in it yet.
* [x] Instead, force test by getting the `test_smc_update` program and shoving them into the `StackMachine.EXECSMC(program,agent)` interface
* [x] ZOMG it works

## SEP 30 WED - Display List Distribution

Next up: **can we ship display list information to Tracker?** 

* [ ] Emit displayList via URSYS from `Generator` 
* [ ] Make `Tracker` receive message, and shove the displayList into the Renderer

Is URSYS working for NetCall, NetPublish? **NO**

> We have to implement the full Network Communications stack, as it was never fully ported because we didn't need networking for the script development.

**ASIDE**: I want to write some documentation about the project. So what do I need to convey to been really quickly? [Notes for Oct 5 Report](https://docs.google.com/document/d/1yEXqVN2yofWPvsBri53kFuoHuY36lDrONN3cyeteRUM/edit)_ 






---

BACKLOG
```
Renderer + Display Lists
[ ] implement/test entity broadcasts
[ ] how to integrate multiple display lists together?

Network:
[ ] design device persistant naming and reconnection between reloads
[ ] maybe use JWT to establish identities? 

Input:
[ ] Read Event List
[ ] Update Display Object from events that change things
[ ] Convert local interactions to Agent or Display Object changes
[ ] Write Event List

Runtime:
[ ] Create Agent Template
[ ] Instance Agent Template
[ ] Control
```
---

