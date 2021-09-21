/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PROJECT ASSET_CORE LOADER for ASSET MANAGER

  Extends AssetLoader with additional Project-related information

  * getProjectsList
  * getProjectByProjId

  See `class-asset-loader` for the underlying utility methods.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import AssetLoader from './class-asset-loader';
import { TAssetDef, TAssetType } from '../../lib/t-assets';
import { GS_ASSETS_ROUTE } from '../../../config/gem-settings';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AS-PROJECT');
const ASSET_URL = `${GS_ASSETS_ROUTE}`;
const DBG = true;

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ProjectLoader extends AssetLoader {
  // _loader: PIXI.Loader;
  _loadCount: number;

  /** please initialize queue mechanism through super(type) */
  constructor(assetType: TAssetType) {
    super(assetType);
    this._loadCount = 0;
    // this._loadProgress = this._loadProgress.bind(this);
    // this._loader.onProgress.add(this._loadProgress);
    // this._loadComplete = this._loadComplete.bind(this);
    // this._loader.onComplete.add(this._loadComplete);
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
      // if (this._loader.loading) {
      //   const batch = this._loadCount;
      //   console.warn(`error: batch [${batch}] is still loading`);
      //   reject();
      //   return;
      // }

      const loader = [];
      // (1)
      // pop queued assets and add to the loader queue
      let item: TAssetDef = this._nextAsset();
      while (item !== undefined) {
        this._saveAsset(item); // write stub without resource to lookup later
        const { assetName, assetUrl } = item;
        if (DBG) console.log(...PR('Loading', assetName, assetUrl));
        loader.push({
          assetName,
          assetUrl
        });

        ++this._loadCount;

        item = this._nextAsset();
      } // end while

      // (2)
      // project loader: read files and save it to resource
      loader.forEach(l => {
        const { assetName, assetUrl } = l;
        const assetId = this.lookupAssetId(assetName);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const fetchProject = new Promise((res, rej) => {
          const project = fetch(assetUrl).then(async response => {
            if (!response.ok) throw new Error('network error');
            return response.text();
          });
          res(project);
        }).then(result => {
          const json = JSON.parse(String(result).replace(/`/g, '"'));
          this._saveAsset({ assetId, assetName }, json);
        });
      });
      // we need to call resolve otherwise the promise is never fulfilled
      resolve(this);
    };
    return new Promise(loadAssets);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Returns array of projects [{id, label}] */
  getProjectsList() {
    const ids = [...this._assetDict.keys()];
    const projectsList = ids.map(id => {
      const asset = this.getAssetById(id);
      return { id: asset.rsrc.id, label: asset.rsrc.label }; // why is assetId undefined?
    });
    return projectsList;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Returns project matching projId (not assetId) */
  getProjectByProjId(projId) {
    const projassets = [...this._assetDict.values()];
    const project = projassets.find(a => a.rsrc.id === projId);
    return project.rsrc;
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
export default ProjectLoader;
