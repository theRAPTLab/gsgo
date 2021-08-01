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

### Asset Manager Org

We have a new `asset_core` directory. This is where the main `asset-mgr` module lives, as well as the `class-asset-loader`  that is used as a base class for specialty loaders.



