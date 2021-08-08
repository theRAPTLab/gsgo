/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ASSET MANAGER

  Manages 'AssetLoader classes' that manage assetTypes such as 'sprites',
  'sounds', etc.

  The main API is just two calls:

  * PromiseLoadAssets(url) - returns promise to load the manifest and
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
import {
  ASSETS_HOST,
  ASSETS_ROUTE,
  MANIFEST_FILE
} from '../../../config/gem.settings';

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
/** given a manifest, load all asset types. this currently loads from the
 *  local directory in gs_assets.
 *  @param {string} subdir if set, relative to assets/
 */
export async function PromiseLoadAssets(subdir: string = '') {
  const route = !subdir ? ASSETS_ROUTE : `${ASSETS_ROUTE}/${subdir}`;
  const url = `${ASSETS_HOST}/${route}?manifest`;
  console.log(...PR('fetching', url));
  let res = await fetch(url);
  let json: TManifest = await res.json();
  console.log(...PR('got json', json));
  if (Array.isArray(json) && json.length > 0) {
    console.log('converting json array...');
    json = json.shift();
  }
  const promises = [];
  const assets = Object.entries(json).filter(m_IsSupportedType);
  if (DBG) console.group(...PR('loading', assets.length, 'supported assetTypes'));
  assets.forEach(([asType, asList]) => {
    // because manifest entries are relative to their directory, we have
    // to add subdir in so loader has correct URL
    if (subdir)
      asList.forEach(e => {
        e.assetUrl = `${subdir}/${e.assetUrl}`;
      });

    const loader = m_GetLoaderByType(asType as TAssetType);
    if (loader) {
      console.log('aslist', asList);
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
