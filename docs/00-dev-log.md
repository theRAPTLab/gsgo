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

**SUMMARY S2115 JUL 26 - AUG 08**

* W1: Asset Manager Design, File Utilities Collection
* W2: Asset Server, Asset Client

**SUMMARY S2116 AUG 09 - AUG 22**

* W1: ?

---

# SPRINT S2115 - AUG 09 - AUG 22

## Project Review with Ben

The [issues list](https://gitlab.com/stepsys/gem-step/gsgo/-/issues) is automatically sorted by last updated. The [STUDENTS_MAY_CHANGE](https://gitlab.com/stepsys/gem-step/gsgo/-/issues/287) issue is showing script changes that need to happen as they are checked off.

My impression is that I have to do a systematic review of every feature to see what's going on.

We're basically **at the end** of the project cycle. We've done the 450 hours for Milestone 2. The remaining 600 hours is improving the experience. Noel **really wants video**, and they would be satisfied with just playing sprites over a video canvas.

On the Systems board, the `@Refactor` list is what we're going to hit.

I'd like to assay the difference between the starting engine and the current snapshots.

There are three things I want to look at:

* Finish the Asset Manager functionality
* Doing the engine review to see (1) what we learned about using it, scripting, features, keywords (2) technical engine review of what's changed since Sri handed it off.
* Engine Review - Writing documentation to help clarify or improve those experiences.
* GUI system review + analysis - what are the practices that Ben came up with to make things more usable?

Maybe I should **mark placeholder code**

Also helpful was when I **stubbed out pseudocode**. 

* Introduction to NetLogo and Scratch. Go to the sites and find something there. Self-guided tutorial might be a thing. 

## AUG 09 MON - Spends, Resuming with the Asset Manager

### Update Milestone 2 spends

* [x] update the timesheet to add issues specifically for it
* [x] add to any issue

### Asset Manager Resumption

This is the current outstanding to-do list from last sprint:

* [ ] request `assets/path-to-archive` and download the files there
  * [ ] zip file, download and uncompress into `runtime/cache` matching path
  * [ ] manifest, download everything into `runtime/cache`
* [ ] for loading corey's sprites, the use of nested folders means we have to work harder to extract a full manifest
* [ ] pixijs json files may have several images
* [x] PromiseLoadAssets() has changed
* [x] expandable asset server can have multiple asset typed served
* [ ] consider writing the generated manifest file to directory so it doesn't have to be generated all the time.

## AUG 11 WED - Asset Manager

* [ ] request `assets/path-to-archive` and download the files there
  * [ ] zip file, download and uncompress into `runtime/cache` matching path
  * [ ] manifest, download everything into runtime/cache
* [ ] for loading corey's sprites, the use of nested folders means we have to work harder to extract a full manifest
* [ ] pixijs json files may have several images
* [ ] consider writing the generated manifest file to directory so it doesn't have to be generated all the time (would require the hash differ)

* Make a `gs_assets_distrib` folder for testing.
* redirect asset server to it to test...works
* package the assetserver middleware

## AUG 16 MON - Asset Manager

* [ ] Fix `UseAssetServer_Middleware`
* [x] fix `PromiseLoadAssets()`
* [ ] fix `asset-srv` to use `LOCAL_ASSETS_DIRPATH`

Actually, since we want to move asset-srv to URSYS there's some additional work to do. 

* [x] simplify middleware by factoring out functions
* [x] new structure
  * [x] `util/files` can be imported by anyone
  * [x] `svc`- are for packet handlers
  * [x] `server-assets.js` for asset serving

## AUG 17 TUE - Asset Manager

We want to **replace** the middleware in `asset-srv` with middleware now in `server-assets` 

* [ ] make a copy in `server-asset`

Next:

* [ ] clean-up settings/configs
* [ ] add settings override
* [ ] add media proxying

