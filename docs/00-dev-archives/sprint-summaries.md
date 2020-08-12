# Sprint Summaries



SUMMARY [S01-S05 JAN 05-MAR 15](sprint-01-05.md) - initial research

* Early specification and research

SUMMARY [S06 MAR 16-MAR 29](sprint-06.md) - development tooling

* Created **monorepo** w/ **lerna** in gsgo
* Added Visual Studio Code essential configuration files to work across all packages in monorepo with Eslint, Typescript, Prettier, AirBnb
* Organized and expanded **docs folder**
* Establish process for managing **monorepo versioning**

SUMMARY [S07 MAR 30-APR 12](sprint-07.md) - wireframing server, Material UI and NextJS

* Create **GemServer** package with VSCode subworkspace supporting local "npm run local" command and "launch.json" server debugging.
* Figure out **Material UI theming and styling** and its relation to Material Design. 
* **Documented** and created source code examples.
* Figure out **NextJS** and server-side rendering implications.
* Create custom NextJS configuration with best practice **theming and styling**, **stackable  screen-filling components** with **two-level navigation**. Also rudimentary **client-side data persistence**.

MISSED INTERNAL TARGET for having USER-FACING GEMSCRIPT PROTOTYPE

* sri priority: develop stable platforms and standards that will prevent headaches from recurring.
* sri priority: outline systems and communication first, because they are more complex.

SUMMARY [S08 APR 13-APR 26](sprint-08.md) - wireframing documentation system, skeleton app navigation

* Added ReactMarkdown, URLayout page grid, URWireframe components
* Reviewed Functional Draft, created placeholder components and navigation in GEM_SRV
* System Wireframing with Named Components begins

SUMMARY [S09 APR 27-MAY 10](sprint-09.md) - gemscript app outline begins, ursys network porting

* Review original Function Spec Tab Layout; interpreted into a working page flow
* New [branching conventions](20-tooling/21-branch-flow.md) specified
* NextJS: custom server. client and server code injection points for URSYS
* URSYS: convert to package library. URNET socket server. URNET client injection.
* URSYS: URLINK local publish, subscribe, signal. React custom hook interface.

SUMMARY [S10 MAY 11-MAY 24](sprint-10.md)

* Big progress meeting ([report](https://docs.google.com/document/d/1gcpPCefTuLCah1151jIJpozmt8ggZqRXmpyGrQv3ViQ/edit)). Goal is to deliver scripting experience.
* URSYS: Added exec local pub/sub/call. Added urnet remote socket connection. Added app lifecycle phase groups and operation control. Added unified debug module. Started SIM module and infrastructure.

SUMMARY [S11 MAY 25-JUN 07](sprint-11.md)

* W1: (Mostly MEME work.) Research lokijs, lowdb, lodash, memoization, assertion, and trigger libraries
* W2: Research deterministic finite automata and libraries (xstate), reactive programming with streams (rxjs), stream computation, the actor model, distributed architectures, message brokering systems, and relation to behavior trees and utility AI.