

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

### Digging into X-GEMSTEP-GUI

First looking at the data structures.

## OCT 13 TUE - Next Steps on the GUI Integration

There's two things I want to do initially:

1. Figure of it it's possible to actually connect the current X-GUI to the script engine. It might be doable if we write replacements in the script engine.
2. Think of how I will actually save agent templates and agent instances, because this will be the structured data that the script engine ultimately has to read. I'd like to simplify the highly-coupled elements of the database structure and eliminate as many id-based operations needed to render the UI and instead make use of initial constraints to implicitly define scope.

I'll probably start with 2 first, and then maybe do the TAB SYSTEM afterwards. I think 2 is going to be the bottleneck for moving forward.

### Define Concepts

There are some concepts to nail down their definitions in the database too, so they conform to the internal script engine naming, which itself is strongly bound to the GEM-STEP specifications that were laid out. 

* There are only 4 main kinds of object in the system: Agent, Property, Variable, and Feature.
* Then there are two main kinds of context specifiers in WHEN conditions for agents: the TWO AGENT version and the SINGLE AGENT version. These limit what you can choose for follow-up filtering conditions on the left-side of the expression, though you can refer to agentsets of instances and individual instances I think.
* Then there are the global built-in time and simulation conditions.

Every one of the 4 main kinds of object in the system can expose its properties and methods, so these are what are used to populate dropdowns based on what the scoping object is. Then the selected dropdown object provides the next set of dropdowns, and so on.

### Prototype Advanced Visual Representations

I'd like to also design a representation of a real expression (as in algebraic) layout, though I don't think we can deliver this by December. It would be nice to know what it looks like. The minimum is how to represent parenthesis.

* [ ] how to save agent templates as a serializable format
* [ ] how to represent agent templates as a block-editable UI structure
* [ ] make a list of all the statement types in Whimsical
  * [ ] assignment
  * [ ] comparison
  * [ ] event
  * [ ] method invocation
  * [ ] arithmetic expression
  * [ ] code block
* [ ] make a list of all the SMObjects that can define the lead of something

#### LATE NIGHT KICKOFF

the question is where to put the script controller. Maybe somewhere in sim?

* [x] script...we need to figure some stuff out with the plan so switch to paper
* [x] in `converter` we're prototyping data structures...first
* [x] basic compiler pattern for defTemplate and defProp
* [x] basic render pattern for rendering source

This actually worked fairly well...there's a `CMD` data structure that has the keywords defined for the leading command, which includes **args** for syntax, **compile** for generating smc_code, **render** for generating JSX, and some **meta** for scope checking.

* How can we have all components **update their specific code** element?

  * the root statement holds a reference to an object that represents the line that it rendered
  * the root statement is responsible for drawing all its children, and uses the line to generate it
  * when a change occurs on a statement, the reference to the object is updated
  * when the object is updated in any way, the UI refreshes and forces the entire tree to draw
  * will this work?

* Each source line that walks also maintains a scope so subsequent commands can rely on it. This might not be necessary if the commands use full agent.prop addressing all the time; then we use the scope feature to know what parameters to use. ScopeIn and ScopeOut have to be carefully written for each CMD.

* **There is LEFT-to-RIGHT evaluation that happens for real commands.** For example:

  * refer to an agent instance or agent set
  * refer to an agentset global property (like count)
  * set an agent prop value to immediate or calculation group (expression)
  * copy an agent prop value
    * to another prop
    * part of a calculation group (via stack)
  * invoke an agent method or feature method to do something
  * perform a calculation on a property
  * perform an arbirary arithmetic calculation
    * immediate values
    * smobject prop values
    * available operators
  * compare a calculation to a property value or calculation
  * conditionally execute program if true or false

* for **interactions**, we have a complicated declaration

  

```
whenAgentSet filterCondition -> AgentSet to Iterate
  conditionProgram(for each agent)

filterCondition = [
  agentset conditionalTest
  agentset conditionalTest
]

whenAgentSet filterCondition creates a unique hash which stores the filter condition in a table of tests that are run early in the simulation cycle

whenTwoAgentSet filterTwoCondition -> AgentSet1, AgentSet2 to Iterate
```

## OCT 14 WED - more operations

We have the definitions section, which is easy, working OK. Now we need to express programs that can manipulate other things.

* [x] made the base class `SM_Keyword`, implemented `defTemplate`
* [x] implement `defProp`and `useFeature`
* [x] move the compiler and renderer functions into `SM_Keyword` as static methods
* [x] remove window tests, formalize converter.ts as a test module, move to tests

## Next Steps!

We want to start implementing the following keywords.

### handling properties and methods in agents

### handling arithmetic expressions and calculations

### handling arbitrary program blocks

### handling comparisons and conditional execution of programs

### handling interactions

### handling messaging between agents (queuing)

### handling system events (like tick)

### handling conditional triggers and trigger events







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

