[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S2108 APR 19 - MAY 02**

* W1: GetInput API, DiffCache Buffer Mode
* W2: Notification, start break.

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
*  W2: Appstate-React, AppCore definition and conventions

**SUMMARY S2114 JUL 12 - JUL 25**

* W1: Refine AppCore conventions, document, debug
* W2: ScriptEngine Confirmation of ScriptUnit paths

**SUMMARY S2115 JUL 26 - AUG 08**

* W1: Asset Manager Design, File Utilities Collection
* W2: Asset Server, Asset Client



---

# SPRINT S2115 - JUL 26 - AUg 08

## JUL 28 WED - Designing the Asset Manager

The design is in [architecture/urfile](01-architecture/01-urfile.md). This is the complete design, more or less, in draft form. 

## JUL 29 THU - Where to start with the asset manager.

The essential function is to load an asset manifest from a directory. So the initial feature list:

* [x] look at the asset manager right now and outline it a bit. It's in `class-pixi-asset-mgr.ts`

Typescript Updates to consider (didn't update)

* [ ] `typescript` 4.0.3 --> 4.3.5
* [ ] `@typescript-eslint/eslint-plugin` 4.4.1 --> 4.28.5
* [ ] `@typescript-eslint/parser 4.4.1` --> 4.28.5
* [ ] `eslint-config-airbnb-typescript` 11.0.0 --> 12.3.1

## JUL 30 FRI - Asset PIXI Manager

We now have `mediacore` available. This is where the new `asset-mgr` module lives

The old system worked like this:

1. root view (e.g. `DevCompiler`) calls `loadAssetsSync(jsonfile)` during `UR/LOAD_ASSETS`
2. Sprites are implemented with `class-visual`  which uses `PIXI` . The asset manager for class visual stores `PIXI.Resource` things like textures that can be retrieved. `setTexture()` is called from `api-render` as dobj is converted to vobj

The new system should hopefully be a drop-in replacement for the GLOBALS pixi asset mgr.

* [x] can I get asset manager to load in DevCompiler? YES
* [x] class Visual: GetAssetById(id)
* [x] class Visual: GetAsset(name)
* [x] class Visual: LookupAssetId(name)

## JUL 31 SAT - Asset PIXI Manager Replacement

Took a while to clean up the asset loader independent class, but we have the system in place now. 

Need to make sure AssetLoader saves responsibly by updating the assetRecord instead of completely overwriting it

## AUG 05 THU - Simple Server

To **autogenerate a manifest**, we first want to add an archive server. I'm going to build this into the current server so Digital Ocean can serve as the master contoller at some point. This is the **beginning of URNET WAN** support!

At the very basic, we need another express server with its own database that provides the following features:

* [x] query directory for listing or use `serve-index`
* [x] for the `assets/` route, drill-down into a path and return a manifest if it's a directory, a zip file if it's a file
* [x] For manifests, if there is no manifest generate one. If there is a manifest, then use that.
* [ ] If there is more than one manifest, all of them will be applied additively in alphabetical order

Then we want the GEMSTEP side to

* [ ] request `assets/path-to-archive` and download the files there
  * [ ] zip file, download and uncompress into `runtime/cache` matching path
  * [ ] manifest, download everything into `runtime/cache`

### STREAM OF CONSCIOUSNESS

* [x] made `gs_packages/asset-srv` by copying files from `gem-srv` startup.

* [x] added `ASSET_PATH` and `MANIFEST_FILE` to **config/gem.settings.js**

* [x] Changed `PromiseLoadManifest()` call to accept a filepath, which will be relative to the `gs_assets` directory
* [x] Modify PromiseLoadManifest() to ge relative to gassets

* [ ] Tried to load a default SVG sprite but PIXI is proving obtuse

## AUG 06 FRI - Simple Asset Cache

Picking up from yesterday: Let's **read a manifest** and compare them!

* [x] copy sprites to `dsriseah.com/public/gemstep_assets`
* [x] look for hash utility: using `hasha` with MD5 for file revving
* [x] handle detection of `?maniest` query in express

## AUG 07 SAT - Asset Manager Server

Asset manager is serving automatic manifests now, but for some reason automatic manifests create a problem.

**TODO**

* [ ] for loading corey's sprites, the use of nested folders means we have to work harder to extract a full manifest
* [ ] pixijs json files may have several images
* [x] PromiseLoadAssets() has changed
* [x] expandable asset server can have multiple asset typed served
* [ ] consider writing the generated manifest file to directory so it doesn't have to be generated all the time.

