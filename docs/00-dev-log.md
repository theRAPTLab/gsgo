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

* W1: GetInput API, DiffCache Buffer Mode
* W2: Notification, start break.

**SUMMARY S2109 MAY 03 - MAY 16**

* W1: Break cont'd. CodeReview of May Pilot. Meeting with Researchers
* W2: Meeting followup. Discussions on Feature and Phases.

**SUMMARY S2110 MAY 17 - MAY 30**

* W1: ifExpr bug
* W2:Fix underlying "block chaining" bug in script-parser

**SUMMARY S2111 MAY 31 - JUN 06**

* W1: 

---

# SPRINT 2111 / MAY 31 - JUN 06

## August Pilot Priorities

* Tinting Feature
* Spawning Feature
* Script Wizard UI
* Line Graph Widget
* Differentiated render view
* PTrack cursor
* Creation/Spawning
* Sim on Server
* Multihost URNET
* How to measure socket backpressure

### Specific Systems

* Design the Locale System
* Vector Math
* State System
* Time Sequencing Systems and Expression in the Script Engine
* Mini Rounds
* Zero-config URNET/AppServer

### Research / Design

Review this list on Monday with Ben to make sure this is on the right track...this thinking.

* review lightweight component library thi.ng/umbrella
* how to manage mini rounds?
* how to manage timers? the `every` keyword, in particular, how to delay before start, doing things periodically

## MAY 31 - Sprint 2111 Ramp up

* add a SRI label for project stuff initially to show what I'm looking at/interested in.
* make sure issues I'm working on are part of the upcoming milestone (use filtering on the board to set this)
* bill exploring "what is new in the code" to the appropriate Sri Task issue; there's a catch-all Refactor/Dehackifying/Cleanup issue
* make my own dev continuity and store it somewhere,
* try to figure out a way of capturig information that is immune to underling code changes/renaming (intent?)
* instead of using issues as something to be compelted, but saying where to direct my attention and let curiousity touch whatever needs touching. 
* Ping Ben when I start looking at code he's written. I might start with an intent.

