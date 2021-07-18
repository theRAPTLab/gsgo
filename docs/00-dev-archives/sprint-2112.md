[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S2110 MAY 17 - MAY 30**

* W1: ifExpr bug
* W2:Fix underlying "block chaining" bug in script-parser

**SUMMARY S2111 MAY 31 - JUN 13**

* W1: Ponder GraphQL with overall server needs.
* W2: Locale system design

**SUMMARY S2112 JUN 14 - JUN 27**

* W1: Mini Rounds Discussion. URDB+GraphQL+Loki design
* W2: Matrix Math Review. Data structures for Locale.

---

# SPRINT 2112 / JUN 14 - JUN 27

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
