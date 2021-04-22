PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S2101 JAN 11 - JAN 24**

* W1: Ramp up 2020. Draft of System Overview docs.
* W2: Script Engine review of patterns, issues, needed fixes

**SUMMARY S2102 JAN 25 - FEB 07**

* W1: Parse dotted object ref, expand args. Add keywords `prop`, `featProp`, `featCall` touse dotted object refs. Need to insert context into runtime in three or four places.
* W2: inject correct context for runtime.

**SUMMARY S2103 FEB 08 - FEB 21**

* W1: new keywords, compiler tech documentation
* W2: network/input design, keyword jsx assist

**SUMMARY S2104 FEB 22 - MAR 07**

* W1: refactor ursys for new code, ben key/jsx help
* W2: multinet design, start implement of directory. URSYS call bug found.

**SUMMARY S2105 MAR 08 - MAR 21**

* W1: URSYS debug remote-to-remote call, declare nofix because not needed with current data flow
* W2: Start implementing device routing and skeleton input system 

**SUMMARY S2106 MAR 22 - APR 04**

* W1: start client registration, DifferenceCache
* W2: CharControl, UDevice + DeviceSync start

**SUMMARY  S2107 APR 05 - APR 18**

* W1: CharControl, DeviceSub, Directory, Data Structure documentation
* W2: Device Define/Publish, Subscribe/Read Complete DR01!

**SUMMARY S2108 APR 19 - MAY 02**

* W1:
* W2:

---

# SPRINT 2108 / APR 19 - MAY 02

## APR 20 TUE - Look at DifferenceCache Aging

* [x] set char controller to 2 FPS (500ms)
* [x] set tracker to read 4 FPS (250ms)
* [x] confirm that this breaks

**HOW TO FIX**

I think we need a custom remove function for our inputs diffcache that is based on **aging**. But how to we age stuff?

A lot of today was answering random tech questions.

## APR 21 WED - DiffCache

* Figuring out **when to clear the buffer** is tricky, because different devices that can be grouped together  may have **different update rates**
* Also, there is a **fixed sim tick** that may be *FASTER* than the input rates.
* Not to mention that the devices are running on different start times. 

It could be that Sim registers as a device and has its SimRate as one of the shared values, so inputs can adjust themselves to it.

Some trigger possibilities:

* frame aging per entity probably works best
* remembering last value of getInput() might help too

Let's try the latter first.

How does FrameAging work? Well, I think it menas that everytime we are about to remove an entity, we check its age first. 

* [x] add `ageMax` to DifferenceCache
* [x] add ageMax check in `diffArray()` step 2
* [x] confirm it still works in Tracker

After several hours, the solution that works is:

* check that buffer is full during `diffBuffer`
* if full, then do normal diff
* if empty, then scan cMap for aged items and remove

There is an issue when **two controllers** are going, and they will merge into one ping-pong...one disappearsa and the other is valid, then vice versa. 

* [ ] the age is getting reset to 0 instead of being incremented

I'm not sure where my logic is messing up, but it's not working as expected. 

If there are TWO cFrames possible:

* what happens only one is available every other frame

  * cframe1 -> diffBuffer
  * cframe2 -> diffBuffer

  

## APR 22 THU - Buffering Again

It occurred to me last night that maybe **clearing the buffer** is something that can just never be done. We have to use the careful check every time. But no...

It turns out the solution was **make buffer its own class** because it really has nothing to do with the way DifferenceCache works. The new class is **StickyCache**.

---

# FUTURE QUEUE

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

