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

NOTES:

* had to use separate URLINK instance for subscribe functions for publisher functions, because Publish and Call will check for "same origin". Signal does not. This needs an eventual refactoring...once we write tests for URSYS.
* Perhaps the UI methods should implement a separate mirroring call by using different channels.
* Should I renamed URLINK to URCHAN? They sort of are channels. 
* I forgot that Call has to return data so the promise receives something. Do we have a reference?

Rename URLINK to URCHAN, because channels are more accurate.



