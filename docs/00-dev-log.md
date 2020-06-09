[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S11 MAY 25-JUN 07**

* W1: (Mostly MEME work.) Research lokijs, lowdb, lodash, memoization, assertion, and trigger libraries
* W2: Research deterministic finite automata and libraries (xstate), reactive programming with streams (rxjs), stream computation, the actor model, distributed architectures, message brokering systems, and relation to behavior trees and utility AI.

---
## June 8 - Rushing into Implementation

I need to start resolving some of these open questions. My immediate focus from the end of last week

**Let's make a representation of the Super Agent** - this is the thing that holds agents. The Super Agent is the home of all data observables.

* [ ] todo: make a stream observable model

**For now, we'll just try to make a representation that uses (1) state charts and (2) observables inside of  `_sim_main`**

* [x] install xstate and rxjs
* [ ] ~~define simloop as a machine?~~
  NO...the promise-based system we're using works better
* [x] define simloop as promise loop similar to exec















