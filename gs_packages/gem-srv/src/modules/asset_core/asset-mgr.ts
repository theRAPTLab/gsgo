/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ASSET MANAGER

  ROLE:
    main API for requesting assets, including loading assets from a remote
    server

  OPERATIONS:
    Uses a single entry point: PromiseLoadAssets(url), where url is the
    location of an Asset Directory that has an Asset Manifest.

    When the promise completes, all assets in the manifest are available.

    To access a particular type of asset, use GetLoader('asset type')
    to retrieve a manager upon which you can get the resources by
    id or by name.

  CONCEPTS:
    The Asset Manager is responsible for retrieving and parsing the asset
    manifest, which is a JSON file that groups assets by type. Each group
    of asset entries is passed to a LOADER that knows how to handle that
    type of asset.

    Each LOADER is an extension of the base AssetLoader class, which
    knows how to load assets remotely and store them in a dictionary
    asynchronously. After everything is loaded, the dictionary can
    be access through methods like getAssetById() and so forth.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
// import { TAssetDef, TAssetType, TAssetLoader, TManifest } from 'lib/t-assets';
import { GS_ASSETS_ROUTE, GS_ASSETS_PATH } from 'config/gem-settings';
import SpriteLoader from './as-load-sprites';
import ProjectLoader from './as-load-projects';
import AssetLoader from './class-asset-loader';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ASSETM', 'TagGreen');
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOADER_DICT = new Map<TAssetType, TAssetLoader>();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let ASSET_LOAD_COUNT = 0; // used to detect multiple loads

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns true for supported loader types */
function m_IsSupportedType(entry: [TAssetType, TAssetDef[]]): boolean {
  const [asType] = entry;
  if (LOADER_DICT.has(asType)) return true;
  console.warn(`asset type ${asType} is not supported`);
  return false;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** retrieve the AssetLoader for a particular type of resource */
function m_GetLoaderByType(asType: TAssetType): TAssetLoader {
  const loadPromise = LOADER_DICT.get(asType);
  return loadPromise;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** save a loader instance in the loader dirctionary*/
function m_RegisterLoader(loader: TAssetLoader) {
  const asType = loader.type();
  LOADER_DICT.set(asType, loader);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given a manifest, load all asset types. this currently loads from the
 *  local directory in gs_assets.
 *  @param {string} subdir if set, relative to assets/
 */
async function PromiseLoadAssets(subdir: string = '') {
  if (ASSET_LOAD_COUNT > 0) {
    console.warn('PromiseLoadAssets() was called more than once, so aborting');
    return Promise.reject(new Error('asset loads > 0'));
  }
  // e.g. route = '/assets
  const route = !subdir ? GS_ASSETS_ROUTE : `${GS_ASSETS_ROUTE}/${subdir}`;
  const json = await AssetLoader.PromiseManifest(route);
  if (json === undefined) {
    const jsonErr = `ERROR: No asset manifest found at "${route}".\n\nTROUBLESHOOTING\n1. Are there assets in '${GS_ASSETS_PATH}/${subdir}?'.\n2. gsgo-settings.json has correct paths?\n3. gem-srv/config/*-settings overrides has correct paths?\n4. Does AssetServer have downloadable assets?`;
    UR.LOG.MissingAsset(jsonErr);
    console.error(jsonErr);
    return Promise.reject(jsonErr);
  }
  // grab the top-level keys of the manifest (e.g. sprites:[])
  // return only assets that are supported
  const assets = Object.entries(json).filter(m_IsSupportedType);
  if (DBG) console.group(...PR('loading', assets.length, 'supported assetTypes'));
  const promises = [];
  for (const kv of assets) {
    const asType = kv[0]; // avoiding array destructure because old typescript
    const asList = kv[1];
    // because manifest entries are relative to their directory, we have
    // to add subdir in so loader has correct URL

    // this url rewrite is no longer necessary because AsseLoader.PromiseManifest does
    // this automatically now
    // if (subdir)
    //   for (const e of asList) {
    //     e.assetUrl = `${subdir}/${e.assetUrl}`;
    //   }

    // create a promise for each asset entry that is loaded
    const loader = m_GetLoaderByType(asType as TAssetType);
    if (loader) {
      loader.queueAssetList(asList);
      promises.push(loader.promiseLoadAssets());
      if (DBG) console.log(`[${loader.type()}] loading ${asList.length} items`);
    } else {
      console.warn(`[${asType}] no loader for ${asList.length} items`, asList);
    }
  }
  if (DBG) console.groupEnd();
  ASSET_LOAD_COUNT++;
  return Promise.all(promises);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return the loader class for the given asset type */
function GetLoader(asType: TAssetType): any {
  return LOADER_DICT.get(asType);
}

/// TEST FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HACK: support ac-wizcore testing. do not use! */
function DBG_ForceLoadAsset(subdir) {
  ASSET_LOAD_COUNT = 0;
  LOADER_DICT.forEach((loader, name) => {
    loader.reset();
    console.log('resetting', name, 'assets');
  });
  return PromiseLoadAssets(subdir);
}

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// register for every type within this asset manager
m_RegisterLoader(new SpriteLoader());
m_RegisterLoader(new ProjectLoader());

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// basic API
export {
  GetLoader, // return loader instance by assettype (eg 'sprites')
  PromiseLoadAssets // loads all assets in directory from manifest
};
/// utilities
export {
  DBG_ForceLoadAsset // don't use this!!! unstable
};
