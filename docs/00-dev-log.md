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

* Big progress meeting ([report](https://docs.google.com/document/d/1gcpPCefTuLCah1151jIJpozmt8ggZqRXmpyGrQv3ViQ/edit)). Goal is to deliver scripting experience.
* URSYS: Added exec local pub/sub/call. Added urnet remote socket connection. Added app lifecycle phase groups and operation control. Added unified debug module. Started SIM module and infrastructure.

SUMMARY S11 MAY 25-MAY 31

* W1: (Mostly MEME work.) Research lokijs, lowdb, lodash, memoization, assertion, and trigger libraries

---

## May 25 Continuing

Continuing from Sprint 10...we're still working on **inserting the game loop**. 

**Q. Where to put the gameloop?**
A. I think probably a new module that hooks into it. But how will it get called without being run on the server?

* [x] **insert gameloop lifecycle into exec**
  making new modules/sim/mainloop...
  how to hook into init? Need to explicitly load modules in _app and initialize them manually.
  add stub calls to gameloop
* [x] **create gameloop lifecycle module???**
  similar to ur-exec, but for game loops with its own lifecycle.
  maybe add a custom phase group to ur-exec

**Q. Where is the definition for Stage 2 proposal?**
A. It's [here](https://wasda) 

## June 02 Resuming Action

Reacquainting myself with the project for a 15 minute push to keep the project top of mind...

* [ ] **write agent base class**
  first need to outline the simulation loop and data needs
  stub out data needs and also the data model
  make stub data modules
* [ ] create agents in gameloop module
* [ ] iterate over agents per cycle
* [ ] write costume, location, input placeholders
* [ ] write interaction set code
* [ ] write interaction processing

I actually can't remember what it's doing now.