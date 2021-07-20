[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S2109 MAY 03 - MAY 16**

* W1: Break cont'd. CodeReview of May Pilot. Meeting with Researchers
* W2: Meeting followup. Discussions on Feature and Phases.

**SUMMARY S2110 MAY 17 - MAY 30**

* W1: ifExpr bug
* W2:Fix underlying "block chaining" bug in script-parser

**SUMMARY S2111 MAY 31 - JUN 13**

* W1: Ponder GraphQL with overall server needs.
* W2: Locale system design

**SUMMARY S2112 JUN 14 - JUN 27**

* W1: Mini Rounds Discussion. URDB+GraphQL+Loki design
* W2: Matrix Math Review. Data structures for Locale.

**SUMMARY S2113 JUN 28 - JUL 11**

*  W1: Pozyx review, GraphQL client, State Change Proto
* W2: Appstate-React, AppCore definition and conventions

**SUMMARY S2114 JUL 12 - JUL 25**

* W1: Refine AppCore conventions, document, debug
* W2: ScriptEngine Confirmation of ScriptUnit paths

---

## JUL 12 MON - Review With Ben

* color modulation for #157
* script editor needs to handle blocks
* how to formalize how to handle image assets #236
* the date: 
  * **August 2nd** (Vanderbilt, IU) - (MOTHS)
  * full pilot for IU **August 9** , soft pilot: IU **September** (FISH, ALGAE)
* make a module import document for Ben
* look at merge requests since 113 to get an idea
* Vanderbilt: candidate script is moths-sandbox branch

## JUL 13 TUE - Bug Fixes

* [ ] make sure that database is loading correct data on start

The issue is that when the localeID changes, we need to do several things:

1. set state.localeID
2. load ptrack data into state.transfor

```
agents
features
globals
inputs
interactions
named-methods
project
render
script-bundle
script-engine
sim
varprops
```

## JUL 14-15 - Bug Fixes Continued

The StateGroupMgr needed some refinements and best practices refined, but it appears to work now.

* appcore modules are allowed to mutate its state directly, but it is then responsible for sending the correct updates
* updateKey does **NOT** automatically use the change and effect hooks, nor does it notify. That functionality is provided only as part of the static class methods; it's up to the module to implementing the behind-the-scenes state management related to database loads and inter-related data.
* updated section in [modularity docs](01-architecture/02-modularity.md)

Everything SEEMS to work. Let's give it a try.

## JUL 19 MON - Script Engine Review

There is an issue with the SCRIPT WIZARD being **unable to render block scriptunits**. So I need to make sure ScriptUnit formats are as they seem.

## JUL 20 TUE - Script Engine Point-by-Point

Q. Does TextifyScript produce an all-scriptUnit output?
A. 
