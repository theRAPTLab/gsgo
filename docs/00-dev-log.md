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

**SUMMARY S18 AUG 14-SEP 27**

* W1: Pool, MappedPool, Agent to DisplayObject, DisplayObject to Sprite. Introduce testing modules.
* W2: 

---

## SEP 14 MON: Implementation Plans

```
[X] Outline Data Commonalities between Classses
[X] * Agent Instance Shared Display Object Properties
[X] * Display Object Classes
[X] * Sprite Classes
[X] Generic Pool Class
[X] * objects with ids map one array of objects to pool of mapped objects
[X] * Pool has add, delete, and update methods
```
Working on the Pool implementation from `plae-input` which has the `m_MapEntities` function.

The new Pool class has the following methods:

* `new Pool(name,opt)` with options `size, batchSize,Constructor`
* `getInstance()` returns a freshly initialized instance of the Managed Class
* `returnInstance( obj )` returns the instance to the pool for reuse
* `deallocateId( poolId )` returns the instance by ID instead of instance

Next up, we need to make the actual **Agents to DisplayObjects** and **DisplayObjects to Sprites**

```
[ ] Knit Agents to DisplayObject with DiffMaps and Pools
```

Algorithm for Agents to DisplayObjects:

1. get agent entities dictionary - from `runtime-data:AGENTS`
2. get display objects dictionary - from `runtime-data:DISPLAY_OBJECTS` 
`DISPLAY_OBJECTS` dictionary is `Map<agentId, DisplayObject>`
3. using `Pool.DiffMaps(AGENTS,DISPLAY_OBJECTS, opt)` -  invoke add, update, remove operations
4. `DiffMaps` is used with `addFunc`, `removeTest` and `removeFunc` 
    `addFunc` request an instance from the Pool with `allocate()
    `
    `removeFunc` returns an instance to the Pool with `deallocate()` or `deallocateId()`

Implementation for Agents to DisplayObjects

```
DATACORE.DiffMaps(AGENTS,DISPLAY_POOL,{
	addFunc: (refId,agentDict,displayPool)=>{},
	removeTest: (displayObject)=>{},
	removeFunc: (refId,displayPool)=>{},
	updateFunc: (refId,agentDict,displayPool)=>{}
});

We have an indirect mapping from refIds to DisplayObjects stored in a DisplayPool
refId = agentId
displayObjectId = poolId

need a refId-to-displayObject map as as well
DisplayObjects need a fast lookup by refId, and therefore need a refId property

But what does it look like?
* I_PoolMappable already has refId
* Pool has to maintain a dictionary that looks up poolId

```

**I'm not sure** where the translation should happen. 

* when adding to the mapped, we are creating a new DisplayObject that has a refId. That means DisplayObject should be created with a refId to the constructor; **poolId** is created by the Pool class and mapped with a ref->poolId dictionary

* The thing to do might be to actually convert Pool to use dictionaries keyed by refId pointing to a DisplayObject which has both refId and pooId so it can be disposed.

## SEP 15 TUE: Review of Ben's Event Signaling

Ben implemented "one way data flow except for forwarding parent handlers to children", which I didn't think was a good approach because it creates hard-to-follow event chains up through the component tree. Also, there was considerable data processing happening in each component stage before finally calling a `DoSave` function on a Dispatcher to save the change.

I suggested that this wasn't necessary, because the components that are sending data should be able to just send its local change directly to Dispatcher, providing the id of the data object to update and the complete data payload. That would be much simpler.

## SEP 16 WED: Resuming

From Monday the 14th, we have these tasks:

* write agent to display object
* write display objects to sprite

For efficient encoding of a display frame:

* we'll truncate `x,y` to 1 point of precision, using`Number.toFixed(1)`.  The data type will be an array of digits that are assumed to be a fixed-point format tuple array (e.g. `[ ddd,d, ddd.d ]` for (x,y).
* `visual state` will be encoded as 8-bit field, using hex. To encode, use `Number.toString(16)`. To decode, use `parseInt( str, 16)`. For additional speed, a bitfield table can be precomputed for visual state parsing into 
* `_skin` will be sent as a url string, or possibly a system reference identifier

A special display object is a dictionary of texture URLs. This is used to generate a texture table mapping ids to the urls, so display frames can merely use the id reference. `id, name, url` are sent so the appropriate lookup tables can be generated.

This was a difficult work day due to distractions and insomnia.

## SEP 17 THU:

FIRST UP

* Can I iterate over all the agent instances?

## SEP 18-20 WEEKEND: Recovery

Trying to recover from the terrible week of distraction (therapist, fam stuff). 

**FRIDAY** - started to break down the agent to display object classes, but got boggeed. The class hierarchy is `class-pool` and `class-mapped-pool` which is the current home of critical function `SyncMaps()` which accepts a source map that will be mirrored to another map. The options for the latter are providing the various `funcAdd(), funcUpdate()` etc that are applied as items are added/removed. I got halfway through.

**SATURDAY** - starting late in the evening after brain reset. 

I'm updating the functions for add, update, remove for my mapped pool class,

A **Pool** is initialized with a **name** and  at minimum a **Constructor** function, and it can create its own instances,

A **MappedPool** is initialized with a pool, and *SyncFunctions* with **add**, **update**, **removeTest**, **remove** functions. The Mapped Pool will handle the additions/deletions from the pool itself (it has a Constructor) by using `Pool.allocate()` and `Pool.deallocate()` .  The specifics of addition, removal, and updating are handled through the passed *SyncFunctions*. 

The **SourceMap** and **DestMap** must share the same keys, though their objects can be different. This is really a MapSyncer, not a MappedPool. Pools are just used behind the scenes. The only function is `Sync( srcMap )`. The Dest Map is the Pool.

```js
// SAMPLE INITIALIZATION
import ObjectClass from 'class/ObjectClass'
const objectpool = new Pool("mypool",{ Constructor: ObjectClass });
const DOBJ_POOL = new MappedPool(objectpool,{ onAdd,onRemove, onUpdate, canRemove });
...
// SAMPLE UPDATE
DOBJ_POOL.syncFromMap(AGENTS);
```

PROBLEM: PoolId is not the same as ObjectId!!! 

RESOLUTION:  Let's look at the allocation cycle.

* The mapped pool holds all the entities we want to map. It provides a sync functions AND serves as a dictionary to retrieve objects efficiently. The difference between a MappedPool and a Map is that the MappedPool manages pre-generated instances to avoid recreating them.
* Syncable objects need to implement `Mappable`, which includes `id` and `getId()` and `setId()`. This id is used for mapping purposes. The constructor *must* be initializable with an id or be settable. That implies our visual class can't directly be a PixiJS Sprite. 

So the allocation cycle looks like this:

* the entity source (array for raw ptrack, map otherwise) is passed to a MappedPool instance sync method.
* the sync method checks if it has the id or not in its own store and adds, removes, updates as appropriate.
* the MappedPool class uses a Pool to get new objects, and these have their own unique pool_id that corresponds to a location in an array, because array access is fast. 

So MappedPool  constructs new objects with specified  id, and it returns the new object (a pool instance with a pool_id as well as the backing id). The Mappable type therefore has to implements `_pool_id` itself.

* [x] add `_pool_id` to Mappable and class-pool
* [x] make the pool class able to use `_pool_id`

Now we can **update `syncFromMap()`**  to call Pool methods so it can do what it needs to do.

* [x] fix type `MapFunction` or remove it (replaced)
* [x] in `MappedPool.syncFromMap( map of poolables )` update calls
* [x] add `id-to-pool` dictionary in `Pool` 
* [x] don't need to return a list of allocated keys in `Pool` because `MappedPool` can request from Pool.
* [x] instead add objId to poolId map
* [x] rewrite removal code to use reverse lookup
* [x] add `syncFromArray`

Debugging:

* [x] try to make allocate function automagically assign object id

**SUNDAY** - Write AGENTS to DOBJS, finish Pool and MappedPool classes w/ testing

Now, we're **testing Agent to DataObjects** with actual code!

* [x] add `test-displaylist` and `test-agents`that contains test code
* [x] rewrite `sim-agents` to call `test-agents`, simplifying it
* [x] add test `TestSyncAgents` to  `test-displaylist` 
  * [x] AGENTS is a Map of `<agentType,Set>` so it can't be directly used with `MappedPool.syncFromMap()`, so rewrite 
  * [x] Change AGENTS to be `<agentType,Map>` for ease of processing in `class-mapped-pool`
  * [x] Add `AGENTS_GetArrayAll()` to runtime-datacore
* [x] change `class-agent` to have `id` as main property, not in `meta`

BUG: the updated array is failing. 

* [ ] check that `syncFromArray()` in class-mapped-pool is correctly updating
* [ ] is class-pool not saving updated? 

The problem seems to be that when the source objects don't have an id, 

* [x] was missing parameter for` arr_update.push(sobj)`...duhdoi.

**HOW ABOUT DISPLAY OBJECTS?** Now that we are generating them, let's see what's actually there so we can then write DisplayObject to Sprite!

* [x] test copy functionality between sobj and dobj in MappedPool SyncFunctions...good!
* [x] update Sprite class to implement I_Poolable, as sprites are poolable assets
* [ ] look into `SM_Object` use of autoincrementing id...maybe be a conflict. This is why id numbers go so high.
* [x] fix issues with `var-string` defaulting to `undefined` instead of emptystring

## SEP 21 MON - Finishing off DisplayLists, Sprites ahead of PTrack

***SIDEBAR*** - Ben has created a basic model for **Features**, comprised of

1. a list of Feature commands like `showCostume`
2. defaults for those props that need them
3. scriptable actions, like `setCostume`
4. model-level commands that can override the Feature definitions

**MON 10PM**

**NEXT OUTPUT DISPLAY LIST** - The Display List needs to be passed to the **Renderer** so it can update all the sprites from the display object.

* [x] **where** should the renderer's display list come from? **runtime-datacore, duh!**
* [x] move stuff from test-displaylist into runtime-datacore
* [x] make `class-syncmap`
* [x] update runtime-datacore to use class-syncmap
* [x] how does the renderer manage sprites?
* [x] do DisplayObjects need to *NOT* have a reference to a visual?
* [x] Read DisplayList
* [x] Update Sprites from DisplayList
* [x] Render SpritePool
* [ ] move base data structures to 'common' directory?

```
PHASE_LOAD: 
	RESET, SETMODE, WAIT, PROGRAM, INIT, READY
PHASE_LOOP: 
	INPUTS, PHYSICS, TIMERS
	AGENTS_UPDATE, GROUPS_UPDATE, FEATURES_UPDATE
	CONDITIONS_UPDATE
	FEATURES_THINK, GROUPS_THINK, AGENTS_THINK, GROUPS_VETO
	FEATURES_EXEC, AGENTS_EXEC, GROUPS_EXEC
	SIM_EVAL, REFEREE_EVAL
	VIS_UPDATE, VIS_RENDER
```

I have a **really ugly** rendering system, so tomorrow I get to think about putting together the actual rendering hierarchy and design the API. Then, **FakeTrack** will also have to generate Entities and ship them to the renderer so it can handle DisplayObjects.

## SEP 22 WED - Cleaning up Renderer, then FakeTrack

```
DATACORE
  TestAgentSets(type)
  
class-display-objects
	TestValidDOBJS(dobjs)
	
class-mapped-pool
	TestMapEntities(map-> {})
	TestArrayEntities(arr-> {})

sim_render: loaded by 
	imports: UR, Sprite, SyncMap (Viewport, class pool, test-viz
	exports: { HandleDisplayList }
	maintains its own DISPLAY_LIST, but should grab it from RUNTIME
	stub HandleDisplayList(displayList)
	
test-renderer: loaded by Tracker, runtime, test-displaylist
	imports: UR, PIXI, Sprite,SyncMap
	exports: { Init, HookResize, HandleDisplayList, Draw }
	
test-agents loaded by sim_agents
	imports:
	exports:
	TestAgentSelect()
	TestAgentProgram()
	TestAgentReset()
	TestAgentUpdate(), TestAgentThink(), TestAgentExec()
	TestSyncAgents()
	TestDisplayList()
	TestInit()
	TestRender()
	
test-vis: loaded by sim_render
	imports: Pool, MappedPool
	exports:
	* tests mapped pool and pool operations (should move it out)

** THIS IS WHAT ACTUALLY DOES THE DRAWING
test-displaylist: loaded by test-agents
	imports UR, Pool, MappedPoor, TestArrayEntities
	imports runtime-datacore
	imports DisplayObject, TestValidDOBJs, test-renderer
	exports: TestSyncAgents, TestDisplayList
	hooks: SIM:INIT, SIM:VIS_UPDATE, SIM:VIS_RENDER	
```

**RESUMING** the current rendering cycle is actually hooked in `test-displaylist` ***directly*** just by loading it from `test-agents`, which is loaded by `sim_agents` and calls the exported test functions. 

* [x] move the `vis` classes into sim.
* [x] move the code from `test-displaylist` to `sim_render`

Ok, the rendering cycle is now cleaned up sim_render ... there was a stupid bug with the phase machine induced by adding debug statements in a way that triggered a false console error which lead to a series of cascading failures until I reverted to a previous build. UNBILLABLE.

## SEP 23 THU - Renderer/Sprite/Viewport Placeholder Goal!

I'm trying to get SOME kind of minimal renderer pipeline modularized. The trick is that there has to be separation from the model and the visual system. The only communication that is allowed from model/sim to visual system is through **display objects**. Likewise, we need to receive **entity positions** as well as **input triggers** from outside the system using some kind of event system which I'll call **control objects**.

 For FakeTrack to work, it needs to:

* [ ] Create from 1 to 10 sprites
* [ ] Package sprite positions into control object
* [ ] Package button triggers into control object
* [ ] Identify a **converter** process to turn raw data into the universal control object format
* [ ] Package a unique data frame that can be processed separately from other data objects, using **multiple SyncMaps**.
* [ ] Consolidate all data objects, control objects into sprite renderer

In the meantime, thinking about this architecture in the rendering with the above in mind. 

* [ ] port of `test-renderer` into the runtime
  * [x] `HookResize()` in the debounced window resize
  * [ ] **sim_agents** calls **test-agents** `TestAgentUpdate()` which just calls **SMC programs**
  * [ ] the actual agent updates are done in **sim_render** by didling the agent instances directly. We should move this to Agents Update, and separate the different sprite pools.
  * [ ] Maybe Sprites needs to maintain the big list itself. 
  * [ ] There are multiple channels of display object and now control objects (for input events from PTrack and FakeTrack, buttons, etc). Do they get their own display object channel too?

These are important issues. I made a **[thinking worksheet](https://whimsical.com/UxyGMWHtQ9jZadP2RchD34)** to make sense of the **module relationships** between controls (formerly called inputs) and their **control objects**, and display elements with **visual objects** (formerly called display objects). These are data structures uses for communicating change, so "object" isn't the greatest name for them. `ctrObj` and `visObj` are ok as parameter names, though, so maybe we'll just stick with that. 

**THE BIG QUESTIONS** to resolve right now is

* who manages agent-to-vobj conversion?
* who stores the current displayList?
* who sends outgoing displayList?
* who manages MULTIPLE displayLists?
* who receives incoming displayList
* who manages vobj-to-sprite conversion?
* who manages MULTIPLE RECIEVED displayLists?
* who managers input-to-ctrobj conversion?

The whimsical document was updated to answer all these questions, so now we have a roadmap to follow.

* defined simserver, input devices, asset server (which serves sprite elements)
* defined render, controls, and asset synchronization modules.

This should be helpful. To **reassess** the todo list from earlier for a FakeTrack base, simplified:

* [x] Move stuff out of `test-render` 
* [x] Move SyncMap data structures -> Render Passes, because SyncMaps _are_ render passes!!!
* [x] Split `syncFrom*()` into two parts: one that determines what changed, and one that processes what changed
* [ ] now disconnect `test-renderer` and substitute `renderer` in **TrackerJSX**

Does it work? Still not seeing agents OR the old bunny. Too much weird test code. 

*  is renderer.Render() being called? Yes
*  is renderer.UpdateModelList() being called? Yes
   *  who's calling it? test-display-list
   *  are dobjs passed? yes, from AGENT_TO_DOBJ_UPDATE.getSyncedObjects()
   *  the AgentList that's retrieved may not actually do something
*  ended up being the wrong reference, because in test code they create their own dictionaries
* [x] in renderer, hacked in temporary sprite updater
* [x] rename `test-agents` to `agent-functions`
* [x] port sprite code in `test-renderer` to Sprite class

Ok, this sorta works! It's still a mess but need to take a break

* [ ] re-add "drag and drop" sprite, now in Sprite class definition

## SEP 25 FRI - Draggin' and Droppin'   Sprites

**SIDEBAR**: I finally got **vscode debugging** working with the browser. 

* install visual studio debugger for chrome
* create launch.json file, and set up a config for chrome and node each. It's stored in `.vscode/launch.json`
* to debug Chrome javascript, make sure that the `webRoot` path is pointing to the root path of the *SOURCE* files (`${workspaceFolder}/src/app/`), not the actual served files `${workspaceFolder}/built/web`. If the breakponts don't work, this is why. You can also look at the `sources` field fo the `.map` file to see what your source code module paths look like. If you need to override multiple roots, there is a special sourceFilesOverride (?) property that accepts key/value pairs of the source prefix followed by the override
* use the RUN menu, and enjoy!
* You can also set up a **compound** thing that will allow you to run/debug both node and chrome at the same time. You can specify which you are debugging by using the selector in the run button bar, or clicking on the running instance in the call stack display on the left in visual studio code.
* Otherwise, do `npm run local` as normal and then run the launch config just for the browser.

**RESUME** AT MINIMUM I just need to have clickable sprites. I'd like to be able to augment our base sprite class using decoration instead of inheritance, in a manner similar to how I've implemented Features in agents. Furthermore, a main Sprite might have several SUBSPRITES that are controlled by the master. That suggests that "sprite" maybe isn't the term I should use.

```
MODELING STUFF
agents, displayobjects (dobjs), features, properties, methods, and...costumes?
```

Costumes are a feature of Agents, but they could represent ANY visual dressing for a discrete piece of data. I don't think the term matches all the possible kinds of "visual elements" we might have.  In the past, though, we've used the term **Visual** as the generic name, which goes back to terminology we used in the 90s based on. 

```
PRESENTATION STUFF
Viewports, Views, Coordinates, Markers, Particles, Screen, Visuals, VisualEffect, Audible, ScreenEffect, AudioEmitter, Renderer, RenderPass, Camera
```

I'm inclined to call it a Visual class again because it's quite different sounding that other things in our system. The list above seems to work well.

```
OBJECT SHORTHAND for INSTANCES
agents/ag, visuals/visual/vobj, displayList/dobjs/dobj, sprites/spr
```

## SEP 26 SAT - Building Sprite,  Asset Management Classes

So now I'm making a **Visual** base object that is the abstract base for a broad class of visuals, which will use an **IVisual** interface. 

* [x] rename `class-sprite` to `class-visual`
* [x] write up the `t-visual.ts` type definitions
* [x] create `class-visual.ts` base code definition
* [x] class-visual extends PIXI.Sprite (**SKIP FOR NOW**)
* [x] class-visual super(DEFAULT_TEXTURE) from Sprite TextureManager

Managing textures needs to belong to something that loads all the sprites in a dictionary. I'll put this in DATACORE for the time being.

* [x] put **Sprite Texture Manage**r that preloads assets in DATACORE
* [x] Sprite TextureManager also maintains "texture_id to url" lookup for more efficient prop changes
* [ ] Do textures have to be duplicated per sprite instance? Dunno yet.
* [x] loader save resource

I've untangled the resource loader key. There are two kinds of resources so far: spritesheets and sprites, each with a different data structure. The key properties to grab textures from are **spritesheet.textures** or **texture** (for single image). 

* [x] define asset manager library systen for system-wide sync by id
* [x] define compression protocol for display updates to use assetIds instead of strings
* [x] created asset manager class to wrap PIXI.Loader (can be extended for other resource types!!!)

**SIDEBAR** because display objects are shipped between devices on the network I'd like to improve its efficiency. When we first did this in PLAE, it was somewhat slow. After doing some research, I see we can actually **process binary data efficiently** in Javascript now; I wasn't aware of this back in 2015. So that means we can happily encode and send packed binary data between the server and clients with `ArrayBuffer` and `DataView` classes. We can encode coordinates much more efficiently than with strings by sending 4 bytes instead of 8-12 bytes _per number_. That is a significant savings, and will cut down on our JSON parse time.

#### Saturday Evening

All that was so I could specify a default sprite for the Sprite class, so I can make markers in the FakeTrack app. It leverages the existing phase system to ensure asynchronous loads are finished before the app continues to load. Let's convert the test agent pattern into a managed system.

* [x] convert test "random agents" to use default sprites
* [x] make each sprite rotate at a different rate

`sim-agents` is where this is happening. 

* AGENT_DOBJ defined, calls `agent.skin()`, which is a property that was set at Agent creation time
* Agents are created in `agent-functions` 
*   **`sim-agents`** implements an AgentUpdate that is doing the actual jiggling in the DOBJ level.
* Doing some additional overrides in `renderer`  in `RP_MODEL_SPR.setObjectHandlers()` 

So at this point, we have a working minimum sprite engine that's reading from a display list and syncing the display list to sprites. We also have a fully async loader class that can be instanced into multiple pools. Pretty clean so far.

## SEP 27 SUN - Back to Drag & Drop

The clickable sprite code







---

BACKLOG
```[ ] Create DisplayObject Pool
[ ] Renderer:
[ ] * Implement Coordinate System
[ ] * Write the Render Loop

[ ] Input:
[ ] * Read Event List
[ ] * Update Display Object from events that change things
[ ] * Convert local interactions to Agent or Display Object changes
[ ] * Write Event List

[ ] Runtime:
[ ] * Create Agent Template
[ ] * Instance Agent Template
[ ] * Control
```
---

