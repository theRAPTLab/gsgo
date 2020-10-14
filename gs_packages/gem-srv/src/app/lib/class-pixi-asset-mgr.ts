/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ASSET MANAGER for PIXI LOADER

  Assets in GEM have an id number, which uniquely identifies an entry
  in the system-wide AssetLibrary. Asset information is synchronized
  across the network. These ids are used in place of strings for
  compressing update messages for display objects.

  PIXI.Loader supports plugins to handle loading different datatypes.
  https://medium.com/@bigtimebuddy/new-pixijs-v5-plugins-75a7d86afb6

  BASIC USAGE

  const ASSETS = new PixiAssetMgr();
  ASSETS.queue(id, name, url);
  ASSETS.promiseLoadQueue().then(()=>{
    // const tex = ASSETS.getTextureById(id);
    // const tex = ASSETS.getTexture(name);
  });

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as PIXI from 'pixi.js';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type QueueItem = { assetId: number; assetName: string; assetUrl: string };
type AssetId = number;
type AssetName = string;
type AssetURL = string;
type Manifest = { sprites: QueueItem[] };

const PR = UR.PrefixUtil('ASSETS');
const DBG = false;

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetResourceType(resource: PIXI.LoaderResource): string {
  const rtype = resource.constructor.name || 'UnknownType';
  return rtype;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PixiAssetManager {
  _loader: PIXI.Loader;
  _textures: Map<AssetId, PIXI.LoaderResource>;
  _tex_dict: Map<AssetName, AssetId>;
  _queue: QueueItem[];
  _loadCount: number;

  constructor() {
    this._loader = new PIXI.Loader();
    this._textures = new Map();
    this._tex_dict = new Map();
    this._queue = [];
    this._loadCount = 0;
    // hook loader progress
    this._loadProgress = this._loadProgress.bind(this);
    this._loader.onProgress.add(this._loadProgress);
    this._loadComplete = this._loadComplete.bind(this);
    this._loader.onComplete.add(this._loadComplete);

    // to ensure async compatibility, bind callback functions
    this.queue = this.queue.bind(this);
    this.queueArray = this.queueArray.bind(this);
    this.loadManifest = this.loadManifest.bind(this);
    this.promiseLoadQueue = this.promiseLoadQueue.bind(this);
    this.getAsset = this.getAsset.bind(this);
    this.getAssetById = this.getAssetById.bind(this);
  }

  load(id: AssetId, name: AssetName, url: AssetURL) {
    this.queue(id, name, url);
    return this.promiseLoadQueue();
  }

  _loadProgress(loader: PIXI.Loader, resource: PIXI.LoaderResource) {
    const { name, url } = resource;
    const rt = m_GetResourceType(resource);
    const batch = this._loadCount;

    if (!DBG) return;
    console.log(...PR(`[${batch}] ..loaded ${rt} '${name}' from ${url}`));
  }

  _loadComplete(loader: PIXI.Loader, resource: PIXI.LoaderResource) {
    if (!DBG) return;
    console.log(...PR(`[${this._loadCount}] load complete`));
  }

  queue(id: AssetId, name: AssetName, url: AssetURL) {
    if (typeof id !== 'number') throw Error('arg1 must be assetId number');
    if (typeof name !== 'string') throw Error('arg2 must be assetName');
    if (typeof url !== 'string') throw Error('arg3 must be assetUrl');
    if (!name) throw Error('arg1 can not be empty');
    if (!url) throw Error('arg2 can not be empty');
    this._queue.push({ assetId: id, assetName: name, assetUrl: url });
  }

  queueArray(assetList: QueueItem[]) {
    assetList.forEach(item => {
      const { assetId, assetName, assetUrl } = item;
      if (typeof assetId !== 'number') throw Error('bad/missing assetId in list');
      if (!(assetId && assetName && assetUrl)) throw Error('bad asset list');
      this.queue(assetId, assetName, assetUrl);
    });
  }

  promiseLoadQueue() {
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
      // add assetIds that aren't already defined
      let item: QueueItem = this._queue.pop();
      while (item !== undefined) {
        const { assetId, assetName, assetUrl } = item;
        const hasName = this._textures.get(assetId);
        if (hasName) {
          if (DBG) console.log(...PR(`${assetId} exists. skipping ${assetName}`));
        } else {
          this._tex_dict.set(assetName, assetId);
          this._loader.add(assetName, assetUrl);
        }
        item = this._queue.pop();
      }
      // now tell the PIXI loader to load, and handle callback
      this._loader.load(load => {
        const resources = [...Object.entries(load.resources)];
        resources.forEach(kv => {
          const [assetName, rsrc] = kv;
          const assetId = this._tex_dict.get(assetName);
          if (assetId === undefined) {
            if (DBG) console.log(...PR(`[${i}] '${assetName}' aux asset`));
            return;
          }
          this._textures.set(assetId, rsrc);
        });
        ++this._loadCount;
        resolve(this);
      });
    };
    return new Promise(loadAssets);
  }
  async loadManifest(assetFile: string) {
    const res = await fetch(assetFile);
    const list = await res.json();
    this.queueArray(list.sprites);
    await this.promiseLoadQueue();
  }

  getPixiLoader() {
    if (!this._loader.loading) return this._loader;
    console.warn(...PR('loader is actively loading and not valid'));
    return undefined;
  }

  getAssetById(id: AssetId) {
    const tex = this._textures.get(id);
    if (tex) return tex;
    console.warn(`assetId ${id} is not in library`, this._textures);
    if (this._loader.loading) console.log('note: asynch load still in progress');
    return undefined;
  }

  getAsset(name: AssetName) {
    const id = this._tex_dict.get(name);
    if (id !== undefined) return this.getAssetById(id);
    console.warn(`assetName '${name}' is not defined in library`);
    if (this._loader.loading) console.log('note: asynch load still in progress');
    return undefined;
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
export default PixiAssetManager;
