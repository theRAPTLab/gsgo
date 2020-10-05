**SUMMARY S18 AUG 31-SEP 13**

* W1: New FakeTrack progress, resurrect appserv architecture for pixiJS integration
* W2: Refit URSYS. Sprite and display list system architecture for clickable interactions

---

## MONDAY AUG 31 - Rebuilding

We need to rebuild the app server system. But first...PIXI

```
lerna add pixi.js --scope=@gemstep/app_srv

```

THINGS TO FIX

```
ursys now requests props directly from the server, not in an ejs template
SystemInit.jsx has module resolution problems in IDE (path aliases aren't working in ide)
```

## TUESDAY SEP 01 - PREPPING

I outlined the system yesterday to reacquaint myself. I also need to make some "thinking space" for myself. 

## WEDNESDAY SEP 02 - HTML REBUILD on OLD SERVER

What is the div structure of the old server?

```
## LAUNCHING SPA
urdu.js spawns dev server through RunDevServer()
express server runs from ursys/node/ursys-serve
.. Initialize: URNET.InitializeNetwork()
.. StartNetwork: URNET.StartNetwork()
.. StartWebServer: await URWEB.Start() -- webpack dev server make bundle, 
web-index.html.ejs defines div#app-container and loads web-bundle.js
web-bundle.js is created by config/wp.pack.webapp.js through webpack

## SPA
web-index.js is the entry point defined in wp.pack.webapp.js
web-index.js calls boot/SystemInit after doing page setup
SystemInit.Init:
.. adds resize listener
.. adds DOMContentLoaded listener
.. adds URSYSDisconnect listener
.. calls URSYS initialization: JoinNet, EnterApp, m_PromiseRenderApp, SetupDOM, SetupRun
.. .. JoinNet call returns JoinNet promise URNET.Connect
.. .. EnterApp: INIT, LOAD, CONFIGURE
.. .. m_PromiseRenderApp: ReactDOM.render into #app-container, then resolve()
.. .. SetupDOM: DOM_READ
.. .. SetupRun: RESET, START, REGISTER, ULINK.RegisterSubscribers, READY, RUN
			(ULINK.RegisterSubscribers if messages, then do a netcall to server)
```

Thinking aloud. What is it that I want to do?

* Well, I need to load PixiJS into some kind of HTML shell. I think I can shortcut that by inserting it into `m_PromiseRenderApp`, and have it ignore React and instead call some other module.

What modules are accesible from SystemInit.Init()?

* Currently it loads `SystemShell` and renders it inside `#app-container`
* This routes the components defined in `SystemRoutes`
  * `ViewMain` and `NoMatch` are the two components
* `ViewMain` currently doesn't show anything. 

```
HOW PLAE RENDERS SPA

during construct, it looks for #system-app and renders into it
For bees2, it loads components/AppBees2

The SCREEN component provides screen manipulation functions

info = #nfo1401
main = #renderer
debug = #dbg1401

main:
	#renderer position relative
		#renderer-overlay position absolute, top 0
			#paint-overlay position absolute, top 0
Screen.RefreshDimension(cfg)

---
LAYOUT RULES - how the render area fits its space

  FIXED  - #renderer drawn upper left of #display, 1:1 pixel
  SCALED - #renderer canvas is scaled to fit browser window
  FLUID  - #renderer is 1:1 pixels but is resized

SCREEN MODES - surrounding layout (if any) for the renderer

  CONSOLE - fixed presentation on large screen, with sidebar areas
            surrounding a WebGL canvas
  MOBILE 	- responsive presentation on small screens, using a
            ui framework, with an optional WebGL canvas
  NONE    - no sidebar areas at all

Both a LAYOUT RULE and a SCREEN MODE can be set, and they will behave
as you would expect.

```

OK, what we need to do is just

## THURSDAY - PixiJS in APP_SRV

It works! It is a much cleaner architectures than NextJS for this kind of stuff.

## FRIDAY - Port URSYS into APP_SRV

SystemInit needs this replaced:

```
document.addEventListener('DOMContentLoaded', () => {
    if (DBG)
      console.log(
        '%cINIT %cDOMContentLoaded. Starting URSYS Lifecycle!',
        cssur,
        cssreset
      );
    // 1. preflight system routes
    UR.RoutePreflight(SystemRoutes);
    // 2. lifecycle startup
    (async () => {
      await EXEC.JoinNet();
      await EXEC.EnterApp();
      await m_PromiseRenderApp(); // compose React view
      await EXEC.SetupDOM();
      await EXEC.SetupRun();
      /* everything is done, system is running */
      if (DBG)
        console.log(
          '%cINIT %cURSYS Lifecycle Init Complete',
          'color:blue',
          'color:auto'
        );
    })();
  });
 
```

The `UR.RoutePreflight(SystemRoutes)` call doesn't have an equivalent in the new URSYS. How does it work?

In the NextJS app server, ursys is initialized in `_app.js` as a `useEffect()` hook. 

```
  useEffect(() => {
		...
		// URSYS start
    // 1. Boot URSYS lifecycle independent of React
    UR.SystemHookModules([SIM, APPSTATE]).then(() => {
      UR.SystemBoot({
        autoRun: true,
        netProps
      });
    });

    // useEffect unmounting action: URSYS shutdown
    return function cleanup() {
      console.log(...PR('unmounting _app'));
      UR.SystemUnhookModules().then(() => {
        UR.SystemUnload();
      });
      // force page reload after unmount
      // window.location.reload();
    };
  }, []);
```

Differences:

* `SystemHookModules()` **explicitly** **initializes** modules by calling their `UR_ModuleInit()` handlers, instead of `SystemRoutes` being used to figure out what modules are in-scope or note. 
* `SystemBoot()` **replaces** the async function in old ursys

### THE URSERVER

We want to import the URSERVER but not modify the rest of the express server

```
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Custom NextJS Server

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ w* /////////////////////////////////////*/

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const URSERVER = require('@gemstep/ursys/server');
const PTRACK = require('./step-ptrack');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const SCRIPT_PATH = path.relative(`${__dirname}/../..`, __filename);
const RUNTIME_PATH = path.join(__dirname, '/runtime');

(async () => {
  console.log(`STARTING: ${SCRIPT_PATH}`);
  await PTRACK.StartTrackerSystem();
  await URSERVER.Initialize();
  await URSERVER.StartServer({
    serverName: 'GEM_SRV',
    runtimePath: RUNTIME_PATH
  });
  const { port, uaddr } = URSERVER.GetNetBroker();
  console.log(`SERVER STARTED on port:${port} w/uaddr:${uaddr}`);
})();

/// START CUSTOM SERVER ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ NextJS is loaded as middleware with all its usual features
    except for automatic static optimization.
    We get a chance to intercept routes before passing the request to
    to the default handlers provided by NexxtJS.
/*/
app.prepare().then(() => {
  createServer((req, res) => {
    // Be sure to pass `true` as the second argument to `url.parse`.
    // This tells it to parse the query portion of the URL.
    const parsedUrl = parse(req.url, true);
    if (!URSERVER.HttpRequestListener(req, res)) {
      handle(req, res, parsedUrl);
    }
  }).listen(3000, err => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});

```

The way the current server works:

```
URSRV = ursys-serve = Initialize, RegisterHandlers
URWEB = server-express
URNET = server-network
URLOG = server-logger

urdu.js runs
URSERV.Initialize({apphost:'devserver'});
URSERV.StartNetwork();
URSERV.StartWebServer();

Initialize()
- RegisterHandlers()
- URNET.InitializeNetwork(options)
- - NetMessage.GlobalSetup({uaddr: options.uaddr})
StartNetwork()
- URNET.StartNetwork()
- - create socket server and handlers *** here ***
StartWebServer()
- await URWeb.Start()
- - load webpack configuration
- - listen to port after StartServer
- - promiseStart does compiler message
- - use cookieP, access control, view engine ejs
- - get / render index with URSsessionParms
- - / Express.static DIR_OUT (built/web)
```

#### THINGS TO DO

```
[X] - add @gemstep/ursys: lerna add @gemstep/ursys --scope=@gemstep/app_srv
[ ] - update SystemInit with netProps and SystemBook
[ ] - @gemstep/ursys/server StartServer() and HttpRequestListener(req,res)

insert the netprops into the web server, which should be launched by urdu.js
URSERVER.HttpRequestListener(req, res) 
```

NOTES:

* Remember to use `UR.SystemHookModules([ ...  ])` on document DOMContentLoaded to give every module an opportunity to hook. They must define `UR_ModuleInit( UR_EXEC )` where `UR_EXEC` is the phase machine instance that implements `Hook('Phase',handler)`
* The bootstrap is handled in `SystemInit.jsx` and it taps itself and RENDERER to hook into UR_EXEC events.
* Execution continues in the loaded route.x

---

## September 9 - Figuring out where Modules go

Reviewing the difference between app_srv and gem_srv in its file hierarchy. It's similar except for the organization of the bootup:

* gemserv is nextjs and uses pages, pageblocks, pagetabs 
* appserv is custom express and uses src/app/boot that loads app/views

Compare to PLAE

* 1401 is the system, 1401-games is the view
* system is module-level, objects are common data, components are ui 

```
PLAE
----
1401/
components/
objects/
system/
1401-games/
components/
game-run.*
```

* inserted sim startup in Tracker.jsx for now in componentDidMount, probably not a great idea

The current startup now looks like this

```
SystemInit DOMCOntentLoaded: UR SystemHookModules sim/runtime and SystemShell render
sim/runtime UR_ModuleInit: UR Hook APP_*, forward UR HookModules to sim-dependent modules
.. test-renderer UR_ModuleInit: APP_LOAD load sprites
sim/runtime SIM_ModuleInit hooked into GameLoop
.. INPUTS
.. CONDITIONS
.. AGENTS
.. FEATURES
.. REFEREREE
.. RENDERER
```

The extra time spent compiling app_srv might be related to the way hot reload is built, and also that ursys itself is being compiled from scratch each time.

I tried to figure out why the compilation was taking so long, but couldn't figure it out. NextJS compiles much more quickly, so I'm not sure what I'm doing wrong. Let's check brunch

## September 10 - Sprites In

Let's see if I can click on the sprite and drag it around. Yes! Relatively easy. The examples are more useful than the documentation.

### Porting PTrack Location and Transformation Code

I'm reviewing the INPUT and PTRACK client-side code to determine what data structures need to be made.

```
Raw PTRACK JSON is processed into a Frame
EntityObjects are created from Frame

TrackerObjects use transformed EntityObject position data in world space
TrackerPiece is a Piece with a TrackerObject property
```

**class-ptrack** implements the PTrack manager that continually processes frame data received from the PTrack server into an entity list.  This entity list is transformed by **step/ptrack** from physical coordinates in the world into SimWorld coordinates that are stored in **class-tracker-object** inputs that are then mapped to a **piece pool**. 

* when moving pieces around, we assume the **SimWorld coordinates of -500 to 500**

RAMIFICATIONS

* the **tracker-object** holds SimWorld normalized coordinates that represent a **target location**
* **agents** in the SimWorld that are controlled by students **seek** the target location in a tracker object.
* **sprites** are drawn based on the current target location of an associated agent.

### Handling Agent and Sprite Creation

Every agent instance needs a sprite to represent it.

Agents have x, y properties. These can be in a TrackerObject. We might also need **orientation** and **speed** provided in the **Movement feature**. 

Sprites are maintained in a pool, and are assigned to a particular Agent instance by id using a similar method of mapping raw frame entities by id to an existing trackerobject. When sprites update, they retrieve the location from its TrackerObject.

* id, x, y are part of the agent
* orientation, speed, direction, rotation, acceleration are part of the Movement Feature.
* active agents are processed and their matching sprite IDs are checked to see if an update is necessary
* if an active agent implements Movement, then rotation and direction are also applied to the sprite, depending on the type of movement.

So we need to next implement a **Movement Feature** and be able assign it in an Agent Template. 

#### INPUT GROUPS and MAPPING

PTrack is entity data from the camera tracking system, but we have two other inputs:

* FakeTrack input that mirror PTrack data 
* Pointer input that is assigned by INPUT GROUP to have a particular function (controlling a bird, or something)
* Observer inputs that provide events to trigger

For the first two groups, there's a *MAPPING STRATEGY* that determines how the input is shown on the screen:

* For PTrack/FakeTrack, entities are assigned agents based on proximity to existing agents that are seeking to be controlled. They need to have some kind of "target" and also "sprite position". 
* For Pointer Input, the activity defines devices by INPUT GROUP, each one meaning something. There are a number of "agent instance slots" that can be assigned to a Pointer Group.
* FakeTrack and Pointer Inputs are very reliable, so they will hold their agent assignments. PTrack data can be unreliable because of entity dropouts, so PTrack entities will have to use proximity embodiment for agents designated under 
  "student control". PTrack-controlled agents will display some kind of indicator.

#### CREATION LIFECYCLE

```
load model definition
* agent template functions - define properties, features, and interactions
* agent instance init - set starting property values, run initial code
* agent conditions - run periodically

initialize simulation
* make agent instances and run agent init on all of them
* apply agent instance value overrides
* apply agent instance feature initialization

update lifecycle runs
* features tap lifecycle
* features maintain list of subscribing agent instances
```

#### MOVEMENT FEATURE THINK-ALOUD

```
movement.type == PTrack? 
Then do nearest entity assignment to nearest PTRACK controlled agent!
* map entityID with TrackerObj in TrackerPool in agentID
* map agentID with spriteID in SpritePool
* agent seek TrackerObject on update
* sprite drawn at agent pos during RENDER

movement.type == FakeTrack?
Then it's the same as PTrack

movement.type == Pointer?
Then assign Pointer to "affiliated agent"
* generate entityID for pointer
* allocate agent instance to pointer (first come, or direct assignment by instance name/device name)
* agent seek Pointer TrackerObject
```

#### IMPLEMENTING FAKETRACK

This can use the agent interface also. The program would be something like this:

```
-- these are defaults
agent FakeTrack
	use feature 'Movement'
		prop 'type' setTo 'selectable' -- 'ptrack' another option
		prop 'mode' setTo 'direct'
	property skin setTo 'round.png'

agent Blue extends FakeTrack
	prop 'group' setTo 'Blue'
	
agent Red extends FakeTrack
	prop 'group' setTo 'Red'
```

The way this might work:

* the FakeTrack agent is using Movement and is initalized to type 'selectable', which adds the agent instance to the pool of eligible controllable agents.
* `INPUT` phase: the Movement feature reads the position of FakeTrack agents and sends an input packet to system
* `UPDATE` phase: agent position, decoration flags updated from relevant agent props

## September 11-12: Implementing FakeTrack through Agent Interface

This should be possible, but I'm not sure how it will work. 

Let's list things in chunks in the backlog, and convert to questions as **NEXT ACTIONS:**

#### Q01 - How does routing relate to URLOOP and URSIM startup?

#### Q04 - How does URLOOP and SIMLOOP overlap in phases?

#### Q05 - How do arbitrary modules register for either URLOOP or SIMLOOP anyway?

```
** PATH 1 **
SystemInit hooks DOMContentLoaded to use IIFE to start URSYS

1. get urnet info
2. call UR.SystemHookModules() to invoke UR_ModuleInit() - sim, local UR_ModuleInit
3. call UR.SystemBoot() with urnet info
4. UREXEC manages the UR phase machine and has a SystemBoot() method that
   - initalizes the session props in URSESSION from urnet info
   - executes phases and starts URLOOP update

** PATH 2 **
SystemInit starts React when its UR_ModuleInit() is called in PATH 1 step 2

1. SystemShell uses SystemRoutes to generate a React Router Switch statement
2. SystemRoutes has a list of top-level components located in pages/
3. Tracker is switched-in and renders forth based on route

*** PATH 3 ***
Tracker imports test-render as Renderer and invokes Init in componentDidMount()

1. Renderer.Init(renderRoot)
2. Renderer.HookResize(renderRoot)
3. Renderer.Draw()

*** CHANGES TO MAKE ***
We want to change SystemHookModules([modules]) to something that
	o - hooks into UR on initialization within the module like an import
	    import UR
	    UR.Hook('PHASE',()=>{ ... });
	o - It shouldn't be necessary to have an explicit UR_ModuleInit() then
	
Likewise, the sim/runtime and sim/runtime-core provide the main loop
  o - import RUNTIME 
      RUNTIME.Hook('PHASE',()=>{ ... });
  o - this suggests that runtime.js might have to move somewhere else.
  
*** CONFIRM CHANGE POSSIBILITY ***
[X] - UR.class.PhaseMachine('SIM') runs in runtime? 
			YES. UR IS AVAILABLE
[X] - UR is the first module loaded, which loads its constituent sub features
[X] - modify PhaseMachine to directly accept hooks
[X] - add QueueHook() to UR, test with SIM
[X] - remove PhaseMachine HookModules if it's used
[X] - remove PhaseMachine MockHook if it's used
```

---

#### Q02 - What does a "Clickable Agent" need to implement?

For FakeTrack, it's

* Rendering System 500x500 in screen, origin center, pixel coordinates, RHS (pos Z is closer)
* Input Display Objects
* Sprites rendered from Display Objects
* Clicks on Sprites are Highlighted
* Dragging Sprites update Position in DisplayObject
* Every visible object on the screen has a CONTROL type if it's an AGENT
* Some visible objects are a READONLY display list
* Local instance also maintains a WRITEONLY display list

---

#### Q03 - How does an Agent Instance link to a Sprite?

```
(1) AGENT INSTANCES:
  - created by AgentTemplate functions
  - have a unique id
  - property instances in 'properties' dict
  - shared Feature libraries by 'featurename'
  - shared Program libraries by 'templatename'
  - unique initialization program (stored in agent instance)
  - unique condition program (stored in agent instance)

(2) AGENT INSTANCE LIST:
  - agent instances are generated by a running simulation
  - running simulations can add/remove agent instances
  - to draw agent instances

(3) DISPLAY LIST GENERATOR:
  - maintains displaylist of 'display objects'
  - each agent instance generates at least one 'display object' in a list by type
  - 'display objects' can contain other display objects by specifying parent
  - when agent instances are scanned, display objects are updated
  - display objects are maintained in a pool and refer to agent instance
  - display lists are used to render sprites
  
(4) DISPLAY OBJECTS 
  - have ids and type and agent instance id reference
  - have one element
  - have x, y, z, color, opacity that map to sprite
  - have interaction event status (selected)
  - have modes that show one or more effects
  - hold a reference to its visual representation (sprite)  
  - have unidirectional properties (LOCAL are noncontrolled, SYNCED are controlled)
  - aggregate data changes received from display list generator to sync agents

(5) SPRITE POOL
	- sprites are added, updated, and destroyed based on changed to the DisplayList
	- sprites and managed in a pool, and update from its associated Display Object
	
(6) RENDERER
		draws all the sprites in renderpasses
	
```

---

#### Q04 - How do Sprite Interactions map back to Agents?

```
INPUT SYSTEM:
  - clicks on sprites fire events to select update display object selection
  - dragged sprites (if draggable) update display object x,y
  - button press widget fires action events
  - slider events fire continuous value events
  - text fields fire text updates
  
updated sprites are for the local display objects that are maintained in a separate agent list,
and are sent as part of its own update.
```

---

#### Q05 - How does Renderer Work?

```
RENDERER SYSTEM:
  - reads the display list
  - assigns appropriate 'visual element' to each display object from a pool
  - updates each visual element from display object data
  - updates every frame by fetching display object list of changed elements
  - writes the full display list to a buffer for scrubbing

RENDERER COORDINATE SYSTEMS
  - render to a 500x500 space, +/- 250 pixels
  - origin is placeable anywhere
  - positive x is to screen right
  - positive y is to screen top / closer to projector screen
  - positive rotation around Z is counterclockwise

WIDGET SYSTEM and DISPLAY OBJECTS
  - widgets are a type of display object
  - can be in-world or on the side

```

---

## September 13: Sunday Implementation Plans

There's a lot of stuff to do:

```
[ ] Outline Data Commonalities between Classses
[ ] * Agent Instance Shared Display Object Properties
[ ] * Display Object Classes
[ ] * Sprite Classes

[ ] Generic Pool Class
	  * objects with ids map one array of objects to pool of mapped objects
	  * Pool has add, delete, and update methods
	  * Has one method: MapObjectsToPool( param ), returns added, deleted, updates list
	  
[ ] Create DisplayObject Pool
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

**BACKLOG** to move above...

```
BRAINDUMP WHAT'S ON MY MIND

runtime-datacore:
contains common dictionaries to store data
- programs are lists of action generator functions
- agent templates store declare, default init, condition programs by 'templatename'
- conditions are "test program" + "iftrue,iffalse programs" by 'condition hash'
- single and pair-wise interaction tests by 'condition hash'
- single code execute by 'condition hash'

------


INTER-DEVICE COMMUNICATION:
- need network wide simulation element addressing
- multiple data streams and logical endpoints
- device classes, device classes instances
- device classes can define multiple modes or props
- activity names for device class instances as a named channel
- group names, logical names of each device

DISPLAY BUFFERING:
- generates FULL FRAME display list indexed by frame number
- used for forward/reverse playback

WRITE A POOL MANAGER useful for mapping an incoming list of objects to another list of object
incoming objects have a unique id
incoming objects based on "dirty" flag; when added to list flag is cleared
mapped objects use id to add, remove, update objects in the pool

---

binary protocols in sockets: 
use typed arrays and buffers, read bytes by offset
https://www.dynetisgames.com/2017/06/14/custom-binary-protocol-javascript/
https://blog.logrocket.com/binary-data-in-the-browser-untangling-an-encoding-mess-with-javascript-typed-arrays-119673c0f1fe/
https://github.com/eligrey/FileSaver.js/
https://github.com/cscott/lzjb
npmjs.com/package/ws#websocket-compression

---

FAKETRACK init of TEMPLATE in URLOOP
FAKETRACK instantiate template INSTANCE in URLOOP
FAKETRACK update template INTERACTIONS in URLOOP

FEATURE hook into SIMLOOP

RENDERER init of SPRITE ENGINE in URLOOP

in SIMLOOP INPUT:
  get lists of entity by movement type: "interactive", "static", "ptrack"
  
in SIMLOOP UPDATE:
  process entities by type
  interactive -> update associated agent tracked position DIRECT
  ptrack -> update associated agent tracked position LERP
  -
  update autonomous FEATURE processes in held agents
  -
  handle queued messages, set props, forward as necessary

in SIMLOOP CONDITIONS
  run all condition tests to create sets
  
in SIMLOOP THINK:

in SIMLOOP EXEC:

in SIMLOOP RENDER part 1:
  read AGENT INSTANCES entity information
  encode into DISPLAY LIST
  send DISPLAY LIST

in SIMLOOP RENDER part 2:
  read DISPLAY LIST
  render to SPRITE POOL
 
```



