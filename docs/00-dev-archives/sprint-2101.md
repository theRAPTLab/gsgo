[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S20 SEP 28-OCT 11**

* W1: DisplayObjects w/ actables (drag). Generator and Tracker. URSYS diagram+enable network calls.
* W2: Sim-driven rendering. X-GEMSTEP-GUI review+integration. URSYS + gsgo refactor. 

**SUMMARY S21 OCT 12 - OCT 25**

* W1: fast compile. source-to-script/ui compilers.
* W2: researched and integrated arithmetic expressions

**SUMMARY S22 OCT 26 - NOV 08**

* W1: Parse/Evaluation, Source-to GUI and SMC, GUI compiler API
* W2: Tokenize, GUI for ModelLoop, script-to-blueprint-to-instance

**SUMMARY S23 NOV 09 - NOV 22**

* W1: Save/instance agent blueprint, runtime expression evaluation
* W2: Start conditions, start a second gemscript tokenizer for blocks

**SUMMARY S24 NOV 23 - DEC 06**

* W1: handle multiline blocks, agentset and event conditions
* W2: finalize event conditions, delivery, break

**SUMMARY S25 DEC 07 - DEC 20**

* W1: Port FakeTrack/PTrack into GEMSRV
* W2: Simplify agent prop, method, features for use by non-Sri peeps
* W2.1: Prep for Dec 23 demo, review features with Ben

**SUMMARY S21-01 JAN 11 - JAN 24**

* W1: Ramp up 2020. Draft of System Overview docs.
* W2: Script Engine review of patterns, issues, needed fixes


---

# SPRINT 21-01

## JAN 19 TUE - Ramping up on scripting

Starting scripting improvement in `feat/script-x`

## JAN 20 WED - Reviewing Scripting

Ben and I spent about 4 hours through the interactive scripts and puzzling out best practices/identifying weaknesses thatwe needed to fix for the team

## JAN 21 THU - Summarizing Scripting Problems

I outlined the isues with script engine in [this issue comment](https://gitlab.com/stepsys/gem-step/gsgo/-/issues/14#note_491240983). 

## JAN 22 FRI - Outlining Scripting Changes to Do

Yesterday I outlined the issues and made a few other issues. I'd like to move on to FAKETRACK and INPUT stuff next week, so what can I do THIS WEEK that will help Ben and the researchers out the most?

## JAN 23 SAT - Review Code Affected by Key Scripting Changes

There are four things to look at:

* [ ] how to do the object dot references
* [ ] adding new `prop`, `do`, and `call` keywords
* [ ] how to set context per program phase
* [ ] how the execution module might look

### Object Dot References

There are two parsers. We want the script tokenizer one, not the expression one. That is `class-gscript-tokenizer`.  This is based on **jsep** that's been changed to scan our script format **line-by-line** returning an array of character-based tokens. There are some problems with the multiblock scanner (see comments for `gscript-tokenizer`)

So what does it handle?

* gemscript extension: directives (#) returns 
* gemscript extension: [[ ]] and {{ }}
* numeric literal `isDigit`
* string literal `isQuote`
* identifiers: `isIdentifier` and not a unary op





---

**ADDITIONAL THINGS TO IMPLEMENT**

+ set the skin from a list of assets? - good
+ some way to load/save? - make cheese API to save a file (port)
  + include both templates and instance list
+ simple prop set like nectar count - we have
+ get faketrack integrated into Movement feature
+ spawn list for instancing
+ how to show the selection dropdown for each type
+ Target Content Areas
  + Use Fish/Algae content area to model: x-gemscript (aquatic_blueprints001.gs)
  + If we get done, move to blueprints002.gs (advanced)

* After I get OnTick working as the basic scriptevent in the user event system, will outline what's in the current engine as of today for the team, with an eye toward using this a foundation for introducing how to write simulations with it (a kind of informational and concise primer?) Then afterwards document the most recent things.

**TODO** AFTER ALPHA DEC 1

* **parameter passing** between scripts is kind of ambiguous, because of the number of execution contexts. Need to document all the execution contexts and try to make sense of it.
* no **filter result caching** in place yet
* no real tests implemented yet
* combine test functions into functions table, require that name begins with TEST_AB, TEST_A, or TEST
* the state object needs to have its **context** loaded so this values are available at runtime. How do we insert it before it runs? Maybe 
* provide a better debug output experience
* make sure that Agent blueprint inheritance is implemented
* `queueSequence [[ ]] [[ ]] [[ ]] ...`
* `on TimeElapsed 1000 [[ ... ]]`

**BACKLOG**

```
Renderer + Display Lists
[ ] implement/test entity broadcasts
[ ] how to integrate multiple display lists together?
[ ] finalizing coordinate system
[ ] bring back location

Network:
[ ] design device persistant naming and reconnection between reloads
[ ] maybe use JWT to establish identities? 

Input:
[ ] Read Event List
[ ] Update Display Object from events that change things
[ ] Convert local interactions to Agent or Display Object changes
[ ] Write Event List
[ ] Important formal input mechanisms
[ ] Asset capture 

Observations:
[ ] NOTE: The difference between PhaseMachine and messages synchronicity
[ ] extension: text script format `[define]` to output a define bundle, etc

Conditional When Engine:
[ ] slow...speed it up

Persistant Data
[ ] server?
[ ] assets?
[ ] bundle-based asset management outside of git?
[ ] handle app packaging, asset packing, identitifying groups, students, orgs that it belongs to. 

```

---

