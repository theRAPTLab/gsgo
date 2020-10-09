

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

* [x] write an agent jitter SMprogram function in `script/cmds/basic-cmds`
* [x] make sure agent update is firing from `sim-agents` (calls `TestAgentUpdate()`)
* [ ] `TestAgentUpdate()` is calling `AGENTS_EXEC()` on each agent, but there is nothing queued in it yet.
* [x] Instead, force test by getting the `test_smc_update` program and shoving them into the `StackMachine.EXECSMC(program,agent)` interface
* [x] ZOMG it works

## SEP 30 WED - Display List Distribution

**ASIDE**: I want to write some documentation about the project. So what do I need to convey to been really quickly? [Notes for Oct 5 Report](https://docs.google.com/document/d/1yEXqVN2yofWPvsBri53kFuoHuY36lDrONN3cyeteRUM/edit)_ 

Next up: **can we ship display list information to Tracker?** 

* [ ] Emit displayList via URSYS from `Generator` 
* [ ] Make `Tracker` receive message, and shove the displayList into the Renderer

Is URSYS working for NetCall, NetPublish? **NO**

> We have to implement the full Network Communications stack, as it was never fully ported because we didn't need networking for the script development.

**URSYS MESSAGE BROKERING**: I need to make sure this is back online, as there were some changes from MEME that did not make it over.

**Q. Can we rapidly update the server without recompiling the webapp every time? The dist is already in place.**

> A. We can used` nodemon`, which GEMSRV has a `nodemonConfig` section in `package.json` to tell it what files to watch. Since we don't use webpack on server files, this should be the fastest.

**Q. For webapp building, can we just use a regular webpack build script, stealing from MEME or GEMSRV?**

> A. Probably!  Let's try: 
> `npx webpack --mode development --config ./config/wp.pack.webapp.js`
> RESULT is that it still takes 25 seconds, so speeding this up means optimizing the bundle process. 

**Q. What is going on in URNET anyway, and what's missing?**

What works right now is SOCKET CONNECTIONS, but what's not working is MESSAGES being sent. Will need to debug that, and also restart the server.

10 HOURS LATER...

I have [blueprinted the entire URSYS chain](https://whimsical.com/Mbncdb3ZjsSA9D1hLqsRRJ), which is so clever I forgot how its arcane Javascript magic with closures, promises, and hash lookups accomplished so much. Anyway, I now know what I need to confirm to restore functionality to GEMSTEP.

* [x] has the Messager class changed? **no** looks the same
* [x] has the ULINK class changed? **no,** but it's `client-channel` now
* [x] has ur-network changed? **no**
* [x] has server-network changed? **minor**  `client-network`  `m_SocketClientAck()` doesn't send dbinfo (since no db)
* [x] has NetMessage changed? **no**

CHANGED

* `SystemInit.Init() ` fetches `urnet/getinfo`  instead of having this info baked inot `index.html.ejs` as in MEME. These params are then provided to `SystemBoot()`

So I think I'm just not calling it correct? Or I need to ensure that the URCHAN instances are the same.

OR I am not using channels correctly.

* [x] in Tracker:`UR.NetSubscribe('NET:DISPLAY_LIST',data=>{ ... })`
* [x] in Generator: `UR.NetPublish('NET:DISPLAY_LIST', dobjs`)
* [x] bugfix missing NetSubscribe binding in client-channel
* [x] are Messages being registered? Tracker LazyLoads after `SystemStart()`(sets  NET_CONNECT handler) and `SystemBoot()` (PHASE_BOOT, PHASE_INIT, PHASE_CONNECT)
* [x] in `UR.SystemStart()` hook into `NET_REGISTER` ... rash on missing socket

Tracker is getting srcUID matcher handlerUID...srcUID appears to be missing

* client-network Connect() receive URLINK from index.client and saves as m_urlink
* client-network m_handleMessage() uses m_urlink to call pub
* client-channel NetSubscribe() is invoked from index.client ... same URLINK!!!
* **solution**: use CHAN_NET for Network.Connect(), CHAN_LOCAL for everyone else

New problem: when the remote calls  pkt.ReturnTransaction() after invoking the local publish, the server is unable to refind it via pkt.CompleteTransaction(), reporting resolverFunction is undefined in class-netpacket...the hash isn't being found.

* [x] convert m_transactions to hash (was Object)
* [x] see that the transaction table is never getting cleared on the server
* is the hash key incorrectly being calculated?
  * [x] What is the outgoing hash? UADDR_01:PKT0100
  * [x] what is the returning hash? SVR01:PKT0100
* Why is the hash key mismatched?
  * [x] incoming packet should have UADDR_01, but it has SVR01
  * [x] is PromiseRemoteHandler() improperly setting the source? NO
  * [x] is client-network recieving correct uaddr? YES
  * [x] is client-network returning correct value? YES
  * [x] is server-network m_HandleMessage() receiving correct value? YES
  * [x] check server-network m_SocketOnMessage...is OK? **YES!**
  * [x] in CompleteTransaction,is the key generated incorrect? **NO**
  * [x] The issue was that index-client was using the same URCHAN endpoint in both NetConnect (client-network saves the instance and and for itself. They have to be different, otherwise the anti-echo breaks.
  * [x] MAKE A DIAGRAM of CHAN_LOCAL vs CHAN_NET uses by type of call and destination.

## OCT 02 FRI - Rendering in Tracker

Wednessday-Thursday were taken up by the URSYS bug fixing session, which yielded some great insight into how the message broker works. I'd like to make some small tweaks to the naming and other conventions. But that will come later.

To **implement tracker rendering** requires two things:

1. Receiving display list updates (done through URSYS)
2. instantiating the renderer in Tracker somehow
3. plotting placeholder default sprites
4. added asset manager synchronization.

Items 2 and 4 are the ones that require additional design thinking, so thinking aloud:

**Instantiating Renderer**

Because Tracker is a stand-alone webapp that shares a common set of modules, we can't shove the runtime code into the sim loop. We need a different loop. I think maybe we can implement that as a separate set of features. For example, the simloop is entirely part of the `app/modules/sim/*` hierarchy, implementing a phasemachine to manage it all. Why not do the same for a `tracker` module that can be instantiated in the same way?

```
PLUGIN MODULE
entry point: implements PhaseMachine and calls subsequent modules. To activate it, you merely import it in the page route.

runtime and runtime-datacore move out of sim, and a replacement file takes runtime's place in the sim directory.
```

How does Renderer hook into the Update cycle? Maybe there is a **central dispatch**. I think we can move `runtime` and `runtime-datacore` up so common data storage can be shared across modules.

**Asset Manager Synchronization**

The Asset Manager is two **lookup tables** of **name to id** and **id to resource**. The ids are hard coded by some truth of source, so the numbers don't change. 

```
define assets.json to load during ASSET_LOAD
ASSET_MGR is in runtime-datacore


let response = await fetch(url)
let data = await response.json()

clear the resource pool
load all the sprites
```

## OCT 03 SUN - Runtime Refactor

Our first order of the day is to split the single `sim/runtime` into a runtime hierarchy. The general idea is to have a master runtime at the modules level, and the immediate directories below contain stand-alone modules that can be selectively imported at runtime in the root.

* [x] move runtime.js, runtime-datacore.js
* [x] make new sim/runtime-sim module runtime
* [x] move renderer out of sim (display objects only)
```
FIGURING OUT path resolution in viscode
set it up in tsconfig.js, which will also update eslint, which will also make visual studio code work
```
* [x] add path aliases for importing app, lib, modules, config in tsconfig.js

To move renderer out of sim, we have to refactor it into several functions

* creating the PIXIJS surface on Init
* DisplayList Generation
* DisplayList Rendering
* Access to Init, UpdateDisplayList, GetDisplayList,  MakeDisplayList, Render 
* Access to AssetManager
* Render-specific Classes
* What does it mean to import the runtime-renderer by itself for **implicit init**?
  * it maintains its own frame update routines
  * it does whatever it needs to do to support the functions
* What does it mean when another module imports runtime to **access features**?
  * the implicit init should work in this case.


* [x] ensure that the mere act of including ``api-render` initalizes PIXI
* [x] add RENDERER.Init() to TrackerJSX mount
* [x] add RENDERER.UpdateDisplayList() and RENDERER.Render() to NET:DISPLAY_LIST processing
* [x] modify PHASE_LOAD in client-exec to have LOAD_CONFIG and LOAD_ASSETS
* [x] load sprites
* [x] make rendering work!

`Tracker` uses its own renderer that happens when `NET:DISPLAY_LIST` occurs. Generator, though, uses `sim-render` to drive its rendering loop. However, the Rendering cycle has to wait.

**IMPLEMENTING DRAG AND DROP** 

Last thing to do for FakeTrack is to make only the generator sprites draggable, and update the underlying agent too.

```
The display list on GENERATOR has to take the selected state of the agents into account. However, the display list is generated from agents directly; there is no "draggable" state being set. Also, the dragging is happening on the SPRITE level.
```

* [ ] Can I rewrite MakeDraggable to update the agent itself as it moves?
  * [x] add controlMode to agent auto, puppet, static with accessors
  * [x] set controlMode to puppet on startDrag
  * [x] pop controlMode on stopDrag
  * [x] update agentToDobj in sim-agents to set `dobj.mode`
  * [x] update dobjToSprite in api-render to check `dobj.mode` on creation
  * [x] add isSelected, isHovered, isGrouped, isCaptive flags to class-visual with accessors
  * [x] define `IActable` to represent group, hover, etc
  * [x] add IActable to Visual, Dobj, Agent
  * [x] in sim-agents, add dobj.dragging = agent.isCaptive
  * [x] in api-render, add dobj.dragging to sprite updat

```
To make an agent "draggable" would be to apply a screen-space concept to a sim object, which violates our separation of concerns. Instead, I think making an agent have a state indicating it's being controlled or automated, or puppeted would translate. 
```

the problem is that dobjs on the render-only tracker can't access agent information, so it has to be in the dobj itself. 

api-render serves two masters: Generator runs vobj through MakeDraggable if dobj=1 (puppeted). Tracker should NOT run through MakeDraggable. Also it has no access to Agents.

* [x] add RENDERER.GlobalConfig({actable:true}) to Generator. Use actable:false for Tracker.
* [x] api-render: is dobj.dragging set when agent.isCaptive? **yes**
* [x] sim-agents: is dobj.dragging set when agent.isCaptive? **yes** but...
* [x] sim-agents: is agent.isCaptive being set? **NO**
  * [x] draggable: has to setCaptive() on the *AGENT* in Generator

YAY, it seems to work!

* NEXT look at adding TAB SUPPORT for APP_SRV

* after refactoring pass 1

## OCT 09 FRI - Review, X-GEMSTEP-UI, Pre-integration

We submitted the report on late Monday, and Tuesday was a rest day. Wednesday we started to talk about the next steps and what we could deliver by December 1. Thursday we ported X-GEMSTEP-UI. Today I started doing some pre-integration cleanup of the Messager Class and PhaseMachine to make the front-end message interface easier. Using the messager channels to set the toNet, toLocal calls worked out in simplifying things. Also I started confirming the method names so they follow the Javscript conventions, and I renamed the methods so they feel a little better. There's no more pblish and subscribe, but instead there's reigsterMessage, sendMessage, etc. Much better.

Next, I want to do the same for phaseMachine. I've commited the last changes.

* [ ] 


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

