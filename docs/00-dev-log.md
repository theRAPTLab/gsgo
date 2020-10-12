

[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

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

**SUMMARY S18 AUG 31-SEP 13**

* W1: New FakeTrack progress, resurrect appserv architecture for pixiJS integration
* W2: Refit URSYS. Sprite and display list system architecture for clickable interactions

**SUMMARY S19 AUG 14-SEP 27**

* W1: Pool, MappedPool, Agent to DisplayObject, DisplayObject to SpritePool. Introduce testing modules.
* W2: Renderer, Sprite class, Asset Manager, Render Loop, APPSRV lazy loaded routes, URSYS hardening.

**SUMMARY S20 SEP 28-OCT 11**

* W1: DisplayObjects w/ actables (drag). Generator and Tracker. URSYS diagram+enable network calls.
* W2: Sim-driven rendering. X-GEMSTEP-GUI review+integration. URSYS + gsgo refactor. 

**SUMMARY S21 OCT 12 - OCT 25**

* W1: 
* W2: 

---

# December 1, 2020 Goals

an agent or agent template that can be created
static or faketrack controls

+ set the skin from a list of assets?
+ some way to load/save?
+ simple prop set like nectar count
  Possible Content Areas: Aquatic Ecosystem, Decomposition, Moths, and Water solutions

A good chunk of the next six weeks will be for just getting the UI to talk to the SIM engine, decoding. 

---

## OCT 12 MON - Rapid March toward Full Sim Cycle

There's a few things on my immediate list (from DEC 1 GOALS)

* [ ] port tab system from nextjs template to custom template
* [ ] study x-gemstep-ui data structures
* [ ] goal: working UI that can create scripts
* [ ] goal: working sim world
* [ ] goal: working fake track

### Porting Tab System

#### REVIEW: ADMIN-SRV VIEW SYSTEM

This is based on FlexBox, unfortunately, but that might not be so bad.

```
in page-blocks/URLayout:
<View> children, className
<Row>
<Cell>
<CellFixed>
theme-derived is what defines the page magic:
urScreenPage: flex, flexFlow column nowrap, height 100vh, overflow hidden
urScrollablePage: display flex, flexFlow column nowrap
	urScreenView: display flex, flexFlow colum nowrap, flexGror 1
	urApp: display block
```

### Speeding-up Compile

I suspected that the build system for GEM_SRV was double-compiling. When I looked at `wp.base.loaders.js` (our webpack configuration base) I saw both `babel-loader` and `ts-loader` compiling files one-after-the other. First Babel handles all the JS, then Typescript handles all the TSX. 

Long story short, by having `babel-loader` handle **both** js and typescript, the compilation drops from **29 seconds  to 7 seconds.** 

Changes made:

* in `wp.base.loaders`, changed the test for `babel-loader` to `/\.(jsx?|tsx?)$/` from just `jsx?`
* also comment-out the `ts-loader` test, since babel will be handling it all now
* in `.babelrc`, add  ` "@babel/preset-typescript"` to end of presets. 


---

BACKLOG
```
Renderer + Display Lists
[ ] implement/test entity broadcasts
[ ] how to integrate multiple display lists together?

Network:
[ ] design device persistant naming and reconnection between reloads
[ ] maybe use JWT to establish identities? 

Input:
[ ] Read Event List
[ ] Update Display Object from events that change things
[ ] Convert local interactions to Agent or Display Object changes
[ ] Write Event List

Runtime:
[ ] Create Agent Template
[ ] Instance Agent Template
[ ] Control
```
---

