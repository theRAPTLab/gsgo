[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S21-01 JAN 11 - JAN 24**

* W1: Ramp up 2020. Draft of System Overview docs.
* W2: Script Engine review of patterns, issues, needed fixes

**SUMMARY S22-02 JAN 25 - FEB 07**

* W1: Script parser can now understands objrefs in block code at compiletime
* W2: Runtime engine injects objref context for block code at runtime

**SUMMARY S2103 FEB 08 - FEB 21**

* W1: new keywords, compiler tech documentation
* W2: network/input design, keyword jsx assist

**SUMMARY S2104 FEB 22 - MAR 07**

* W1: refactor ursys for new code, ben key/jsx help
* W2: multinet design, start implement of directory. URSYS call bug found.

**SUMMARY S2105 MAR 08 - MAR 21**

* W1: URSYS debug remote-to-remote call, declare nofix because not needed with current data flow
* W2:Start implementing device routing and skeleton input system 

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

---

# SPRINT 2109 / MAY 03 - MAY 16

## May 05 Wednesday - Recap

We released the first student-facing alpha a few days ago, and they ran a trial with two 5th graders. One kid was making games in something, a platformer. The other was also familiar with Scratch and was familiar with pond photosynthesis becasue they had just finished that unit the week or month before. Watching the video of the 1-hour session, had some observations

**On Kids**

* kids have humor, and automatically try to interact with things to see what they do. 

* one kid looked for the big go button. They want to try things, and the kids form strategies to cooperatively explore the space, but there's also a desire to be competitive because kids
* kids are quite comfortable with the concepts of fake life/death like cheerful killers :-)
* Setting up optimization and shortcut characters. Talking tactics. 
* It might be interesting to find out if kids play video games, and what platforms and games they like the most. This would give us some idea of what interactive conventions they may already be familiar with.
* kids like to figure out and control virtual environments.
* they like to run with a funny idea like fish haunting, and will try to whether the environment can be made to do it, or if they can strat their way around perceived limits.
* one of them played a game with themselves to overlay the fish perfectly.
* Brian was moving the mouse wanted to try setiting things up, gave mouse control via zoom
* talk of lasers and death things. Kirk used the phrase "add health"
* Fish Max is a weird name and it wasn't clear even to me what that meant. I assumed it counted fish. 
* one kids thought of it already as a game (kirk)
* one kid used the term "respawn", which is a term used in multiplayer games. Do they already have multiplayer online game experience at this age? 
* They set up an overlapping thing with different speed sunbeams to reason out things. 
* "take, give" was vocab.
* brian was interested in figuring out the power of the sunbeam and overlapping.
* Kirk suggested eating an algae in a sunbeam. Brian/Kirk suggested that flowers have some could like boost the sunllight or block the sunlight.
* kirk perceived the screen as a side view depth. Noted incosistent of flowers in the water. Made them lily pads. Fish bodies, "algae points" 
* kirk thought the fish were dumb because they didn't go for the algae. Brian saw the AI fish as a competitor to his fish. Kirk wanted a homing behavior if points drop. Brian had a notion of using fish in corners. 
* Kirk mentioned the term "easter egg" for death fish, which lead to an imaginative conversation between them.
* kids automatically correlated the server crash with something they were trying to do (speed up light beams) and were ready to avoid changing it again until Joshua told them not to worry about it. 


**User Interface Observations**

* It's hard to tell whether the sim is going or not because the run controls are spread out. 
* Even a small amount of interaction on the screen is enough for kids to test whether something is happening.
* Thinking that nice visual effects made accessible for alerting a change, increase/decrease brightness/continuous operaitons pulsing would be nice
* when looking at the property windows, the datalayout is pretty terrible. Also, they might just not know what some of those names mean.


**Technical Glitches and Observations**

* when one kids switched away from the browser to zoom, the controller buffering might not be long enough to prevent input changes. 

* moving the sim to the server may improve interactive responsiveness

* Using local storage to save settings like the stage setup

* Not sure what caused the server crash


**Researcher-facing Features**

* capturing button rollovers might be an interesting thing to grab?

* when sim is running, may need to lock the controllers from changes in some cases

## May 6 Thu - Reviewing Remaining Tasks

The GitLab issues that Joshua came up with is in [GEMSTEP Foundation Issues](https://gitlab.com/stepsys/gem-step/gsgo/-/boards/2274695)

* neat feature in Gitlab: use `/estimate` and `/spend` 

## May 7 Fri - Meeting Notes

### Remaining Project Dates

about 1050 hours

* 700 for 2021 / August Pilot, ( aquatic / decomposition units )
* 300 for 2022 Full 7 Model Study / February 1 ( 3 units at IU, 2 at VU )
* grant ends July 2022

### Immediate Next Steps

* Decomposer Script - Next Week
* Moth Script
* prioritize Issues
* scripting ui / pozy PTrack
* Set up a Round2 and Round3 milestone and split cards into the milestones



## May 10 Mon - TODO FOR MONDAY:

* initial discussion of the PRERUN cycles and visual updates
* physics feature

### Review with Ben

scriptengine and keyword system needs reviewing
come up with a list of code change highlights

top level goal

- set size of algae based on energy level
- property settings based on other properties
- how to perform expressions with properties
- how to set the calculated expression to another property

The overall goal technically is to make sure we can easily set properties and address object references

* in the current implementation, Physics is handling visual sizing 'costumeWidth', setting it based on 'width', 'height'

* would another manager that student could interact with
* something like an API level

* multiple bundle outputs from keywords - an extension!

remove convenience single-object / array checks

* try to make any scriptable behaviors, actions, etc handle only through property changes.
* if a GFeature requires a method call, that should the be hidden by the student GUI, which generates the appropriate script ode behind the scenes. 

## MAY 11 TUE - Prep for 

### I need to review all the current scripts before Wednesday

* [ ] the script called `spring2021pilot.js` is what they used
* [ ] make a list of awkward or unclear operations in the scripting

## MAY 12 WED - Meeting

Our current priorities

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



What Ben has in mind: Ben is going to continue refactor of project data, which is going along prety well. THen intent is to get some coverage for some other script features they need. He wants coverage of those script features first before going into GUI Script.

**Input System and PTrack System -**

Maybe I can write out architectural sketches:

* PTrack Sketchout

