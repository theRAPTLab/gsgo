88PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY  S2107 APR 05 - APR 18**

* W1: CharControl, DeviceSub, Directory, Data Structure documentation
* W2: Device Define/Publish, Subscribe/Read Complete DR01!

**SUMMARY S2108 APR 19 - MAY 02**

* W1: GetInput API, DiffCache Buffer Mode
* W2: Notification, start break.

**SUMMARY S2109 MAY 03 - MAY 16**

* W1: Break cont'd. CodeReview of May Pilot. Meeting with Researchers
* W2: Meeting followup. Discussions on Feature and Phases.

**SUMMARY S2110 MAY 17 - MAY 30**

* W1: ifExpr bug
* W2:Fix underlying "block chaining" bug in script-parser

**SUMMARY S2111 MAY 31 - JUN 13**

* W1: Ponder GraphQL with overall server needs.

---

# SPRINT 2111 / MAY 31 - JUN 13

## August Pilot Priorities

* Tinting Feature
* Spawning Feature
* Script Wizard UI
* Line Graph Widget
* Differentiated render view
* PTrack cursor
* Creation/Spawning
* Sim on Server
* Multihost URNET
* How to measure socket backpressure

### Specific Systems

* Design the Locale System
* Vector Math
* State System
* Time Sequencing Systems and Expression in the Script Engine
* Mini Rounds
* Zero-config URNET/AppServer

### Research / Design

Review this list on Monday with Ben to make sure this is on the right track...this thinking.

* review lightweight component library thi.ng/umbrella
* how to manage mini rounds?
* how to manage timers? the `every` keyword, in particular, how to delay before start, doing things periodically

## MAY 31 - Sprint 2111 Ramp up

* **add a SRI label for project stuff** initially to show what I'm looking at/interested in.
* make sure issues I'm working on are part of the upcoming milestone (use filtering on the board to set this)
* bill exploring "what is new in the code" to the appropriate Sri Task issue; there's a catch-all Refactor/Dehackifying/Cleanup issue
* make my own dev continuity and store it somewhere,
* try to figure out a way of capturig information that is immune to underling code changes/renaming (intent?)
* instead of using issues as something to be compelted, but saying where to direct my attention and let curiousity touch whatever needs touching. 
* Ping Ben when I start looking at code he's written. I might start with an intent.

## JUN 02 - Ben's Recent Additions

Merge #100 (Foraging) - what can agents see

* Vision Feature
* Movement Feature Updates
* Costume Feature Updates

Curious how the vision stuff is implemented.

**Most immediate need** is the locale system. Current stuff is in `dc-input`, also in `step-tracker` , model data structures are stand-alone, there is some stage bounds. Normalization system. Also having some kind of dictionary to have text for specific things.

Overall application database stuff (where to store strings). 

Asset manager, access models. 

* make a simple locale system. **remember to form a question**

**Q. How is locale data made accessible to ALL modules in the appserver AND in other servers and clients?**

A. It has to be centralized somehow. It could be a module or package itself with that information in it, or a server in its own right. It might make sense that the **appserver** is responsivle for providing centralized access to locale data.

```
ptrack, pozyx are devices
the device declaration looks like
    this.udid = DATACORE.GetNewDeviceUDID(); // in DATACORE
    this.meta
    	.uapp
    	.uaddr
    	.uclass
    	.uapp_label
    	.uapp_tags
    	.uname
    this.user
    	.uident
    	.uauth
    this.student
    	.sid
    	.sname
    	.sauth

```

**Q. Will GraphQL be helpful? What the hell is it?**
A. See [notes](02-concepts/graphql.md)



## JUN 03 - GraphQL Integration

Reviewing our server architecture:

* URSYS implements ur-server, which loads...
  * NETWORK server-urnet
  * NETINFO server-netinfo

* GEMSRV loads UR-SERVER during GEMSRV_Start() in the following sequence
  1. GEMAPP.StartAppServer(opt)
     only option is 'skipWebCompile' for old MEME standalone
     compiles app to serve with webpack
     loads up the middleware for compression, webpackdevserver
     add cookies middleware
     enables cors
     handles path /, /app, /app/* to point to index.html which is the web app entry
     setup NetInfo_Endpoint webserver responder
     serve static files using Express.static

  2. UR.Initialize([Tracker.StartTrackerSystem])
     the inits array just invokes a list of functions, from old PLAE can be removed
  3. `UR.URNET_Start({ port, name, path })` to start netbroker
     NETWORK.StartNetwork(options)
       options shared with startup
     NETINFO.SaveNetInfo(m_netinfo) - save network options host port urnet_version uaddr

       review 

## JUN 08 TUE - REVIEW and FOCUS

BEN: Currently, "main" has the setup. One server, one project would be easier. We do have some facility for opening different projects. You can open a script for another project and actually submit it to the main server.

"Main.jsx" is the page that decides which simulation to load. It holds the project data odule that in turn starts the simulation. 

Models are **Projects** - "activity kit" is self-contained, declares its input and output needs, and is capable of adapting its lifecycle phases to work with what it has even if that's "can't run"

* Project definition: we can look at the project files, we can derive the keys, look in **acquatic.js.**

  * scripts, instancedefs, metainfo, screenBounds, wrapping, color
  * each script defines characters and agents
  * each character has parameters about how inputs are handled

* Projects live in the context of a "Project workflow", which is the set of all "moves" that can happen.

* Projects can have multiple models and activity bundles

* how to user-select, program access

To have a Moth Activity that is the umbrella project that directs you to day 1 or day 2. It's like a box of stuff. Something as easy as giving commands to kids in realtime. 

 **ACTIVITY TO MAKE A PASS ON** - 

* State Management for Locales, 
* Mini-Rounds. 

I think I can modify a copy PhaseMachine source into a state machine that handles Mini-Rounds. Incorporate. Ben adds "in our pre-run" loop physics and update. 

### State Management for Locales

This is a collection of properties, really. Just need to know where they are, and how to access them. 

**Q. What is Locale Data?**
A. Right now, just a bunch of **system** properties that are specified by a particular installation context. Right now that is TRANSFORM and SERVER information that has to be hardcoded

**Q. How to specify a locale?**
A. I'm thinking a **pre-defined locale string** , which can include some generic setup types. On system startup, the local string is somehow specified (maybe by MAIN) and then this configures the system.

**Q. How to set a Locale property?**
A. This is ideally a **database** that's stored on a server on the Internet. For now, we cn make it a service call to the AppServer called `GET_LOCALE` and `SET_LOCALE` which will read/write the entire prop. That means we also need to have some kind of **authentication** in eventually.

**Q. Who uses Locale data?**
A. The primary user right now is the tracker system. We'll hardcode these keys into the LocaleManager.

**Q. What is the Locale Manager and where does it live?**
A. It's a database service on the backend, but the web clients will access it as a manager. In that sense it's a datacore module, but at the URSYS level. I think we'll implement it as `svc-system-props` or something like that, essentially a key-value store in a graphql module.

**Q. What about User Data?**
A. I think this will live in `svc-session`, as data related to a particular authenticated entity is retrieving data that it's allowe to retrieve based on keys. It may access the central graphql module.

```
PTRACK TRANSLATION MATRIX
width, depth, offx, offy
xscale, yscale,
xrot, yrot, zrot

POZYX TRANSLATION MATRIX
...
ROOT_SERVER: host or ip address
RESEARCH CONTACT: { }
ADMIN CONTACT: { }
```

**Q. What does the API look like?**

```js
do we set the locale system wide, or leave that up to the calling app? I say we set it globally within UR. It becomes system state.

TRACKER CONTROL sets the locale information, or can edit it.
The locale information is stored in SystemDB, our persistent data store.
SystemState can use SystemDB to initialize its initial stuff.

On AppServer launch, it pulls the locale data and serves it up, based on the 

```

## JUN 09 WED - Making the Locale Thingy

We want the locale thingy to work for current versions ahead of the database backer. So we need to be able to **write** the config from Tracker Utility. And we need to have an optional authentication as a stub.

* [x] gem-app-srv uses UR, so let's expose something in index-server that refers to a new module.
* [x] wedge-in example code into new `server-db` module that implements the graphql interface
* [x] update lokijs version to 1.5.12
* [x] add graphql, express-graphql libraries
* [x] remove annoying eslint error requiring short object notation for functions
* [x] fix unrelated type error in class-visual

 ## JUN 10 THU - Solidifying the GraphQL DB Connection

I'm working in `ursys/server-db` today. Cleaned up the code to use GraphQL Type Languge instead of programmatically making it like in that example code.

* [x] add loki routines to `server-db` in URSYS
* [x] ensure dir to loki file in directory of app in GEMSRV
* [x] initialize Loki with path to loki file, set autosave in `server-db`
* [x] load JSON into LOKI to initialize database...but **where is the data loaded from?**
  in this case, it's server-side just for testing LOKI, because the client will be using GraphQL directly, not Loki commands
* [x] moved the db init into a new call `GetGraphQL_Middleware` in `server-db`, which is exported by `index-server` which is them loaded by the child package `gs_packages/gem_srv` in its `gem-app-srv` AppServer that's invoked by the startup script `gem_run.js`; this makes the UR-level service usable across different child packages with different configurations for the dbinit and graphql endpoint declarations.
* [x] write schema into server-db, root for locale, locales

SEEMS TO WORK :O



## JUN16 WED - Discussing Mini Rounds

Researchers want to be able to do mini rounds. Notes are in [issue 195](https://gitlab.com/stepsys/gem-step/gsgo/-/issues/195)

**Q. What Simulation = What's stored in Ben's Datastructure for "Model" (e.g. acquatic)**
A. It's a single set of blueprints as well as locale information in "bounds"

* Rounds object is part of model
  * maybe an array of "round" objects with properties that a round interpreter knows to handle
  * the round interpreter has built-ins like "counter", "round event watcher" 
* List of Blueprints:
  * each script is an object `{id, label, isCharControllable, isPozyxControllable, scriptText }`
  * `label`  is the  `blueprint` `# BLUEPRINT Predator`
  * `id` and `label` might be the same thing???
  * the `isCharControllable` is used by 
* Instance Lists
  * array of init scripts for each defined instance of blueprint
  * the literal source code
* bounds: "sets up the simulation space"
* label: "defacto name of the project" - there will have to be a project for each day's activities

**Q. Where are the tracker bounds?**
A. According to Ben, POZYX_TRANSFORM is in `dc-inputs`, because this is where the pozyx data is being transformed. It's used directly by `PanelTrackerUI`

### Locale Manager

The locale manager will be an URSYS module that makes use of a new **URSYS DB**, which contains all the global variables shared across the application. For now, each AppServer will create an URSYS DB, though in the future we'll want to split them out into different servers.

```
GetLocale(id)
GetLocaleList() => Locale   // plain object with certain props
SetLocale(id,LocaleObj)
Locale.getTransform()
Locale.getTransformAxisToScreen()
```

### URSYS DB

* URSYS DB will be using GraphQL. 
* URSYS DB is accessed through a client query system that accepts query objects and returns a Promise. Under the hood this is a `fetch` operation returning a promise, and we'll hide away the various header things.

The URSYS DB is still using LokiJS, so how are different **system properties** organized?

* Each data type is stored in its own **loki collection**. Collections are similar to tables in SQL, but the "documents" stored in them can be anything. 

**Q. How do individual apps persist their data?**
A. Probably some kind of loader, though "app" probably has to be some kind of "app category", not a specific app instance. There are also some apps like **main** that can only run one at a time.

## JUN 19 SAT - Finalize the stupid Locale DB

When the URDB is initialized, it needs to have some runtime files that are "owned" by someone. They can't be owned by URSYS. In this case, gem_srv will own them.

However, to be able to read/write the database, it needs access to it to write access for the **root** resolver to the **loki** instance

## JUN 20 SUN - Read/Write values to URDB from DevController

DevController shows the output transformations. `dev-controller-ui` handles the backend of `DevController.jsx` 

* [x] dev-controller read URDB endpoint and initiate fetch (test)
* [x] client-urdb added: will handle graphql fetches for us (stub)
* [x] client-datacore now handles extended netinfo with `urdb` field

## JUN 21 MON - GL Matrix and Transform Review

* [x] how does DevController work?
* [x] where are matrixes injected? 
* [x] what matric library to use?
* [x] what is the right order of operation?

#### Synopsis: DevController

* The module `dev-controller-ui` has the logic and is referred to as **`MOD`**; 
* `DevController` just has the React definitions and event-related handlers. 
* When `DevController` mounts, it sends itself to `MOD.Initialize()`
* There are **three** ways that MOD connects to the ReactUI:
  * React `DevController` is responsible for calling `MOD.HandleStateChange(name,value)` whenever there is a state change detecting in `handleInputChange(event)` in the UI
  * `MOD` can read `state` directly via the instance
  * `MOD` can call `setState()` also to trigger the async update

#### Synopsis: Matrices

Our original transforms in PLAE were applied only to the entities coming from PTRACK. Now, we also apply transforms to POZYX as well.


The goal of the input transform is to convert the device coordinates into normalized coordinates ranging from -1 to 1. It is then up to the client to map these numbers to the simulation coordinate system, which right now is based on pixels. 

> see `docs/02-concepts/gl-matrix` for more dscussion.

## JUN 23 - Merging Transforms with URDB

**Q. What happens with PTRACK data?**
A. The module `step/in-ptrack` manages the raw stream, and exports a `GetInputs(ms)` function that uses a SyncMap to `GetEntities()` from.

**Q. Is `class-ptrack-endpoint` registered as a `UDevice` **
A. No but it might have to be.

**Q. Where is the transform applied in PTRACK?**
A. `input/api-input` has the method `StartTrackerVisuals()` , which is called from `UR/APP_CONFIGURE`

The current app is reading the entities from PTRACK's endpoint, but just using them to sync the renderpass. There is no input processing going on at all.

```
RAW NOTES

DC-INPUTS
  SetInputStageBounds
  SetInputBPNames
  SetPozyxBPNames
  
DC-PROJECT
	GetBoundary
	SendBoundary - 'NET:SET_BOUNDARY' (width, height, bgcolor)
	
PROJECT-DATA
	GetInputPNames
	GetPoyzxBPNames
	
HOW BEN'S CODE WORKS

In ProjectData, the bounds object can hold:
* top, right, bottom, left
* wrap
* bounce
* bgcolor

Bounds is a Playfield Definition.
Boundary is the dimensional (width, height) and color (bgcolor) definition.

## WHO USES GET BOUNDARY???

USES - mod-sim-control uses it to set a RENDERER boundary
STUB - PanelSimulation.jsx uses the boundary information

According to Ben: 
```

## JUN 24-25 (THU-FRI): Diagram Data Structures for Renderer

See diagram [Coordinate System Reference](https://whimsical.com/coordinate-system-reference-LqUQT5oVLdN2BJjR7izZJw) for a diagram. 

**So what questions can I ask to get myself moving today?**
A. outlined the contents of the LOCAL object, so I think I can actually write the code for this. A starting point would be to load the locale with a bunch of files. Let's look into **reading files from a directory** and automatically processing them into a manifest.

* [x] **do libraries already exist?** yes, but there are short routines to do this.
* [x] **where should this go?** In URSYS there is a `util` directory, we will add a `fs-helpers.js` module to read files

**Q. Given Coordinate System Reference, where should I put all these new objects?**

A. The essential data stucture object is LOCAL, and we have a GRAPQL for it. We need to make the query design to match our diagram.

```
type Query {
	locale(name:String): Locale
	locales: [String!]
 }
 
 type Locale {
   id: Int!
   stage: StageProps
   gemstep: StepProps
   ptrack: PTrackProps
   pozyx: PozyxProps
   ursys: URSYSProps
 }

type Vec2 {
	x: Float!
	y: Float!
}

type Bound {
  range: [Float]
  shape: [Vec2]
  rect: [
}

 type StageProps {
   mainDisplay: MainDisplayProps
   playfield: Bound
 }
 
type PTrackProps {
	memo: String
	xRange: [Float]
	yRange: [Float]
	xOff: Float
	yOff: Float
	xScale: Float
	xRot: Float
	yRot: Float
	zRot: Float
}

type PozyxProps {
	memo: String
}

type StepProps {
	memo: String
}

type URSYSProps {
	memo: String
} 
```

## JUN 26-27 WEEKEND

Things To Do

* [ ] Q. How to server-side database should read all gql files, then concatenate them into one long string, then run that through buildSchema
  A: _See [graphql-tools loadFiles and mergeSchema](https://www.graphql-tools.com/docs/schema-merging)_

  

THe `m_LoadSchema()` function in `server-urdb` is where we can insert loadFiles. The [code example](https://www.graphql-tools.com/docs/server-setup) shows how to use it with express-graphql

## JUN 28 MON - Gathering Thoughts

* [x] add graphql-tools: schema, merge, load-files
* [ ] decide how to organize schema files

in GEM-APP, there is a config directory where we can put our graphql-related schema things. Here's how it looks now:

```js
  UseURDB(app, {
    dbPath: 'runtime/db.loki',
    importPath: 'config/gql/db-default-data.json',
    schemaPath: 'config/gql/db-schema.gql',
    root: db_resolver
  });  
```

With `graphql-tools`, we have `schema` to create an "executable schema". 

``` js
import { makeExecutableSchema } from '@graphql-tools/schema';

const typeDefs = `
type Query {}
type Mutation {}
type Post {}
`;

const resolvers = {
  Query: {},
  Mutation: {},
  Post: {}
};

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
```

We can use this to create modules that handle specific bits of the schema. The `loadFilesSync` method will merge scehm

``` js
const path = require('path');
const { loadFilesSync } = require('@graphql-tools/load-files');
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');

const loadedDefs = loadFilesSync(
  path.join(__dirname, './types'), 
  { 
    recursive:true, 
    ignoreIndex:true
  });
});
const loadedResolvers = loadFilesSync(
  path.join(__dirname, './resolvers'),
  {
  	recursive:true,
    ignoreIndex:true
  });
)};
const typeDefs = mergeTypeDefs(loadedDefs);
const resolvers = mergeResolvers(loadedResolvers);
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});
module.exports = schema;
```

I think we will have separate files for schema and resolver. 

Naming conventions:

* `[label]-resolver.js`
* `[label]-schema.graphql`

### Ok let's try to make this multi-load work

* [x] add dynamic collection loading from init/db.json
* [x] add `gqlPath` to `gem-app-srv.UseURDB()` setup
* [ ] rewrite `UseURDB()` to use graphql-tools to load globs

**FAIL**

Stuck loading resolvers. It appears that there is a critical error when loading `@graphql-tools/load-files`... webpack is trying to find the module and it is failing. But why is webpack trying to do this at all??? It's because URSYS is using webpack to compile its stuff...**it can't find the files** at runtime within the library itself. So this might have to get moved to `gem-srv`

`Critical dependency: require function is used in a way in which dependencies cannot be statically extracted` is the error that webpack is throwing, because we're trying to do a dynamic load through `graphql-tools/load-files` `loadFilesSync()`, and webpack has rewritten `require` to look for modules that are defined in URSYS, not in GEMAPP that's calling it.

After farting around with it for a while, dropped the feature until NEXT TIME. It would be difficult to refactor this now and risk breaking things.

### Jumping Forward: Adding the New Schema for Complete Locale Info

I have that code above (which needed modifcation):

* [x] add new `config/graphql/schema.graphql`
* [x] add new `config/graphql/resolvers.js`
* [x] update `config/init/db-test.json` to initialize database

## JUN 29 TUE - Tracker UI

* [x] is PTrack subsystem working? YES, right up to `m_ForwardTrackerData()` in `step-tracker.js`
* [x] so we just need to plot the coordinates on the screen itself within my Tracker utility

Aside: The challenge of nested components is:

* subcomponent can handle its own state changes
* subcomponent can send changes to a central dispatching logic thing
* changes to central dispatching logic are also reflected in the subcomponent

This suggest that there is a single source of truth for state, which is what Redux is useful for once it's connected to React via React-Redux. But it is a somewhat awkward mechanism because of the amount of indirection.

In the FakeTrack code, the **single source of truth** is `elements/dev-faketrack-ui`, which

*  exports `Initialize( rootComponent )`, assuming that the rootComponent is never unmounted. 
* exports `HandleStateChange(name, value)` so this module can maintain its state. It expected to receive UI element state, NOT application logic. This module just holds UI state

It also adds **non-react events** to the base canvas in `container`, and 

* [ ] want the UI from CharController moved to Tracker
* [ ] add the dropdowns for locale and system (ptrack or pozyx)
* [ ] write change handlers

DETOUR...have to deal with POZYX code and new CONTROLLER code which seems to have gotten mixed-up in `api-input`. POZYX code is not following the conventions for PTRACK as a module template.

```
NOTES on dc-inputs

POZYX_TRANSFORM is in dc-inputs
POZYX_TO_COBJ creates InputDef COBJs from entity
GetTrackerMap() returns POZYX_TO_COBJ

NOTES on api-input
* in StartTrackerVisuals(), the entities are being pulled from PTRACK.GetInputs() and then synced to control objects.

WHY IS THIS IN PTRACK?
* PTRACK has been hacked to also send pozyx data??? I guess this is similar to FakeTrack

NOTES on step-tracker.js
* This has new mtrack_ss which is "mtqq", which is pozyx
* The MTQQ address is handled by library connecting to a particular port in `m_BindPozyListener()`
* The key routine is `ConvertMQTTtoTrackerData()`

```

I've documented the issues with the weirdnesses of pozyx in a [Gitlab issue](https://gitlab.com/stepsys/gem-step/gsgo/-/issues/230)

---

Ok, what do I need to fix in this pile of stuff? Argh. 

**Q. Is FakeTrack data even coming through?**
A. It should come in through in-ptrack, which provides `GetInputs()` to return all the entities. However, `api-input` is actively blocking anything that isn't pozyx by seeing if the blueprint is attached to the input. **I do see it coming**/

**Q. How do I fix this POZYX mess?**
A: Decouple the pozyx stuff from ptrack. 

**Q. Why are blueprint names coupled to control objects? How is `bpname` used?**
A. Control Objects are converted into 'InputDef' as they come in from the tracker. 



## INPUT SYSTEM SYNOPSIS (WIP)

The INPUT system should be independent of SIM and RENDER, as one of the three major function tpes in the GEMSTEP system. Currently, it has hacked-in SIM data. The pattern I'm seeing is that control objects have SIM-related logic injected data at the INPUT stage, rather than INPUT groups being tagged by SIM, which is what is creating the coupling problem.

The injected SIM data is primarily **blueprint name**, which is assigned by an originating Character Controller that presumably is setting the blueprint name itself. The list of valid blueprint names is created by scanning the `model.scripts` entries for a `isPozyxControllable` property flag. 

### REDIRECT to TRACKER

Let's just get the UI to update state, and then I'll talk to Ben about using this thing. 

* [x] hook state change module into dev-tracker-ui module
* [x] read locale from graphql
* [x] add ui-state as single source of truth
* [x] hook ui-state into constructors of state-based form elements
* [x] hook HandleStateChange into form element change handlers

### Reading Transform from Selected Locale

* [x] Given the Selected Locale, we want to 
  * get the locale list
  * read the transform data for that locale
  * write to the UI
* [x] When using dropdown, do the above!

> We need to make some changes for how to handle state and state rewriting. It's a bit convoluted right now but the list is updating now; clean it up tomorrow.

### Writing Transform on Edit

Right now what happens? We loop our own state manager into React.

* when you type into a text field, the event is routed to our state handler to update its state. 
* The state manager then notifies any subscribers of that state change, and another handler in the component translates that to local state (the ui state)
* React components whose `render()` function refers to its internal state then update based on its state

We might have better luck intercepting through:

```js
// Happens before the component update
componentWillUpdate(object nextProps, object nextState)
// Happens after the component update
componentDidUpdate(object prevProps, object prevState)
```

To **write the transform**, we want to check for changes to the transform, and autowrite it back if there are no changes.

* [x] in dev-tracker-ui, `HandleStateChange(section,name,value)` might be the trigger. This is the state write, so now it's called **`WriteState(`**`section, name, value`**`)`**
* [ ] It both does `STATE.SetState()` and `PublishState()` 

We need the concept of a STATE BACKING STORE?

## JUL 3 SAT - Taking a Step Back

I have a rudimentary setup working, but I need to consider the **difference** between "transient state" and "persistent data" once and for all. 

* document [modularity.md](02-concepts/modularity.md) complete

### Resuming State Design

I've moved a lot of stuff in dev-tracker-ui into `client-appstate` in URSYS. 

* [x] update `InitializeState()` to accept either a query or an object, and then return the state
* [x] New UR `client-appstate` implements the state stuff that was in `mod-devtracker-ui` but the logic for updating is still a little convoluted to follow.
* [x] commit current refactoring of DevTracker

There's a convention to follow:

* each component inspects incoming URState changes and converts to its flat object hierarchy. 
