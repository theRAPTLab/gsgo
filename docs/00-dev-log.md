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

* [x] make a copy in `server-asset`

* [x] clean-up settings/configs
  * [x] make gem-srv the local media server
  * [x] make asset-srv the proxy
  * [x] asset-srv is now **mcp-srv**

## AUG 18 WED - Asset Manager Proxying

* [ ] add settings override
* [ ] add media proxying

### Testing Proxying in GEMSRV

* [ ] case 1: `assets/dir`
  * does `dir` exist locally?
  * does `dir` exist on control server?
    * download dir

* [ ] case 2: `assets/dir?manifest`

  * follow case 1

  * run manifest code

    

* [x] case 3: `assets/dir/sprites/file.png`

  * does dir/sprites/file.png exist on control server?
    * download file and cache

Stream of consciousness

the setup is in `gem-app-srv` when the middleware is setup. Specifically it's `MediaProxyMiddleWare` for handling case 1 and 3, and `AssetManifestMiddleware` for handling case 2.

We have some existing code in **ursys/util/http-proxy**

* `ProxyMedia(req,res,next)` - uses its own `ParseRequest(req)` to extract varous parameters. We have duplicate code for this somewhere. 
* deduplicated code

**Q. How to use `ProxyMedia()`?**
A. 

Makes use of internal `mediapath` and `cachepath`. mediapath is the path-to-requested-file. cachepath is where the file is expected to be. For the asset server, cachepath is `gs_assets` which will be fulfilled by http download

always try to send the file with `res.send()` , but if it fails that means we need to download the file and then try again. That's what `u_Download(url,path,cb)` does, where **url** is the remote host/CDN and **path** is where the file should be written. On success `res.send()` is called again.

**Q. How to download a directory?**
A. AssetManifest_Middleware handles requests for manifests, so have it download manifest and use that to download files if it exists.

### August 19 Thu - Debugging

* [x] fetch exist dir --> serve-index!
* [x] fetch exist dir?manifest --> generate manifest!
* [ ] fetch non-exist dir  --> ??
* [ ] fetch non-exist dir proxy to existing host dir --> ??
* [ ] fetch non-exist dir proxy to non-existing host dir --> ??
* [ ] fetch non-exist directory?manifest --> ??
* [x] fetch exist file --> file
* [x] fetch exist file?manifest --> 400 bad request
* [x] fetch non-exist file --> 404 not found
* [ ] fetch non-exist file proxy to existing host file --> ??
* [ ] fetch non-exist file proxy to non-existing host file -->??
* [x] fetch non-exist file?manifest --> 400 bad request
* [ ] **dev-compiler** still works?

## AUG 20 FRI - Continuing

Where I left off:

* `localhost/assets/auto` should **not** trigger `ProxyMedia` because it already is on the server

* `ProxyMedia` is now requesting manifests in preparation of downloading everything to a directory, but it doesn't do that yet. This is the case when a **normal directory that does not exist on local** is read. The idea is that this triggers a directory download through the manifest. Individual files should just work.

* `AssetManifesst_Middleware` needs to handle **case 3** where manifest request for a non-existent directory is made; we want to download it from the remote.

  

### Disable ProxyMedia for local directory

* [x] in ProxyMedia, check if file already exists before continuing with proxy operation

### ProxyMedia: Download Files in Manifest

`http-proxy` needs to know how to download a manifest. This is handled by the code in `ProxyMedia()`

```js
if (DecodePath(path).isDir) {
      let manifest = await fetch(`${url}?manifest`).then(res => res.json());
      if (Array.isArray(manifest)) manifest = manifest.shift();
```

* [x] port `m_LoadManifest()` from `asset-mgr` to `ProxyMedia()`
* [x] test with `localhost/assets/manual` which isn't on local server

Manifest is:

```
{
  sprites: [
    {assetId, assetName, assetUrl}
  ]
}
```

* [ ] if manifest file exists, then should copy it



