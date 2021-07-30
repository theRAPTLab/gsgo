/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Assets are external media files or other file-based data. AssetCore
  provides a way to load assets during the UR/LOAD_ASSETS phase, wait
  for them to be completely loaded, and then make them available to
  other modules in the system through this module.

  Like DataCore and AppCore, this is a top-level module that can be
  imported by any other module without creating a circular dependency.

  The main asset manager code is in assetcore/asset-mgr.ts

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// import asset manager to initialize
export * from './asset-mgr';

/// ASSET LOADER CLASS/ ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The base class AssetLoader has this public API:
    type() - returns the type of asset managed by this loader
    hasAsset(name) - returns true if a named asset is managed by this loader
    lookupAssetId(name) - return assetId associated with a name
    getAssetById(id) - return the asset record
    getAsset(name) - return the asset record by name
    queueAssetList(assetList) - queue TAssetDef records to load
    promiseLoadAssets() - start the loading process
/*/

/// ASSET LOADERS/ ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The Asset Manager uses 'loader classes' to handle specific types of
    assets. Loaders are extensions of
/*/
