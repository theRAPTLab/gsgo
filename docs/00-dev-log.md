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

* W1

---

## S16 W1

### Wed Aug 05 (summarized)

* Defined preliminary  `I_Comparator` type (class `SM_Comparator`) 
* Test a simple proximity test program with new opcodes for conditionals. 

YAY! It seems to work!

### Thu Aug 06 (summarized)

 Now we need to implement **messages** that can be sent to an agent.

* defined `message` object and properties (name, data)
* redefined `AgentSet` to be a "results container" class that is used by `SM_Comparator` . The idea is Conditions are stored in a Conditions Library and run during the `CONDITIONS_UPDATE` phase, and its stored tests are sent to `AgentSet` to do operations like **filter**, **interact** between 1 or 2 AgentTypes (defined as strings). The result is stored as **members** or **pairs**. The AgentSet can be reset afterwards so it can be run again. 

### Fri Aug 07

* [x] Make the Condition object store AgentSet, TestProgram, ExecProgram
* [x] During CONDITION_UPDATE, call all conditions and either `filter()` or `interact()`  to gather `members` and `pairs`
* [x] At end of CONDITION_UPDATE, walk either `members` or `pairs` and **queue ExecProgram** in a **message**

I did have to re-add `stackToScope` and jigger the typing. It's not ideal but I'm not sure how else to handle it.

DONE! First pass! There is no message filtering on the agents, so `agentSet.sendResults()` will invoke a new `Message` with type `'exec'` which will be shoved directly in the exec queue.

#### PERFORMANCE NOTES

50 flower agents will bring it down for pairwise-filtering, so we will have to write some custom tests for that. 100 flower agents kills the pairwise filtering altogether. For simple filtering, we can do 100 agent instances, each filtering the entire set of 100 agents 100 times(10,000 iterations) for a total of 100,000 iterations. In practice, we will not have that many filtering operations running so performance might be better.

#### NEXT?

* [ ] Store Condition object using a unique hashable name based on signature in CONDITIONS

## S16 W2

I'm at the point where I need to document the system so Ben can use that. I'll start by reviewing the old diagrams and seeing what needs to be added to it.

* [ ] look at the new files in sim, and copy to hierarchy
* [ ] add new classes to the other one
* [ ] make a diagram explaining the script engine

As I'm going through the documentation, I see the need to blueprint the various kinds of programs in the system, and designate homes for them.

* Reviewed the diagrams and wrote some starter docs for the main StackMachine objects, **documenting each class method** and making **a list of all the opcodes**.

Here's a list of **possible oversights** that I noticed:

* What I am calling "SM_Conditional" in SM_State is not quite accurate. It might be better named "SM_Comparator"
* the props and methods map are used to store only *scriptable* methods.
* Features are called with `decorate()` when an Agent is executing its `addFeature()` code. This code adds Props to a `props[featureName]` property containing a `DictionaryProp`, and the `prop()` method is overriden to dig the property out of the passed agent. 
* Feature also implements `prop()` and `method()` differently; since features are not part of an object, they must receive the object. 
  *  `prop()` returns the key of the stored Dictionary object
  * `method()`  returns the local method of the feature, not the agent's method.
* Should I move `exec_smc` to `SM_Object`?  NAH
* I should rename interfaces from `T_State` to `I_State`, and so on. This is more standard (and more correct, though Interfaces can be used as Types when specifying type values.)

### Wednesday Aug 12

Updated System Diagrams

* [Module Hierarchy DR04](https://whimsical.com/VZqkMQLW4STPG4bj4nLqq3)
* [System Types DR04](https://whimsical.com/B4iVN3UN9tsWq86QczhftA)
* [System Flowchart DR04](https://whimsical.com/3VUjwb6zxn1FkRYUtFmwZ4)
* [System Phases DR04](https://whimsical.com/Hd6ztovsXEV4DGZeja1BTB)

