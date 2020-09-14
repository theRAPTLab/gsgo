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

---

## SEP 14 MON: Implementation Plans

There's a lot of stuff to do:

```
[ ] Outline Data Commonalities between Classses
[ ] * Agent Instance Shared Display Object Properties
[ ] * Display Object Classes
[ ] * Sprite Classes
```
Let's outline these quickly as modules
```
SM_Object is the base class for all these things
	_value, meta.id, props, methods
class agent extends SM_Object, and has properties as SMObjects
	_x, _y, _skin, _name are SMObjects

What goes into 
represent idish


```


```
[ ] Generic Pool Class
	  * objects with ids map one array of objects to pool of mapped objects
	  * Pool has add, delete, and update methods
	  * Has one method: MapObjectsToPool( param ), returns added, deleted, updates list
```
Do this after looking at the data commonalities

---

BACKLOG
```[ ] Create DisplayObject Pool
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

