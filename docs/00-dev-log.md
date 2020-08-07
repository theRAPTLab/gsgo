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

* W1

---

#### PROMPTING QUESTION FOR SPRINT 16

### Wed Aug 05

Where we left off last was 

* opcode design for conditionals - how to implement them in SMC
* implement condition in template - how to create the template call to install them?
* opcode event queueing mechanism for each stage - how to queue messages?
* per-agent event queue processing for each stage - how to process messages at runtime?

Insight: I can eliminate stackToScope to avoid the type errors

* [x] delete stackToScope() to ensure no type issues
* [x] break out `T_Condition` with methods
* [x] implement condition ops
* [x] test condition op `ifLT` with `program` to increment an agent prop

YAY! It seems to work!

### Thu Aug 06

 Now we need to implement **messages** that can be sent to an agent.

* [x] define a message object as a `name` and a `data` payload and create a class for it
* [ ] think through conditions: these are really `ConditionalSets` and `Interactions` 

For a first pass, I made an `AgentSet` class that implements:

```
class AgentSet 
  _types: string[]
  _test: T_Program
  _members: T_Agent[]
  setTest(test:T_Program)
  filter()
  members()
  interact()
```

This AgentSet holds the results of a test. Every member then **receives an event** to notify it of what happened. 

### Fri Aug 07

* [ ] Make the Condition object store AgentSet, TestProgram, ExecProgram
* [ ] Store Condition object using a unique hashable name based on signature in CONDITIONS
* [ ] During CONDITION_UPDATE, call all conditions and either `filter()` or `interact()`  to gather `members` and `pairs`
* [ ] At end of CONDITION_UPDATE, walk either `members` or `pairs` and **queue ExecProgram** in a **message**



