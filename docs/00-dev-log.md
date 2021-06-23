PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

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

## 





```

