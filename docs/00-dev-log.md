[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S2109 MAY 03 - MAY 16**

* W1: Break cont'd. CodeReview of May Pilot. Meeting with Researchers
* W2: Meeting followup. Discussions on Feature and Phases.

**SUMMARY S2110 MAY 17 - MAY 30**

* W1: ifExpr bug
* W2:Fix underlying "block chaining" bug in script-parser

**SUMMARY S2111 MAY 31 - JUN 13**

* W1: Ponder GraphQL with overall server needs.
* W2: Locale system design

**SUMMARY S2112 JUN 14 - JUN 27**

* W1: Mini Rounds Discussion. URDB+GraphQL+Loki design
* W2: Matrix Math Review. Data structures for Locale.

**SUMMARY S2113 JUN 28 - JUL 11**

*  W1: Pozyx review, GraphQL client, State Change Proto
* W2: Appstate-React, AppCore definition and conventions

**SUMMARY S2114 JUL 12 - JUL 25**

* W1: Refine AppCore conventions, document, debug
* W2: ScriptEngine Confirmation of ScriptUnit paths

**SUMMARY S2115 JUL 26 - AUG 08**

* W1: Asset Manager Design, File Utilities Collection
* W2: Asset Server, Asset Client

**SUMMARY S2116 AUG 09 - AUG 22**

* W1: ?

---

# SPRINT S2115 - AUG 09 - AUG 22

## Project Review with Ben

The [issues list](https://gitlab.com/stepsys/gem-step/gsgo/-/issues) is automatically sorted by last updated. The [STUDENTS_MAY_CHANGE](https://gitlab.com/stepsys/gem-step/gsgo/-/issues/287) issue is showing script changes that need to happen as they are checked off.

My impression is that I have to do a systematic review of every feature to see what's going on.

We're basically **at the end** of the project cycle. We've done the 450 hours for Milestone 2. The remaining 600 hours is improving the experience. Noel **really wants video**, and they would be satisfied with just playing sprites over a video canvas.

On the Systems board, the `@Refactor` list is what we're going to hit.

I'd like to assay the difference between the starting engine and the current snapshots.

There are three things I want to look at:

* Finish the Asset Manager functionality
* Doing the engine review to see (1) what we learned about using it, scripting, features, keywords (2) technical engine review of what's changed since Sri handed it off.
* Engine Review - Writing documentation to help clarify or improve those experiences.
* GUI system review + analysis - what are the practices that Ben came up with to make things more usable?

Maybe I should **mark placeholder code**

Also helpful was when I **stubbed out pseudocode**. 

* Introduction to NetLogo and Scratch. Go to the sites and find something there. Self-guided tutorial might be a thing. 

## AUG 09 MON - Spends, Resuming with the Asset Manager

### Update Milestone 2 spends

* [x] update the timesheet to add issues specifically for it
* [x] add to any issue

### Asset Manager Resumption

This is the current outstanding to-do list from last sprint:

* [ ] request `assets/path-to-archive` and download the files there
  * [ ] zip file, download and uncompress into `runtime/cache` matching path
  * [ ] manifest, download everything into `runtime/cache`
* [ ] for loading corey's sprites, the use of nested folders means we have to work harder to extract a full manifest
* [ ] pixijs json files may have several images
* [x] PromiseLoadAssets() has changed
* [x] expandable asset server can have multiple asset typed served
* [ ] consider writing the generated manifest file to directory so it doesn't have to be generated all the time.

## AUG 11 WED - Asset Manager

* [ ] request `assets/path-to-archive` and download the files there
  * [ ] zip file, download and uncompress into `runtime/cache` matching path
  * [ ] manifest, download everything into runtime/cache
* [ ] for loading corey's sprites, the use of nested folders means we have to work harder to extract a full manifest
* [ ] pixijs json files may have several images
* [ ] consider writing the generated manifest file to directory so it doesn't have to be generated all the time (would require the hash differ)

* Make a `gs_assets_distrib` folder for testing.
* redirect asset server to it to test...works
* package the assetserver middleware

## AUG 16 MON - Asset Manager

* [ ] Fix `UseAssetServer_Middleware`
* [x] fix `PromiseLoadAssets()`
* [ ] fix `asset-srv` to use `LOCAL_ASSETS_DIRPATH`

Actually, since we want to move asset-srv to URSYS there's some additional work to do. 

* [x] simplify middleware by factoring out functions
* [x] new structure
  * [x] `util/files` can be imported by anyone
  * [x] `svc`- are for packet handlers
  * [x] `server-assets.js` for asset serving

## AUG 17 TUE - Asset Manager

We want to **replace** the middleware in `asset-srv` with middleware now in `server-assets` 

* [x] make a copy in `server-asset`

* [x] clean-up settings/configs
  * [x] make gem-srv the local media server
  * [x] make asset-srv the proxy
  * [x] asset-srv is now **mcp-srv**

## AUG 18 WED - Asset Manager Proxying

* [ ] add settings override
* [ ] add media proxying

### Testing Proxying in GEMSRV

* [ ] case 1: `assets/dir`
  * does `dir` exist locally?
  * does `dir` exist on control server?
    * download dir

* [ ] case 2: `assets/dir?manifest`

  * follow case 1

  * run manifest code

    

* [x] case 3: `assets/dir/sprites/file.png`

  * does dir/sprites/file.png exist on control server?
    * download file and cache

Stream of consciousness

the setup is in `gem-app-srv` when the middleware is setup. Specifically it's `MediaProxyMiddleWare` for handling case 1 and 3, and `AssetManifestMiddleware` for handling case 2.

We have some existing code in **ursys/util/http-proxy**

* `ProxyMedia(req,res,next)` - uses its own `ParseRequest(req)` to extract varous parameters. We have duplicate code for this somewhere. 
* deduplicated code

**Q. How to use `ProxyMedia()`?**
A. 

Makes use of internal `mediapath` and `cachepath`. mediapath is the path-to-requested-file. cachepath is where the file is expected to be. For the asset server, cachepath is `gs_assets` which will be fulfilled by http download

always try to send the file with `res.send()` , but if it fails that means we need to download the file and then try again. That's what `u_Download(url,path,cb)` does, where **url** is the remote host/CDN and **path** is where the file should be written. On success `res.send()` is called again.

**Q. How to download a directory?**
A. AssetManifest_Middleware handles requests for manifests, so have it download manifest and use that to download files if it exists.

### August 19 Thu - Debugging

* [x] fetch exist dir --> serve-index!
* [x] fetch exist dir?manifest --> generate manifest!
* [ ] fetch non-exist dir  --> ??
* [ ] fetch non-exist dir proxy to existing host dir --> ??
* [ ] fetch non-exist dir proxy to non-existing host dir --> ??
* [ ] fetch non-exist directory?manifest --> ??
* [x] fetch exist file --> file
* [x] fetch exist file?manifest --> 400 bad request
* [x] fetch non-exist file --> 404 not found
* [ ] fetch non-exist file proxy to existing host file --> ??
* [ ] fetch non-exist file proxy to non-existing host file -->??
* [x] fetch non-exist file?manifest --> 400 bad request
* [ ] **dev-compiler** still works?

## AUG 20 FRI - Continuing

Where I left off:

* `localhost/assets/auto` should **not** trigger `ProxyMedia` because it already is on the server

* `ProxyMedia` is now requesting manifests in preparation of downloading everything to a directory, but it doesn't do that yet. This is the case when a **normal directory that does not exist on local** is read. The idea is that this triggers a directory download through the manifest. Individual files should just work.

* `AssetManifesst_Middleware` needs to handle **case 3** where manifest request for a non-existent directory is made; we want to download it from the remote.

  

### Disable ProxyMedia for local directory

* [x] in ProxyMedia, check if file already exists before continuing with proxy operation

### ProxyMedia: Download Files in Manifest

`http-proxy` needs to know how to download a manifest. This is handled by the code in `ProxyMedia()`

```js
if (DecodePath(path).isDir) {
      let manifest = await fetch(`${url}?manifest`).then(res => res.json());
      if (Array.isArray(manifest)) manifest = manifest.shift();
```

* [x] port `m_LoadManifest()` from `asset-mgr` to `ProxyMedia()`
* [x] test with `localhost/assets/manual` which isn't on local server

Manifest is:

```
{
  sprites: [
    {assetId, assetName, assetUrl}
  ]
}
```

* [x] if manifest file exists, then should copy it

## AUG 22 SUN - Handle Manifest Request

When a manifest is requested in asset manifest middleware.

* [x] is manifest local? yes? then deliver it
* [x] if not, is it on remote? yes? then download directory

*setup*

* Move `u_Download` to `http.js` 
* Move `u_ExtractResourceUrls` to `manifest.js`
* Does autodownload still work? **yes**

  

* 1545 review with ben

how to load project data from GraphQL

## AUG 24 TUE - Subscriptions

Some libraries to look into

* [graphql subscriptions](https://github.com/enisdenjo/graphql-ws#express) with Express GraphQL
* admin interfaces with [AdminJS](https://github.com/SoftwareBrothers/adminjs)

## AUG 25 WED - Documentation Merge

Refactor pass one:

* [x] `ur-constants`
* [x] `util/files`
* [x] `util/files-naming`
* [x] `util/tcp`
* [x] `util/http`
* [x] `util/http-proxy`
* [x] `util/normalize`
* [x] `util/decoders`
* [x] `express-assets` - express middleware 
* [x] `common/ur-constants`
* [x] `common/ur-detect`
* [x] `gsgo-settings`

Refactor pass two: make sure manifest code is a bit cleaner

* [x] `util/manifest`
* [x] `asset-mgr`

## AUG 27 FRI - Review the Script Engine?

I'm not quite sure where to start right now, so I'm starting by reviewing what's in TRANSPILER-V2 and will just do some free writing for now.

Corey at al want to know how the script engine actually works. Let's make a list of everything that I know is in it. We can start with a **review of keywords** that we currently have.

* [ ] execution engine
* [ ] keyword parameter types
* [ ] keyword parameter type automatic inferences
* [ ] context
* [ ] parameter passing
* [ ] blocks
* [ ] expressions

### Looking at `api-sim` to see what's going on

`api-sim` is loaded by **`mod-sim-control`**  which is loaded by **Main.jsx**, so we'll start there.

```
SIMCTRL is elements/mod-sim-control
PROJ    is elements/project-data

MissionControl 
on mount:
	get modelId from URL query
	PROJ ProjectDataInit
  
layout areas:
  console-top:  	tracker view button, back to project
  console-left: 	stageBtn; MissionMapEditor || MissionRun
  console-main: 	PanelSimulation
  console-right:	tracker: FormTransform; PanelTracker
  								!edit !tracker: PanelPlayback; PanelInstances ('run' mode)
  console-bottom: PanelMessage
	
state:
	panelConfiguration - application mode 'run' | 'edit' | 'tracker'
	message
	modelId
	model
	devices
	inspectorInstances - data structure passed into Panit displayelInstances
	runIsMinimized
	scriptsNeedUpdate  - a dirty flag
	openRedirectDialog
	dialogMessage
	
when panelConfiguration is 'edit', it's also used as a switch at runtime to do certain things
```

What's up with the UI event flow?

```
mode changes: tracker view (top row)
left panel controls:
  <stage button toggle> save (exit editor) or setup (ented editor)
  MissionRun | MissionMapEditor (via jsxLeft)

right panel controls:
	run:  PanelPlayback, PanelInstances
	edit: not used for a panel display but to handle live editing

```

What's up with PanelSimulation?

* it displays a child renderer wrapped in <PanelChrome>, which receives a number of props

```
PanelChrome receives
      id,
      title,
      isActive,
      children,
      topbar,
      bottombar,
      onClick,
      classes
```

What's up with right-side controls like *PanelPlayback* and *PanelInstances*?

```
isDisabled
isRunning
needsUpdate
showCostumes
showRun
showNextRun

... these are calculated by inspecting SIMSTATUS.currentLoop which is in modules/sim/api-sim
```



Patterns noticed:

* props are passed to subcomponents so they have the ability to call methods in their parent to set application state, which makes it hard to tell. They all have different names like `toggleMinimized` and `onClick` and `onClose` which mimics built-in event handlers and CONFUSES THE HECK out of everything.
* <PanelSimulation> passes an `onClick` to `OnPanelClick()` but this isn't really a click, it's a prop I bet.
* Main elements have the prefix **Panel** 
* There is only a single app mode, but several different manifestations

## AUG 28 SAT - Reviewing API-Sim 

Concepts for **api-sim**, which is the top-level module for the simulation. 

The control of the simulation occurs in the `UR` PhaseMachine:

* `UR/APP_STAGE` -> Stage()
* `UR/APP_RUN` -> Run()
* `UR/APP_RESET` -> Reset()
* `UR/APP_RESTAGE` -> Restage()

```
// SIM STATUS ////////////////////////////////////////////////
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SIM_RATE = integer 0 or 1 (!!!) also used to check if sim is "running"
SIM_STATUS -- this is also passed to ROUNDS submodule
  .currentLoop: [ LOAD, STAGED, PRERUN, COSTUMES, RUN, POSTRUN ]
  .roundHasBeenStarted: bool
  .completed: bool
  .timer: used by ROUNDS submodule

// ROUNDS SUBMODULE //////////////////////////////////////////
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ROUNDS_INDEX: int -1
ROUNDS_COUNTER: int -1
TIMER
TIMER_COUNTER
ROUND_TINER_START_VALUE
RSIMSTATUS = SIM_STATUS via RoundInit()


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

API methods 
  Stage 				GLOOP_LOAD, GLOOP_STAGED, ROUNDS.StageInit()
  							SIMSTATUS.currentLoop = STAGED,
  		  				step on GLOOP_PRERUN

	NextRound			SIMSTATUS.currentLoop = PRERUN
  							SIM_RATE 0
  							ROUNDS.RoundInit(SIMSTATUS)
  							Raise 'SCRIPT_EVENT', { type: 'RoundInit' }
  							step on GLOOP_PRERUN
  							
  Costumes			SIMSTATUS.currentLoop = PRERUN
                step on GLOOP_COSTUMES           
                Raise 'SCRIPT_EVENT', { type: 'Costumes' }
                step on GLOOP_PRERUN

	Start					SIM_RATE 1
								step on GLOOP
								will Raise 'SCRIPT_EVENT', { type: 'Tick' } every 30 frames
								ROUNDS.RoundStart(Stop)
								Raise 'SCRIPT_EVENT', { type: 'Start' }
	
  Stop					SIM_RATE 0
  							SIMSTATUS.currentLoop = POSTRUN
  							SIMSTATUS.completed = RoundStop()
  							Raise 'SCRIPT_EVENT', { type: 'RoundStep' }
  						
  
  End						SIM_RATE 0
  							SIMSTATUS.currentLoop = PRERUM
  							
  Reset					ROUNDS.RoundsReset()
  							SIMSTATUS.completed = true
                back to Stage()

	Run						- unused

  Restage				- unused
  
  Pause					- unused

  Export				- unused

sim-rounds
	RoundsReset
	RoundInit
	RoundStart
	RoundStop
	StageInit

GLOOP_LOAD:
	LOAD_ASSETS, RESET, SETMODE, WAIT, PROGRAM, INIT, READY
	
GLOOP_STAGED:
	STAGED
	
GLOOP_PRERUN:
	INPUTS_READ, INPUTS_UPDATE, CREATE, DELETE, PHYSICS_UPDATE, PHYSICS_THINK,
	GRAPHS_UPDATE, UI_UPDATE, VIS_UPDATE, VIS_RENDER
	
GLOOP_COSTUMES:
	INPUTS_READ, INPUTS_UPDATE, PHYSICS_UPDATE, PHYSICS_THINK
	GRAPHS_UPDATE, CONDITIONS_UPDATE, 
	INPUTS_EXEC, 
	UI_UPDATE, VIS_UPDATE, VIS_RENDER
	
GLOOP_POSTRUN:
	UI_UPDATE, VIS_UPDATE, VIS_RENDER
	
GLOOP:
	INPUTS_READ, INPUTS_UPDATE, CREATE, DELETE, PHYSICS_UPDATE, PHYSICS_THINK,
	INPUTS_EXEC
	AGENTS_UPDATE, GROUPS_UPDATE, FEATURES_UPDATE
	GRAPHS_UPDATE, CONDITIONS_UPDATE, 
	FEATURES_THINK, GROUPS_THINK, AGENTS_THINK, GROUPS_VETO,
	FEATURES_EXEC, AGENTS_EXEC, GROUPS_EXEC,
	SIM_EVAL, REFEREE_EVAL
	UI_UPDATE, VIS_UPDATE, VIS_RENDER
```

## AUG 29 SUN - Free Writing What Docs

ok what works right now?

We write scripts in scriptText, which is compiled into scriptUnits, which themselves are either converted into running code (called SMC) or converted into a visual user interface.

## AUG 30 MON - Review Current Direction

> #### Tasks for Project Wind-down
>
> * [x] Review [Rounds](https://gitlab.com/stepsys/gem-step/gsgo/-/commit/b9b53ec914fe58c8dc7d21ca4e64013c7ec88dee) and [Metadata](https://gitlab.com/stepsys/gem-step/gsgo/-/commit/45d98081bd43631c95d555984d2e074768ced113) ... write a short synopsys to submit to ben similar to bug report format (intent, implementation, expectation, results) - do it sooner than later.
> * [ ] design - vision of gui (10 hours)  - bill under "issue #115 scripting ui"
> * [ ] design - user system / joshua posted requirements (10 hours) bill under "issue #307 user model"
> * [ ] FAQs as the thought arises (unbilled or 50% billed)

### Review of Rounds

Posted this in the UI [GEMScript Inquirium/CodeReviews](https://drive.google.com/drive/folders/1-AIkBF-9xuHHTQyvLekZjQ2VNC9SHSrX) folder.



## SEP 01 WED - Pick something?

I think we'll start with the **design of gui vision** because this actually is a good entry point into the related **script FAQ**. I've allocated 10 hours for this.



## SEP 15 WED - Meeting To Dos

* #127 partial script import 
* #119 script and project duplicate copy/paste
* contact corey for #??? video background source code for their camera

## SEP 19 SUN - Let's Concept

Looking at #127 Partial Script Import, which I believe is a quality of life thing for researcher developers. Aside: big goal is to make this system something **grad students** can use to make their own things. 

In the initialization script like `moths-sandbox` I see these major elements:

* **project**: 
  * **bounds**: topleft, bottomright rectangle in pixels, and bgcolor
  * **scripts**: [ blueprint, ... ]
  * **instances**: [ agent:{ blueprintname, initscript }, ... ]
  * **rounds**: [ round_def, ... ]
    * round_def: duration, intro/outro text, intro/end setup script
* **initscripts** for rounds( **context**: simulation of many agents )
  * initScript: scriptText to set up certain things before the round starts
  * endScript: scriptText to asses simulation, possibly cleanup 
* **initscripts** for instances (**context**: an agent instance)
  * initScript: scriptText to set properties of the agent instance
* **organization context**:
  * the id of my installation 
  * the id of my class, at the installation
  * the id of my group, in the class
  * my user id, in the class

What about **Assets**?

* these are referred to in the various scripts so they are bound to the **project** level, possibly as pointer to the right asset path

Types of data to **exchange/import**

Since the blueprint data is now in the database. there's no automated way to get it out of there the sim and into visual studio code (and vice versa). I think we decided to do this with cut/paste.

Now there are small bits we want to move between scripts:

* entire blueprints can be moved, but they may have **asset dependencies**
* entire `when` clauses could be moved, but they have **blueprint context  dependencies**
* entire `every` clauses could be moved, but they have **blueprint context dependencies** too

The general desire is to be able to EASILY SHARE WORKING STUFF between researchers and perhaps students.

## SEP 23 THU - Local Overrides

Right now we have the following settings files:

* `gsgo/gsgo-settings.js`
* `gsgo/gs_packages/gem-srv/config/gem-settings.js`
* `gsgo/gs_packages/mcp-srv/config/mcp-settings.js`

This is what's inside `gem-settings`

```````js
const GSCONFIG = require('../../../gsgo-settings');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PACKAGE_NAME = 'GEM_SRV';
const RUNTIME_DIRNAME = 'runtime';
const RUNTIME_PATH = Path.join(__dirname, `../${RUNTIME_DIRNAME}`);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ...GSCONFIG,
  // overrides
  PACKAGE_NAME,
  RUNTIME_DIRNAME,
  RUNTIME_PATH // used only by servers
};
```````````````````````````````

There's an issue that **gem-settings** has to work with the *CLIENT* as well, so we can't access the filesystem in `gem-settings.js` so how to we make this:

* [ ] gem-settings.js is a normal import/require anywhere it needs it

I think we need to build the config file from sources. So a lot of what's in `gem-settings` gets converted into a file.

```
pseudocode
gsgo-settings.js creates exports an object of constants that it calculates from the runtime environment

webpack contexts can be used to export a library, but I don't think it works on the brower side?

```

The hard part is trying to make `gem-settings` something that's easy to load, knowing that it includes stuff from our `local.json` file.

* we need to create the settings.json file dynamically before webpack runs.
* the place to do that is in `gem_run.js`

I've updated the code to create the `local-settings.json` file if it doesn't exist when running `gem_run` or `mcp_run` 
