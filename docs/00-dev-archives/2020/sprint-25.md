**SUMMARY S25 DEC 07 - DEC 20** + 2DAYS

* W1: Port FakeTrack/PTrack into GEMSRV
* W2: Simplify agent prop, method, features for use by non-Sri peeps
* W2.1: Prep for Dec 23 demo, review features with Ben

# SPRINT 25

**STILL TO IMPLEMENT**

* [x] an agent or agent template that can be created
* [ ] static or faketrack controls

## DEC 08 TUE - Picking Up

Ben's been implementing some kind of scripting UI. I'm trying to remember what to do next. I just **refactored datacore** in anticipation of managing the `INSTANCES` map. This is an array of initializer programs for each agent instance, since they could all be different. These can be null programs too, but this is what we need to maintain a list of instances.

So...how does this work?

* Instances have an initialization program that sets unique starting values. This is produced by the transpiler as the `init` program in TSMCBundle.
* I should change the pragma also for output libraries...done

Freewriting...the instancing operation would look something like this:

* user drags a blueprint into the world
* The blueprint is instanced per usual
* the instance appears in a panel
* clicking an instance allows you to change the name and starting property values. The name is stored in the instance itself

When saving state, we need to save the blueprint, the name, and the initial values. The initial values are a program like `setProp frame 1`, so it's a program array again.

* [x] Define TInstanceMap and TInstance in dc-sim
* [x] `DefineInstance(name,bp,init)`
* [x] Rewrite Transpiler.MakeAgent to use new TInstance class
* [x] Rewrite sim-agents.AgentProgram to define instances then make them

## DEC 09 WED - Adding FakeTrack

The idea is to **port the old one as-is** and see what it does. I forget.

FakeTrack PLAE breakdown

* **game-run.jsx** - loads game-run.css, also LoadAssets does `<FakeTrack controller={MOD_FAKETRACK}/>`
* **FakeTrack.jsx** - this component has state with transformation matrix. Port FakeTrack component, also MOD-faketrack as input-faketrack.js`. 

GOT AS FAR AS REWRITING FAKETRACK DRAG INTERFACE without JQUERY. What a pain in the ass.

Tomorrow we'll try hooking-up the GetInput on the client side to confirm we're getting FakeTrack data

## DEC 10 THU - 2nd Stage FakeTrack...input into client

Where I left off yesterday was just getting FakeTrack to send data. It seems to work. Now I have to remember how to get it into the system.

**Q. Who is handling the PTrack input?**

In `modules/step/ptrack` and `modules/step/lib/*` are the tracker related classes. 

* server-side: `step-ptrack.js`
* client-side: in PLAE, it was `step/input` which is now `lib/input-faketrack` 

client **sender**: FakeTrack calls `{ Initialize } from input-faketrack` which 

**server**: `step-ptrack` has out_DPORT 3030, ptrack socker server, IN_DPORT 2525 is where FakeTrack data is inserted. Data on 2525 is handled by `m_ForwardTrackerData`, which forwards the packet to PTrack sockets. 

client **receiver**: This would be a connection to port 3030, which is handled by `step/lib/class-ptrack` . It looks like `plae-input` is the ported  code 

```
PLAE: game-run.jsx loads mod-tracker which loads step/input, which implements:

// initialize once
INPUT.InitializeTrackerPiecePool({
  count  	 	: COUNT,
  initFunc 	: m_SetTrackerPieceVisual
});

// process the pool
INPUT.UpdateTrackerPieces ( ms, {
  addedFunc      : f_SetVisual,
  lostFunc       : f_ResetVisual
});

// get the valid tracker pieces
m_pieces = INPUT.GetValidTrackerPieces();

// extra stuff
INPUT.ChangeLocation();
INPUT.UI_EnableProcessing();

```

To enable the receiver on Tracker:

* [x] `lib/input-faketrack` is used by `FakeTrack.jsx`
* [x] rename `lib/input-faketrack` to `lib/mod-faketrack-ui`
* [ ] convert `plae-input` into something useful by gemsrv
  * [ ] 
* [ ] in `lib/input-faketrack` 



```
// STEP/INPUT

function m_Initialize ( token, serverAddress ) {
		console.assert(serverAddress,"Must pass ServerAddress?");
	//	Initialize PTRACK
		PTRACK.Initialize(token);
		PTRACK.SetServerDomain(serverAddress);
		PTRACK.Connect();
		m_RegisterInputModule(PTRACK);
	}

// MOD-TRACKER
API.SetHandler('GetInput', function( ms ) {
  function f_SetVisual (p) {
    p.Visual().Show();
    p.Visual().HideLine();
    if (debug) m_SetColorByTrackSource(p);
  }
  function f_ResetVisual (p) {
    p.Visual().HideLine();
    p.Visual().Hide();
  }
  INPUT.UpdateTrackerPieces ( ms, {
    addedFunc      : f_SetVisual,
    lostFunc       : f_ResetVisual
  });
  // update m_pieces array
  m_pieces = INPUT.GetValidTrackerPieces();
});

```

**What should it look like?**

1. Create a WebSocket to 2525 PTRACK SERVER, which also passes FAKETRACK. This should be renamed to just INPUT, because we'll ride all our inputs on this socket. PLAE version is in `mod-tracker`which uses the INPUT module in `step/input`
2. Connect websocket message to `_ProcessFrame()`, which will generate the list of entities. This is located in `step/ptrack`. The PTRACK module is responsible just for keeping up-to-date with the flowing inputs, creating a bunch of entities
3. The `GetInput` lifecycle grabs the list of whatever from the INPUT module. entities. Probably **InputObjects**, the companion to DisplayObjects.

THIS IS HOW PLAE BREAKS DOWN

```
CLIENT SEND
mod-faketrack  	generate faketrack data for injection via 2525

SERVER INPUT HANDLER

step.js 
  step-tracker .... UDP listener, FakeTrack listener, Pozyx listener
										Track Forwarder to subscribers at port 3030

CLIENT RECEIVE
mod-tracker .......	GetInput lifecycle, manages the piece list from INPUT
	step/input ...... TrackerPiecePool for m_inputs (raw entities)
	PIECES	          UpdateTrackerPieces( ms, addf, lossf )
										MapEntities( inputs, ms, addf, lossf )
		step/ptrack	... Connect() to hook messages to ProcessFrame()
		ENTITIES		  	initialize connection to 3030 via PTRACK
										maintain EntityDict m_entities
										ProcessFrame updates entities

```

GEMSTEP REMAPPED PLAE FILES

```
PLAE									GEMSTEP

- sender -
1401-game/faketrack		pages/FakeTrack.jsx
mod-faketrack					app/pages/elements/mod-faketrack-ui

- server -
server/step						urdu, which calls...
step-tracker					server/step-tracker (Start, Stop forwarding)

- subscriber -
1401-games/tracker		pages/Tracker.jsx
mod-tracker						./elements/mod-tracker
assets/modules/step		src/modules/stepdead
input
```

## DEC 11 FRI - Fixing the Tracker Data

Next up...let's lay-in api-input

* [x] clean up tracker logic, instantiation
* [x] clean up broken websocket server
* [x] fix broken dataframes
  * [x] fix position calculation obsolete math
  * [x] confirm input received
* [x] use `PTRACK.InitializeConnection()` in api-input
* [x] use `PTRACK.InitializeTrackerPiecePool() ` in api-input
* [x] use `PTRACK.UpdateTrackerPieces()` in api-input
  * [ ] missing TrackerObject, TrackerPiece
  * [ ] piece access missing `PTRACK.MapEntities()` 

### Fixing MapEntities

PLAE used a different architecture for "Pieces", which held a "TrackerObject" that represented a point. The trackerobject was maintained by input-ptrack, and the instance was added to the piece that was tracking it. 

GEMSTEP uses a different pierce architecture, using "Agents" that are similar to Pieces. We probably need to have a new 

## DEC 12 SAT - Fixing Map Entities

Gotta make **TrackerObject** and **TrackerPiece** replacements? **No...start from scratch and simplify**.

The `in-ptrack` modules is built around `class-ptrack-endpoint` and some filtering.

* cache raw entities - `class-ptrack-endpoint`
* denoise raw entities - `in-ptrack`
* transform raw entities into coordinates - `in-ptrack`
* maintain 'active inputs' list - `in-ptrack`

### Fixing PTrackEndpoint

```
INITIALIZE
x api-input call TRKBUF.InitializeConnection()
x Connect() calls RAWTRK to connect

CACHE RAW ENTITIES
to test in api-input 'CHEESE TESTING' 2 second timer
X	call PTRACK.GetRawEntities()
x	add PTrackEndpoint.GetRawEntities()
x	ptrack-endpoint: set entityDict properly

PARSE RAW DATA FRAMES
x cleanup class-ptrack-endpoint
x confirm entities received
x confirm entities can be requested by IN-PTRACK
```

Now that we have **raw entities** available, we need to filter them and then stuff them into persistent **input objects**. These are similar to *display objects* in that they are the bare minimum representation of an input. 

### Fixing PTRACK module

Taking the raw entity and converting it to an object would be nice. We need a formal definition of EntityObject, which is now in t-ptrack. It has a clone() method that takes an object.

Now PTrack has to first find the active entities by diffing the current entities with its own entity map!

```
x rewrite in-ptrack to use SyncMap
x change id types in IPoolable to id:any, since FakeTrack uses non-numeric ids
x confirm tracker still works with id change
TEST: add and update work, but not remove
```

The old code to filter was in `MapEntities()`, so let's examine that to see what to remove.

```
FOR EACH ACTIVE ENTITY

	// anyone who is too inactive
  if e.nop > MAX_NOP
  	delete it
  
  // anyone of age that is too inactive
  if e.age > MIN_AGE
  	if e.nop > MAX_NOP
  		delete it
			return
  		
  // appeared for few frames then disappeared
  if e.age - e.nop < MIN_NOP
  	delete it 
		return
 	
  OVERRIDE = true
  
  if (e.age < MAX_NOP || OVERRIDE)
  	if (!oldestInRadius(e, idsactive, entityDict))
  		delete it
  		return
  
  idsactive saved
  e.nop += interval
  e.age += interval
 
	calculate pieces lost, pieces new 
	
	--- for shouldRemove, run all the age tests

```

Hm, the aging algorithm requires a different handling. We might have to build this into the pool class itself. 

Detecting when to remove the object from the pool is proving tricky. There's a bug in the logic where the check of the pool will have the current one.

```
sobjs.forEach(sobj => {
  if (this.pool.has(sobj.id)) updated.push(sobj);
  else added.push(sobj);
  this.seen_sobjs.set(sobj.id, sobj);
});

// pool has memory of the last time. This will detect them being updated
// if it's not in there, it's new to us entirely

// now check whether the allocated pool pieces are in the 
// current set of sobjs (the incoming array) which has been mapped
// into seen_sobjs above

const pobjs = this.pool.getAllocated();
pobjs.forEach(pobj => {
  const sobjGone = !this.seen_sobjs.has(pobj.id);
  out += `${pobj.id} ${sobjGone ? 'gone' : 'here'}  `;
  const yesRemove = this.ifRemove(pobj, this.seen_sobjs);
  if (sobjGone && yesRemove) removed.push(pobj);
});
```

Actually it might be in the ptrack endpoint. It is returning a cached map that is not a pure entity map. The big problem was **class-ptrack-endpoint** wasn't clearing the cache automtically. The old aging code actually deleted the code out of the dictionary directly, which is why it was always up-to-date. The NEW code uses SyncMap, and has to explicitly clear the entire map.

## DEC 13 SUN - Adding Visualization to Entities

Now that we're getting actual numbers into in-ptrack, how to show them?

* entities are their own thing, a kind of input
* inputs are a kind of data, represented by entityobjects.
* We can directly syncmap entityobjects to visualobjects if we want.
* We can also syncmap entityobjects (which are inputs) to anything else.

So we should have an **input object** that represents not only ptrack entities, but other inputs. Let's rename EntityObject to InputObject

Now that we can get entity data, let's plot it onto the screen somehow.

* [ ] `api-input` has our cheese test

* [ ] we have the entities, so we just need to map them to VOBJs

  * [x] move RP structures into DATACORE
* [ ] replace ClearCachedEntities with improved PTRACK entity management to avoid flickering

## DEC 14 MON - Squashing EntityCache Bug

Got inputs working, but the entity caching issue that I fixed with a new `ClearEntityCache()` method has the effect of also ruining the input cache relative to being read. It would be ideal if we didn't need to call this explicitly, which means adjusting the algorithm in the ptrack endpoint manager to delete entities on-da-fly.

* [x] check: `class-ptrack-endpoint::ProcessFrame(frameData)` is responsible for processing the frame only, not handling the entity deletion
* [x] check: `in-ptrack` ... it uses `class-mapped-pool`
* [x] check: `class-mapped-pool` has the deletion code that I need to update somehow

The critical piece of code lives in `syncFromArray(PoolableArray)` and `syncFromMap(PoolableMap)`

```js
const removed = [];
const pobjs = this.pool.getAllocated();
// get all the objects that are already allocated
pobjs.forEach(pobj => {
  const sobjGone = !this.seen_sobjs.has(pobj.id);
  const yesRemove = this.ifRemove(pobj, this.seen_sobjs);
  if (sobjGone && yesRemove) removed.push(pobj);
});
```

Should this code also REMOVE the pobj? Probably, because this is a MAPPED-POOL. 

```js
if (sobjGone && yesRemove) {
  console.log(`deallocating ${pobj.id}`);
  this.pool.deallocate(pobj);
  removed.push(pobj); // returned for post-processing
}
```

Trying the above, the entities are removed by are readded. That is weird because the entities should be stable.

Ooops, the removal of clearing the cached entities is in `in-ptrack::GetInputs()`, so let's remove that and hope that the clearing algorithm works. And it turns out that it has to happen in `in-ptrack::GetInputs()` which means that it's the PTM that needs to handle deletions cleanly, not the map structure. 

That means that **ProcessFrame** needs to clean-up its entitydict to remove cached things. But this has to make use of the aging algorithm that's passed on to the SyncMap. Does this mean the add/remove logic has to be here, not in `in-ptrack`???

* SyncMap.updateFromArray receives entity list from PTrack
  * It checks for things that have disappeared and updates
  * It shouldn't have to worry about aging; it expects to get SOLID entities
  * I need to double-buffer the entities

So I need to add an addition SyncMap to the PTrack instance manager. This is where the aging algorithms go.

* [x] clone the VALID_ENTITIES `SyncMap` into `class-ptrack-endpoint`
* [x] also move the filter-related stuff into endpoint
* [x] update the endpoint syncmap to process raw entities alongside entityDict
* [x] does it work? **YES**

Now need to check the PTRACK algorithm for aging...it's a little finicky and requires **expansion** to the syncmap class via mapped pool

Why is syncFromArray called 3 times?

* once from ProcessFrame ptrack-endpoint 140: **good** raw to entities
* once from GetInputs in-ptrack 67: VALID_ENTITIES.syncFromArray **removed** (redundant)
* once from StartTrackerVisuals in api-input 37: RP = GetTrackerRP() **good** entities to visuals

Now it's being called for two separate RPs, not three. 

Also the add/remove logic is working again.

## DEC 15 TUE - Implementing Costume Feature

This is our first real "finished" feature. There are not that many things to add to it.

## DEC 16 WED - Features Refactor

I am going to change the way that `prop('propname')` works so it's just `prop.propname` or `prop['propname']`, because the indirection is annoying.

* [x] `class-sm-object` is the base class for props and methods

* [x] `class-agent` is the base class for features

  * [x] two ways to access: `.prop` or `getProp()`

  

### Costume Feature Continued

With the features, props, and methods refactored and made consistent, we can resume work on **Costumes**. There are two commands:

* Costume.set 'name of costume'
* Costume.pose 'poseName' or number (frame)
* Costume.play 'poseName' if it's an animation

So how does this actually work?

* script is `featureCall Costume methodName value`
* this effectively calls `Costume.featExec(agent, methodName, ...agent.evaluateArgs)`
* The actual code is implemented in `feat-costume` as `methodName(...args)`

So let's give this a try!

* [x] create stub for `set`, `pose`, and `play`
* [x] move featExec and featProp utilities to class-agent from class-feature
* [x] fix featureCall, featureProp
* [x] confirm accessors are working, simplify call chain

Tomorrow we'll actually implement the costume feature so we can change costumes on-the-fly. This is probably already done to some extent because all features are doing are setting properties and values that will be read by the Renderer System. Since the renderer only cares about x, y, and skin, the Costume feature just needs to make sure the skin is updated accordingly. 

* `vobj.setTexture(dobj.skin, dobj.frame);` in `api-render` is the critical routine.
* we want to define the `skin` property so an appropriate `frame` is available.
* also, we want to ship an `assetId`, not a string, in the display object renderer
* for features that need cycle time, we can hook into the `update`, `think`, or `exec` update cycles in agent to get a little execution time. This can be done through a keyword we call `featHookUpdate(featureName, methodName)` 
* We can also hook into SIM to update our own counters in the feature. 

## DEC 18 FRI - Costume Resumed

Reviewing TexturePacker formats and PIXI-JS conventions:

``` js
// load a spritesheet
PIXI.loader
    .add("images/spritesheet.json")
    .load(setup);

// load a single sprite from the sheet and add to stage
background = new PIXI.Sprite(sheet.textures["background.png"]);
app.stage.addChild(background);

// load an animation
animatedCapguy = new PIXI.AnimatedSprite(sheet.animations["capguy"]);

// set speed, start playback and add it to the stage
animatedCapguy.animationSpeed = 0.167; 
animatedCapguy.play();
app.stage.addChild(animatedCapguy);

// get texture for frame name from spritesheet
if (rsrc.spritesheet) {
  frameTexture = rsrc.textures['name'];
  // get texture by frame number from spritesheet
  frameTexture = rsrc.spritesheet._frameKeys[0];
}

// get texture from regular texture (non-spritesheet)
if (rsrc.texture) return rsrc.texture

```

#### AssetManager Review of Operations

Our asset manager uses a manifest file (`static/assets.json`)  that loads all the sprites. Then, we can access them via `getAssetById(id)` and `getAssetByName(name)` . The asset manager extracts the name from the `sprites` collection with `assetId, assetName, and assetURL`

The key data structure is `_textures` which holds a `PIXI.LoaderResource` indexed by assetId as defined in our manifest file. The assetId is used to refer to the same asset across distributed GEMSTEP apps.

Modifying the example above to use our asset manager:

```js
AssetManager.loadManifest('static/assets.json');
const sprite = new Visual(id); // id should be the display object id to mirror
sprite.setTexture(name,frameKey); // framekey can be a number or string




```





