/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SPRITE ASSET_CORE LOADER for ASSET MANAGER

  Extends AssetLoader with additional Sprite-related information

  * getSpriteDimensions(idOrName)
  * getTextureInfo(idOrName)

  Provides custom PIXIJS loader tool in the override of promiseLoadAssets().
  Overrides queueAssetList() to add additional parameter validation (this
  probably isn't necessary.

  See `class-asset-loader` to see the underlying utility methods.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as PIXI from 'pixi.js';
import AssetLoader from './class-asset-loader';
import { TAssetDef, TAssetType } from '../../lib/t-assets';
import { GS_ASSETS_ROUTE } from '../../../config/gem-settings';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AS-SPRITE');
const ASSET_URL = `${GS_ASSETS_ROUTE}`;
const DBG = false;

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetResourceType(resource: PIXI.LoaderResource): string {
  const rtype = resource.constructor.name || 'UnknownType';
  return rtype;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SpriteLoader extends AssetLoader {
  _loader: PIXI.Loader;
  _loadCount: number;

  /** please initialize queue mechanism through super(type) */
  constructor(assetType: TAssetType) {
    super(assetType);
    console.log(...PR(`creating ${assetType} loader instance...`));
    this._loader = new PIXI.Loader();
    this._loadCount = 0;
    this._loadProgress = this._loadProgress.bind(this);
    this._loader.onProgress.add(this._loadProgress);
    this._loadComplete = this._loadComplete.bind(this);
    this._loader.onComplete.add(this._loadComplete);
  }

  /// INHERITED FROM ASSETLOADER BASE CLASS ///////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ NOTE: you can refer to an asset either by id or name. The id is unique
      across all loaders, but the name is unique only within their loader.

      The base AssetLoader class manages the dictionary storage and lookup for
      you with these methods:

      * type() - returns the asset type (e.g. 'sprites')
      * hasAsset(name) - return true if asset w/ name
      * hasAssetId(id) - return true if asset w/ id
      * lookupAssetId(name) - return id associated with name

      When retrieving and storing asset records, these are in the form of
      TResource which looks like { assetId, assetName, assetURL, ?rsrc, ?error }

      * getAssetById(id) - return asset record for id
      * getAsset(name) - return asset recod for name

      These special protected methods are used to add an AssetDefinition to a
      queue managed by the AssetLoader base class:

      * _queueAsset(id,name,url) - add an AssetDef to the queue
      * _nextAsset() - return the AssetDef at the top of queue, removing it
      * _saveAsset(assetDef, rsrc, ?error) - save the loaded rsrc
      * _unloadAsset(name) - remove asset by name to release memory
      * _unloadAll() - remove all assets in the dictionaries, resetting

      Subclassers use these methods to implement asset-specific loader code,
      making use of the queue methods listed above"

      * queueAssetList(asList) - optional override. Queue a list of AssetDefs
      * promiseLoadAssets() - must override. return promise for loading queue

      It's presumed that all assets have a name, an id assigned by the Asset
      Manifest, and a URL that points to the resource on-disk or on an http
      server.
  /*/

  /// LOADER-SPECIFIC METHOD OVERRIDES and METHODS ////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** override this method to write custom asset list queue */
  queueAssetList(assetList: TAssetDef[]) {
    assetList.forEach(item => {
      const { assetId, assetName, assetUrl } = item;
      if (typeof assetId !== 'number') throw Error('bad/missing assetId in list');
      if (!(assetId && assetName && assetUrl)) throw Error('bad asset list');
      const remoteUrl = `${ASSET_URL}/${assetUrl}`;
      this._queueAsset(assetId, assetName, remoteUrl);
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** override this method to implement own loader. should return a promise
   *  that will be added to an array of Promises to exist during ASSET_LOAD
   */
  promiseLoadAssets(): Promise<TAssetDef[]> {
    const i = this._loadCount;
    if (DBG) console.log(...PR(`[${i}] loading ${this._queue.length} items...`));
    // define function to return wrapped in promise
    const loadAssets = (resolve: Function, reject: Function) => {
      if (this._loader.loading) {
        const batch = this._loadCount;
        console.warn(`error: batch [${batch}] is still loading`);
        reject();
        return;
      }
      // (1)
      // pop queued assets and add to the loader queue
      let item: TAssetDef = this._nextAsset();
      while (item !== undefined) {
        this._saveAsset(item); // write stub without resource to lookup later
        const { assetName, assetUrl } = item;
        this._loader.add(assetName, assetUrl);
        item = this._nextAsset();
      } // end while

      // (2)
      // now start PIXI loader, which will callback when it's loaded
      this._loader.load(load => {
        const resources = [...Object.entries(load.resources)];
        resources.forEach(kv => {
          const [assetName, rsrc] = kv;
          const assetId = this.lookupAssetId(assetName);
          if (assetId === undefined) {
            // note: PIXIJS sprites may report multiple resources for a single
            // loaded asset, so we skip those that aren't in the dictionary
            // because we trust PIXIJS to hold on to those as part of the
            // main sprite resource we are saving.
            if (DBG) console.log(`...asset subresource ${assetName} skipped`);
            return;
          }
          this._saveAsset({ assetId, assetName }, rsrc);
        });
        ++this._loadCount;
        resolve(this);
      });
    };
    return new Promise(loadAssets);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** callback for PIXI loader to show current load progress */
  _loadProgress(loader: PIXI.Loader, resource: PIXI.LoaderResource) {
    const { name, url } = resource;
    const rt = m_GetResourceType(resource);
    const batch = this._loadCount;
    if (!DBG) return;
    console.log(...PR(`[${batch}] ..loaded ${rt} '${name}' from ${url}`));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** callback for PIXI loader to show when loading is complete */
  _loadComplete(loader: PIXI.Loader, resource: PIXI.LoaderResource) {
    if (!DBG) return;
    console.log(...PR(`[${this._loadCount}] load complete`));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return the dimension of a sprite that is in here */
  getSpriteDimensions(idOrName: number | string, frame: number) {
    let assetId = idOrName;
    if (typeof idOrName === 'string') assetId = this.lookupAssetId(idOrName);
    try {
      const { rsrc: sprite } = this.getAssetById(assetId as number);
      if (sprite.texture) {
        // Texture, not spritesheet.  See if PIXI has size.
        const { width, height } = sprite.texture;
        if (width && height) return { w: width, h: height };
        return { err: 'PIXI could not load texture size' };
      }
      if (sprite.spritesheet) {
        const key = sprite.spritesheet._frameKeys[frame];
        return {
          ...sprite.spritesheet._frames[key].sourceSize
        };
      }
    } catch (err) {
      console.error(
        ...PR(
          `getSpriteDimensions: Could not load sprite with assetId "${idOrName}"\n${err}`
        )
      );
    }
    return { err: 'not a texture or spritesheet' };
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return the dimension of a sprite that is in here */
  getTextureInfo(idOrName: number | string) {
    let assetId = idOrName;
    if (typeof idOrName === 'string') assetId = this.lookupAssetId(idOrName);
    try {
      const { rsrc } = this.getAssetById(assetId as number);
      if (rsrc.texture) return { frameCount: 1 };
      if (rsrc.spritesheet)
        return {
          frameCount: rsrc.spritesheet._frameKeys.length
        };
      return { err: 'not a texture or spritesheet' };
    } catch (err) {
      console.error(
        `failed reading assetId ${assetId} rsrc ${this.getAssetById(
          assetId as number
        )}`
      );
      return {
        err: `failed reading assetId ${assetId} rsrc ${this.getAssetById(
          assetId as number
        )}`
      };
    }
  }
} // end class

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// subscribe to system messages here to maintain asset dictionary

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SpriteLoader;
