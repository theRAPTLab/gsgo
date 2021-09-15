/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ASSET MANAGER

  Manages 'AssetLoader classes' that manage assetTypes such as 'sprites',
  'sounds', etc.

  The main API is just two calls:

  * PromiseLoadAssets(url) - returns promise to load the manifest and
    tell each loader to load its portion.
  * GetLoader(assetType) - returns the loader instance for given type.

  See `class-asset-loader` for an example of host.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import {
  TAssetDef,
  TAssetType,
  TAssetLoader,
  TManifest
} from '../../lib/t-assets';
import SpriteLoader from './as-load-sprites';
import { GS_ASSETS_ROUTE } from '../../../config/gem-settings';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ASSETM', 'TagGreen');
const DBG = true;

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOADER_DICT = new Map<TAssetType, TAssetLoader>();
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

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility function to load manifest from a constructed route of the form
 *  http://host:port/assets/subdir
 */
async function m_LoadManifest(route) {
  const url = `${route}?manifest`;
  console.log(...PR('loading', url));
  let json: any;
  try {
    json = await fetch(url).then(async response => {
      if (!response.ok) throw new Error('network error');
      let js: TManifest = await response.json();
      if (Array.isArray(js) && js.length > 0) {
        if (DBG) console.log('converting json array...');
        js = js.shift();
      }
      return js;
    });
    if (DBG) console.log(...PR('success', json));
    return json as TManifest;
  } catch (err) {
    // console.warn(err);
    json = undefined;
  }
  return json;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a manifest, load all asset types. this currently loads from the
 *  local directory in gs_assets.
 *  @param {string} subdir if set, relative to assets/
 */
export async function PromiseLoadAssets(subdir: string = '') {
  const route = !subdir ? GS_ASSETS_ROUTE : `${GS_ASSETS_ROUTE}/${subdir}`;
  const json = await m_LoadManifest(route);
  if (json === undefined) throw Error(`can't load manifest at route "${route}"`);
  // grab the top-level keys of the manifest (e.g. sprites:[])
  // return only assets that are supported
  const assets = Object.entries(json).filter(m_IsSupportedType);
  if (DBG) console.group(...PR('loading', assets.length, 'supported assetTypes'));
  const promises = [];
  for (const kv of assets) {
    const asType = kv[0]; // avoiding array destructure because old typescript
    const asList = kv[1] as Array<TAssetDef>;
    // because manifest entries are relative to their directory, we have
    // to add subdir in so loader has correct URL
    if (subdir)
      for (const e of asList) {
        e.assetUrl = `${subdir}/${e.assetUrl}`;
      }
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
  return Promise.all(promises);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the loader class for the given asset type */
export function GetLoader(asType: TAssetType): any {
  return LOADER_DICT.get(asType);
}

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// register for every type
m_RegisterLoader(new SpriteLoader('sprites'));

/// TEST INTERFACE ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
