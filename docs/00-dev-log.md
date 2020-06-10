[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S11 MAY 25-JUN 07**

* W1: (Mostly MEME work.) Research lokijs, lowdb, lodash, memoization, assertion, and trigger libraries
* W2: Research deterministic finite automata and libraries (xstate), reactive programming with streams (rxjs), stream computation, the actor model, distributed architectures, message brokering systems, and relation to behavior trees and utility AI.

---
## June 08 - Pushing into Implementation

I will probably use **xstatejs** and **rxjs** in the simulation engine. I decided though to keep the lifecycle engine from EXEC, since it already works well and is easier to understand as-is.

* [ ] ~~todo: make a stream observable model~~
* [x] install xstate and rxjs
* [ ] ~~define simloop as a machine?~~
  NO...the promise-based system we're using works better
* [x] extract `class-phase-machine` from EXEC
* [x] use `PhaseMachine` in `EXEC`
* [x] clean up PhaseMachine so semantics of invoking a phase (as opposed to an op) will fire on start and end. This might be useful for monitoring.

PhaseMachine gives us the ability to manage our game loop using the same logic as EXEC. 

* [x] simloop `Initialize()` creates a GameLoop PhaseMachine and passes to modules that will use it.

## June 09 - Wiring in Agent

It occurs to me that the tick function might better be handled in SIM rather than APP level. So let's move that functionality out so we can control rate within sim. We can then update PhaseMachine to use an RxJS observable.

* [x] cleanup: client-side UR libraries -> URLibName, LibName, ClassName
* [x] cleanup: server-side UR libraries -> NAME (module convention), ClassName
* [x] cleanup: conform module names, remove dead modules

**Move UPDATE out of URExec**

* [ ] remove DOM_ANIMFRAME from URExec
* [ ] PhaseMachine might accept hardcoded events `RESET` and `NEXT`, etc.
* [ ] remote timer code from the 
* [ ] convert timer code to stand-alone module using RxJS
* [ ] does sim startup still?











