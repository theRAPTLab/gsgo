## Asset Management Conventions

*drawing from class-pixi-asset-mgr.ts*

### Asset Manager Initialization

At load time, it invokes the different loaders for each registered asset type. Every asset type is handled by an asset handler class. 

```js
// The manifest JSON format so I think this can be extended 
{
  [type]: [ {assetId, assetName, assetUrl}, ... ]
  READ_ME: [ string, ... ]
}

m_GetLoaderByType(asType) {
	const loadPromise = LOAD_DICT.get(asType);
	return loadPromise;
}
m_PromiseLoadAssetType(asType) {
  const loadPromise = m_GetLoaderByType(asType);
  if (loadPromise) return loadPromise(asList);
  else return undefined;
}
RegisterLoader(asType, asLoaderFunc) {
	LOAD_DICT.set(asType, asLoaderFunc);
}
PromiseLoadAssets(json) {
  const promises = [];
  Object.entries(json).forEach( async ([asType,asList]) => {
    const loadPromise = GetLoaderByType(asType);
    if (loadPromise) promises.push(loadPromise(asList));
  }
  return Promise.all(promises);
}
GetAssetList(type:AssetType):
UR.HookPhase('UR/LOAD_ASSETS',PromiseLoadAssets);
```

### Asset Handler Classes

The base class will define something like this, which will be overridden by specifi 

``` typescript
type QueueItem = { assetId: number; assetName: string; assetUrl: string };
type AssetId = number;
type AssetName = string;
type AssetURL = string;
type Manifest = { sprites: QueueItem[] };

queueItem(id, name, url)
queueArray(assetList:QueueItemp[])
promiseLoadQueue()
loadManifestSync()
getAssetById(id:AssetId):PIXI.Texture
lookupAssetId(name:AssetName):AssetID
getAsset(name:AssetName): PIXI.Texture
getAssetList(): QueueItem[]
```

### Accessing Assets

* Each asset type (e.g. sprite, sound) has its own extension of the asset handler base clase
* AssetIds are unique across ALL asset types and are never reused. This is enforced by the Manifest Generator on the Server.
* Names are do not have to be unique across all assets though.
* Each asset manager has its own copy of `RESOURCE_DICT<id,resource>` and generates the id lookup for `AssetName` to `AssetId`
* The main asset fetch routine is `getAsset( id:AssetId )` and `getAssetByName( name:AssetName )`

So...**where to put the asset manager and classes?**...

Typescript Updates:

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

