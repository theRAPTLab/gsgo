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



SOC MODE

I'm updating the func* functions for add, update, remove for my mapped pool class,

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







Algorithm:

* onAdd: sobj, dobj copy props. The keys

funcAdd() recieves SOURCE object and the new DEST object to mirror. 







---

BACKLOG
```[ ] Create DisplayObject Pool
[ ] Create SpritePool
[ ] Backport PTrackInput to use new Pool
	  
[ ] Write Display List: 
[ ] * Map Agent List to Display Objects
[ ] * Display Objects contain only visual things
[ ] * Write Display List

[ ] Read Display List:
[ ] * Read Incoming Display List
[ ] * Maintain Controlled Display List
[ ] * Display Objects to Sprite Classes

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

