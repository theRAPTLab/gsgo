/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ASSET LOADER BASE CLASS

  ROLE:
    Loads the contents of a remote asset directory to make resources
    available to other modules in the application. This base class defines
    the common operations for asset management.

  OPERATIONS:

    Asset directories have a URL with subdirectories named by type of asset.
    An Asset Manifest is the list of all the available resources, grouped by
    type of asset.

    All assets in the manifest have a unique id, a non-unique label, and
    a URL to the asset file.

    An Asset Loader can parse the manifest into an LOAD_QUEUE which
    has an entry for each resource to be loaded then saved into a
    STORAGE DICTIONARY.

    After loading, assets can be retrieved by assetName or by assetId.

  CONCEPTS:

    Loading occurs in two steps: (1) queueing the assets lists to load,
    then (2) loading the resources referred to in the asset list and storing
    them in the dictionary.

    To implement a loader, you MUST override promiseLoadAssets() and use
    the built-in methods for loading the queued resources. It's implemented
    with the iterator pattern

    let item = _nextAsset(); // has { assetId, assetUrl }
    while (item!==undefined) {
      _saveAsset(item);
      const { assetId, assetUrl } = item;
      const resource = await yourAsyncLoader(assetUrl)
      _saveAsset(item, resource)
      item = _nextAsset()
    }


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  TAssetDef,
  TAssetType,
  TAssetId,
  TAssetName,
  TAssetURL,
  TAssetLoader,
  TResource,
  TManifest
} from 'lib/t-assets.d';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_NewAssetRecord() {
  return { assetUrl: '', assetId: undefined, assetName: undefined };
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class AssetLoader extends TAssetLoader {
  _queue: TAssetDef[]; // the queue of assets to load
  _type: TAssetType; // the kind of asset this instance will manage
  _loadCount: number;
  _assetDict: Map<TAssetId, TResource>;
  _nameLookup: Map<TAssetName, TAssetId>;

  /** please initialize queue mechanism through super(type) */
  constructor(assetType: TAssetType) {
    super();
    this._queue = [];
    this._loadCount = 0;
    this._type = assetType;
    this._assetDict = new Map();
    this._nameLookup = new Map();

    // bind methods so they work in callbacks
    this._nextAsset = this._nextAsset.bind(this);
    this._saveAsset = this._saveAsset.bind(this);
    //
    this._unloadAsset = this._unloadAsset.bind(this);
    this._unloadAll = this._unloadAll.bind(this);
    this._queueAsset = this._queueAsset.bind(this);
    this._err = this._err.bind(this);
    //
    this.type = this.type.bind(this);
    this.hasAsset = this.hasAsset.bind(this);
    this.hasAssetId = this.hasAssetId.bind(this);
    this.lookupAssetId = this.lookupAssetId.bind(this);
    this.getAssetById = this.getAssetById.bind(this);
    this.getAsset = this.getAsset.bind(this);
    //
    this.queueAssetList = this.queueAssetList.bind(this);
    this.promiseLoadAssets = this.promiseLoadAssets.bind(this);
  }

  /** return a prompted string for throwing Errors from multiple arguments */
  _err(str: string, ...args) {
    return `asset-loader[${this.type()}]: ${str} ${JSON.stringify(args)}`;
  }

  /// PROTECTED METHODS ///////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// These are used by subclassers to use the dictionaries that store an
  /// asset definition's resource by id and maintaining name-to-id lookup
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** given an AssetDef and the loaded resource or error, save the asset
   *  a TResource in dictionaries. We carefully overwrite the keys of
   *  the existing object
   */
  protected _saveAsset(def: TAssetDef, rsrc?: any, error?: string) {
    const { assetId, assetName, assetUrl } = def;
    if (!this.hasAssetId(assetId))
      this._assetDict.set(assetId, m_NewAssetRecord());
    const recRef = this._assetDict.get(assetId);
    // update stored record carefully instead of overwriting it
    if (assetUrl) recRef.assetUrl = assetUrl;
    if (assetName) {
      recRef.assetName = assetName;
      // also update reverse lookup
      this._nameLookup.set(assetName, assetId);
    }
    if (rsrc) recRef.rsrc = rsrc;
    if (error) recRef.error = error;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** given an assetName, release it from dictionary */
  protected _unloadAsset(name: TAssetName) {
    const id = this.lookupAssetId(name);
    this._assetDict.delete(id);
    this._nameLookup.delete(name);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** release all assets, returning array of { name, id } of removed assets  */
  protected _unloadAll(): { name: string; id: number }[] {
    const entries = this._nameLookup.entries(); // iterator
    const report = [];
    for (let kv of entries) {
      const [name, id] = kv;
      this._assetDict.delete(id);
      this._nameLookup.delete(name);
      report.push({ name, id });
    }
    return report;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** add an asset to the loader queue */
  protected _queueAsset(id: TAssetId, name: TAssetName, url: TAssetURL) {
    const assetDef: TAssetDef = { assetId: id, assetName: name, assetUrl: url };
    this._queue.push(assetDef);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** pull next item from queue */
  protected _nextAsset(): TAssetDef {
    return this._queue.shift();
  }

  /// PUBLIC METHODS //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// All asset loaders use this common interface
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: return the asset type */
  type(): TAssetType {
    return this._type;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: return true if asset name is in this loader */
  hasAsset(name: TAssetName): boolean {
    return this._nameLookup.has(name);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: return true is asset id is in this loader */
  hasAssetId(id: TAssetId): boolean {
    return this._assetDict.has(id);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: given an assetName, return numeric assetId. AssetIds are guaranteed to
   *  be unique across all asset types, but name are unique only within the
   *  the assetType category
   */
  lookupAssetId(name: TAssetName): TAssetId {
    const lookup = this._nameLookup.get(name);
    if (this._nameLookup.size === 0)
      throw Error(this._err('lookupAssetId() called before assets were loaded'));
    return lookup;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: given an assetId, return the saved resource */
  getAssetById(id: TAssetId): TResource {
    if (this._nameLookup.size === 0)
      throw Error(this._err('getAssetById() called before assets were loaded'));
    const rsrc = this._assetDict.get(id);
    return rsrc;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: given an assetName, return the saved resource */
  getAsset(name: TAssetName): TResource {
    if (this._nameLookup.size === 0)
      throw Error(this._err('getAsset() called before assets were loaded'));
    const id = this.lookupAssetId(name);
    return this.getAssetById(id);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  getAssetList(opt = { sort: 'id' }) {
    return [...Object.keys(this._nameLookup)];
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: release all assets to reuse instance */
  reset() {
    this._unloadAll();
  }

  /// LOADER-SPECIFIC OVERRIDES ///////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Subclassers override these methods to implement asset type specific
  /// loader code
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** OPTIONAL OVERRIDE: add an array of assets to the loader queue */
  queueAssetList(assetList: TAssetDef[]) {
    // note: we could queue the TAssetDef as-is, but am destructuring
    // here just to show what's inside it when debugging
    assetList.forEach(item => {
      const { assetId, assetName, assetUrl } = item;
      this._queueAsset(assetId, assetName, assetUrl);
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** OVERRIDE this method to implement own loader. should return a promise
   *  that will be added to an array of Promises to exist during ASSET_LOAD
   */
  promiseLoadAssets(): Promise<TAssetDef[]> {
    const i = this._loadCount;
    // this should be customized
    return new Promise((resolve, reject) => {
      console.log('resolving');
      resolve([]);
    });
  }

  /// STATIC MANIFEST METHOD //////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: load manifest from a constructed route of the form
   *  http://host:port/assets/subdir. If you pass the option { raw }, then you
   *  can get the raw manifest file without the rewritten URLs to assets, which
   *  is useful for making manual asset files that can move with folder
   *  reorganization
   */
  static async PromiseManifest(
    assetDir: string,
    opt = { raw: false }
  ): Promise<TManifest> {
    const url = `${assetDir}?manifest`;
    if (DBG) console.log('loading url', url);
    let json: any;
    let manifest: TManifest;
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
      if (opt.raw) return json as TManifest;
      manifest = {};
      for (const [asType, asList] of Object.entries(json)) {
        (asList as TAssetDef[]).forEach(item => {
          item.assetUrl = `${assetDir}/${item.assetUrl}`;
        });
        manifest[asType] = asList;
      }
    } catch (err) {
      // console.warn(err);
      manifest = undefined;
    }
    console.log('returning manifest', manifest);
    return manifest;
  }
} // end class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// class to extend
export default AssetLoader;
