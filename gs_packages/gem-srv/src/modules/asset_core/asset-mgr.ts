/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ASSET MANAGER

  Manages 'AssetLoader classes' that manage assetTypes such as 'sprites',
  'sounds', etc.

  The main API is just two calls:

  * PromiseLoadManifest(url) - returns promise to load the manifest and
    tell each loader to load its portion.
  * GetLoader(assetType) - returns the loader instance for given type.

  See `class-asset-loader` for an example of host

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import {
  TAssetDef,
  TAssetType,
  TAssetLoader,
  TManifest
} from '../../lib/t-assets';
import SpriteLoader from './as-load-sprites';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ASSETS', 'TagRed');
const DBG = true;

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOADER_DICT = new Map<TAssetType, TAssetLoader>();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns true for supported loader types */
function m_IsSupportedType(entry: [TAssetType, TAssetDef[]]): boolean {
  const [asType] = entry;
  return LOADER_DICT.has(asType);
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

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a manifest, load all asset types */
export async function PromiseLoadManifest(manifestUrl: string) {
  const res = await fetch(manifestUrl);
  const json: TManifest = await res.json();
  const promises = [];
  const assets = Object.entries(json).filter(m_IsSupportedType);
  if (DBG)
    console.groupCollapsed(
      ...PR('loading', assets.length, 'supported assetTypes')
    );
  assets.forEach(([asType, asList]) => {
    const loader = m_GetLoaderByType(asType as TAssetType);
    if (loader) {
      loader.queueAssetList(asList);
      promises.push(loader.promiseLoadAssets());
      console.log(`[${loader.type()}] loading ${asList.length} items`);
    } else {
      console.log(`[${asType}] no loader for ${asList.length} items`, asList);
    }
  });
  if (DBG) console.groupEnd();
  return Promise.all(promises);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the loader class for the given asset type */
export function GetLoader(asType: TAssetType): any {
  return LOADER_DICT.get(asType);
}

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
m_RegisterLoader(new SpriteLoader('sprites'));

/// TEST INTERFACE ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
