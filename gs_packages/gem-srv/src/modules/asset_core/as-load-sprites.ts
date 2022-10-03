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
import { DEFAULT_SPRITE } from 'modules/flags';
// import { TAssetDef, TAssetType } from '../../lib/t-assets';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AS-SPRITE');
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
  constructor() {
    super('sprites');
    if (DBG) console.log(...PR(`creating 'sprites' loader instance...`));
    this._loader = new PIXI.Loader();
    this._loadCount = 0;
    this._loadProgress = this._loadProgress.bind(this);
    this._loader.onProgress.add(this._loadProgress);
    this._loadComplete = this._loadComplete.bind(this);
    this._loader.onComplete.add(this._loadComplete);

    // add default sprite
    const assetId = 1;
    const assetName = DEFAULT_SPRITE;
    const assetUrl = `static/spr-${DEFAULT_SPRITE}.png`;
    this.queueAssetList([{ assetId, assetName, assetUrl }]);
  }

  /// INHERITED FROM ASSETLOADER BASE CLASS ///////////////////////////////////
  /// see class-asset-loader for provided methods

  /// LOADER-SPECIFIC METHOD OVERRIDES and METHODS ////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** override this method to write custom asset list queue */
  queueAssetList(assetList: TAssetDef[]) {
    assetList.forEach(item => {
      const { assetId, assetName, assetUrl } = item;
      if (typeof assetId !== 'number') throw Error('bad/missing assetId in list');
      if (!(assetId && assetName && assetUrl)) throw Error('bad asset list');
      this._queueAsset(assetId, assetName, assetUrl);
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
      console.groupCollapsed(...PR('[ Hidden PixiJS cache warnings ]'));
      console.log(
        "%cNOTE: cache warnings are a debug feature in PixiJS that can't be easily turned off, so we just hide them.",
        'color:red'
      );
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
        console.groupEnd();
      }); // end of loadAssets
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
  /** erase everything */
  reset() {
    super.reset();
    this._loader = new PIXI.Loader();
    this._loadCount = 0;
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
