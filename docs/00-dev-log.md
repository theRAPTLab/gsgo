PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

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

