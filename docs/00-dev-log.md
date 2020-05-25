SUMMARY [S01-S05 JAN 05-MAR 15](00-dev-archives/sprint-01-05.md) - initial research

* Early specification and research

SUMMARY [S06 MAR 16-MAR 29](00-dev-archives/sprint-06.md) - development tooling

* Created **monorepo** w/ **lerna** in gsgo
* Added Visual Studio Code essential configuration files to work across all packages in monorepo with Eslint, Typescript, Prettier, AirBnb
* Organized and expanded **docs folder**
* Establish process for managing **monorepo versioning**

SUMMARY [S07 MAR 30-APR 12](00-dev-archives/sprint-07.md) - wireframing server, Material UI and NextJS

* Create **GemServer** package with VSCode subworkspace supporting local "npm run local" command and "launch.json" server debugging.
* Figure out **Material UI theming and styling** and its relation to Material Design. 
* **Documented** and created source code examples.
* Figure out **NextJS** and server-side rendering implications.
* Create custom NextJS configuration with best practice **theming and styling**, **stackable  screen-filling components** with **two-level navigation**. Also rudimentary **client-side data persistence**.

MISSED INTERNAL TARGET for having USER-FACING GEMSCRIPT PROTOTYPE

* sri priority: develop stable platforms and standards that will prevent headaches from recurring.
* sri priority: outline systems and communication first, because they are more complex.

SUMMARY [S08 APR 13-APR 26](00-dev-archives/sprint-08.md) - wireframing documentation system, skeleton app navigation

* Added ReactMarkdown, URLayout page grid, URWireframe components
* Reviewed Functional Draft, created placeholder components and navigation in GEM_SRV
* System Wireframing with Named Components begins

SUMMARY [S09 APR 27-MAY 10](00-dev-archives/sprint-09.md) - gemscript app outline begins, ursys network porting

* Review original Function Spec Tab Layout; interpreted into a working page flow
* New [branching conventions](20-tooling/21-branch-flow.md) specified
* NextJS: custom server. client and server code injection points for URSYS
* URSYS: convert to package library. URNET socket server. URNET client injection.
* URSYS: URLINK local publish, subscribe, signal. React custom hook interface.

SUMMARY S10 MAY 11-MAY 24

* WIP

---

# 6.2. URSYS FOUNDATION FOR SIMULATION PROTOTYPE (cont'd)

## May 13.1 Finish URSYS LocalCall testing

Ok, let's get the URSYS CALL tested, then implement the minimum for EXEC. I think this might take a couple of hours.

* make a test button in Welcome
* update to next 9.4.0 because better debugging
* add npx-audit, multiview startup to gemsrv
* export Call
* Rename URLINK to URCHAN, because channels are more accurate. 
* Also added notes on channel architecture with publish, subscribe, call and the slightly different semantics for future thinking. What are channels anyway? Our implementation has an unresolved smell to it to make it much simpler, methinks.

NOTES:

* had to use separate URLINK instance for subscribe functions for publisher functions, because Publish and Call will check for "same origin". Signal does not. This needs an eventual refactoring...once we write tests for URSYS.
* Perhaps the UI methods should implement a separate mirroring call by using different channels.
* Should I renamed URLINK to URCHAN? They sort of are channels. 
* I forgot that Call has to return data so the promise receives something. Do we have a reference?

## May 13.2 Package

This is a good place to commit. 

* cleaned up `npm start` that Joshua reported not working (expanded GEM server is the new model, others are incompatible at the moment due to duplicated URSYS servers).
* cleaned up URSYS Call test

## May 14.1 Implement EXEC Lifecycle

I'm not sure exactly what this entails, but the minimum is to review UREXEC and figure out how to wedge it into `_app.jsx`. 

* update the phase list. We might want to make this something that can be initialized from the server since different apps may have different lifecycles. Punting for now. Created new [urexec reference](01-architecture/02-urexec.md). 

* implemented preliminary `ExecuteGroup()` placeholder, test that it is callable from `_app.jsx`.

* next: implement `Execute()`, looking at

  ```js
  // parallel
  const [number1, number2] = await Promise.all([randomNumber(), randomNumber()]);
  // serial
  const number1 = await randomNumber();
  const number2 = await randomNumber();
  ```


## May 17.1 Implement EXEC Lifecycle (cont'd)

Looking at `_app.jsx`, we're starting to start the EXEC module. This all happens in an effect in MyApp:

```js
  useEffect(() => {
    // placeholder exec
    (async () => {
      UR.ExecuteGroup('PHASE_BOOT');
      UR.ExecuteGroup('PHASE_INIT');
      UR.ExecuteGroup('PHASE_LOAD');
      UR.ExecuteGroup('PHASE_RUN');
      UR.ExecuteGroup('PHASE_UNLOAD');
      await UR.Connect(urProps);
      APPSTATE.StartTimer();
    })();
  }, []);
```

To make this work for real:

* run PHASE_BOOT, PHASE_INIT, PHASE_LOAD, PHASE_RUN in the effect
* run PHASE_UNLOAD as a cleanup function on unmount
* move `await UR.Connect()` and `APPState.StartTimer()` to the appropriate hook in the module that needs to do it.

### **Q. Where does `UR.Connect()` belong?**

>  Probably `UR_INIT`. Note that the lifecycle hooks aren't events, but hooks. I wrote up the [difference](01-architecture/02-asynch.md). Basically hooks are **when our code needs to do the right thing** to startup properly.

An issue is that we don't have reliable client-side runtime control until `_app.jsx` is loaded. The earliest we can guarantee app-wide browser-side code is in the `useEffect()` of `MyApp`. 

I think I need to **rename lifecycle hooks** so they clearly indicate that we're invoking them from URSYS so user code has an opportunity to participate in the lifecycle....ok, that's done. These are now more like STATE GROUPS

## MAY 18.1 Inserting Lifecycle Functions

Yesterday I worked out the meaning of hooks as the URSYS lifecycle synchronization mechanism. This is where user code has the opportunity to make use of the URSYS lifecycle. There is some internal code that handles stuff for us, but relies on the URSYS HOOK system to know when to do it.

When porting URSYS to a new system, we have to figure out where to insert the engine that drives those lifecycle phases. This is the implementation specific part of URSYS. Figuring it out for NextJS is a new puzzle.

I've expanded the list a bit again, because the rules are:

* PHASES execute one after the other under system control. 
* OPERATIONS within a PHASE will be completed before the next PHASE runs. However, the ORDER of operations is not guaranteed.
* To particulate in the URSYS lifecycle, your user code HOOKS into an OPERATION by name. Your hook function may receive data. Your hook function can return a Promise to ensure that it completes its operation. 

Let's clean things up a bit, removing the old SCOPE requirements.

* [x] removed `REACT_PHASES`
* [x] renamed PHASES to OPS for consistency in new schema
* [x] move UR.Connect to internal URSYS module?
* [x] remove `SetScopedPath()`
* [x] add SystemBoot, SystemUnload
* [x] rename SubscribeHook to SystemHook
* [x] fix asynchronous phase_group exec

At this point, we can kick off the entire system using `SystemBoot()` and hook into the lifecycle using `SystemHook()` Yay! 

## MAY 18.2 Lifecycle Run Logic

The system heartbeat  runs independently of React's lifecycle to do an orderly startup of our system modules. We want to implement a "Phase Counter" that walks through all the phases in-order sequentially.

* [x] implement System* interface and asynchronous run management
* [x] implement update
* [x] implement animframe
* [x] implement reset

## May 20.1 Fix remaining URNET issues

TODO

* [x] reduce the update/animFrame overhead as much as possible

Why do we even want to do this? urProps contain the HOST, PORT, and potentially a unique SESSION id. 

## May 21.1 Continue fixing remaining URNET issues

* [x] **urProps (now netProps) isn't being passed from _app.jsx to URNET.Connect**
  UR.SystemBoot() now receives them along with autoRun, update, animFram and checks
  The netProps options need to be stored in a central UR database for the current client connection...done
  Now URNET.Connect needs to get the broker info from the new client-session module...
  server-urnet StartNetwork returns options { port, uaddr }. We also need host
* [x] **pages/api/urnet.js is not dynamic**
  Remove the /pages/api/urnet...now replaced in the _start custom server with a call to URSYS so it's all contained there.

## May 21.2 Now what?

GEMSRV is now capable of starting up completely without hardcoded connection points; you just have to point to the server and it will automatically connect to URSYS by grabbing information from urnet/getinfo...here's some stuff to put off:

* [ ] insert interrupt management into exec ... eventually
* [ ] make ursys-react ... eventually
* [ ] port faketrack ... soon

We also have to port FakeTrack over at some point for input data.

Going to nap and then tackle the SIM STUFF. I think the first thing to do is write the GAMELOOP somewhere so it prints stuff out. Then maybe make a simple button panel. Then maybe the Agent class as a set of composable functions. Yeah composition!

* [x] fixed bug in server-urnet, where ws.Server was initialized with host 'localhost' instead of its own ip address, which caused the socket server to refuse remote connections.

## May 21.3 Still Thursday

Moving list of immediate steps to stick into the current work:

* [ ] insert gameloop lifecycle into exec
* [ ] write agent base class
* [ ] write costume, location, input placeholders
* [ ] write interaction set code
* [ ] write interaction processing

Free thinking on the inserting the gameloop...hm, I guess that would have to be somewhere in a simulation module. **where will that live?** I think it will be some kind of black box with its own API and of course its own lifecycle. It's similar to EXEC.

* clean up info text
* write a new debug module

## May 22.1 Cleaning up

Yesterday I wrote a new PROMPTS module, and have just finished replacing it. It will make centralized debug messages much easier to manage while looking good for both the server and the client.

* cleaned up debug module, added ability to disable console output from one place
* removed console-styles and old prompts modules, renamed debug module to prompts

## May 24.1 Inserting Simulation Update

I've been kind of stalled on this over the weekend. Let's just jam the gameloop in there.

**Q. Where to put the gameloop?**
A. I think probably a new module that hooks into it. But how will it get called without being run on the server?

* [x] **insert gameloop lifecycle into exec**
  making new modules/sim/mainloop...
  how to hook into init? Need to explicitly load modules in _app and initialize them manually.
  add stub calls to gameloop
* [x] **create gameloop lifecycle module???**
  similar to ur-exec, but for game loops with its own lifecycle.
  maybe add a custom phase group to ur-exec
* [ ] **write agent base class**
  first need to outline the simulation loop and data needs
  stub out data needs and also the data model
  make stub data modules
* [ ] create agents in gameloop module
* [ ] iterate over agents per cycle
* [ ] write costume, location, input placeholders
* [ ] write interaction set code
* [ ] write interaction processing

