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

---

## S17 W1

With the scripting engine implemented, it is time to turn our attention to UX/UI. There has not been a lot of work on it since I started the script engine, so we are still starting from scratch. I am building out a sacrificial wireframe, based on Joshua's work!

Meeting with Joshua and Ben about the vision. Joshua reminded us of a lot of cool ideas (my paraphrasing):

>  GEMSTEP is not intended to be a replacement for Scratch and NetLogo, which are highly refined tools with their own strengths. 

> GEMSTEP's emphasis is on powerful foreground collaboration, using "modelling as a verb". Rather than create a simulation and turn it in, GEMSTEP models exist more in the moment of embodiment. The reasoning between students is done while they act things out, using GEMSTEP as the facilitator. Ideally, it enables fast iteration in a group over slow and deliberate coding in solitude.

> For example: A group consists of two kids acting as agents in the simulated space making other agents react to them. At the same time, two other kids are making annotations on what they're doing on top of that. And then they can play back what happens. The "Model Run is the first class citizen", from 1-2 minutes in length. The interface should allow kids to "run it again" to try different things, and choose when to save them. The Play/Rewind/Pause/Record interface is envisioned to allow that (it could be something else). This reminds me of "live replay" recording in game streaming; recording is always happening, and you can choose to save the replay buffer if you have done something cool.

NEXT STEPS from MEETING:

* Joshua is going to produce a "stable" version of the thought document for us.
* I am going to throw something together independently while Ben and Joshua work through it.
* I am hoping to make significant progress this week in getting more interactive up and running.

## WEDNESDAY - BURST 1/3

Let's review Joshua's document and start fleshing out more controls.

* I don't like the way I am overiding CSS in the components. There is a better way to do this but I forgot how MUI handles it. 









