/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PREFERENCES LOADER for ASSET MANAGER

  ROLE:
    Manages and stores a type of asset on behalf of manager
    Loads assets as a read-only resource into its own dictionary.

  PATTERNS:
    Assets have an id that is unique across all asset types that is assigned
    by the asset manifest.

    Loaders are initialized by passing an asset list to queueAssetList(),
    but the assets are not loaded until promiseLoadAssetList() is
    called.

    Retrieving assets is handled by the base class. Since assets all
    have a universal ID system, it is possible for the base clase
    to provide a consistent interface across multiple types of assets.

  See `class-asset-loader` for the underlying utility methods.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import AssetLoader from './class-asset-loader';
import ERROR from 'modules/error-mgr';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AS-PREFERENCES');

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PreferencesLoader extends AssetLoader {
  _loadCount: number;

  constructor() {
    super('preferences');
    this._loadCount = 0;
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
    const promises = [];

    let item: TAssetDef = this._nextAsset();
    while (item !== undefined) {
      this._saveAsset(item); // write stub without resource to lookup later
      const { assetName, assetUrl } = item;
      const assetId = this.lookupAssetId(assetName);
      // note: fetch returns a promise, so you don't need to wrap it in one
      const promiseFetch = fetch(assetUrl)
        .then(response => {
          if (!response.ok) throw new Error('network error');
          return response.text();
        })
        .then(result => {
          try {
            const paths = assetUrl.split('/');
            const filename = paths[paths.length - 1];
            const url = encodeURIComponent(filename.split('.')[0]);
            this._saveAsset({ assetId, assetName }, result);
          } catch (err) {
            console.error(...PR(`parse error ${err} on ${assetName}`));
          }
        });
      promises.push(promiseFetch);
      item = this._nextAsset();
    } // end while
    return Promise.all(promises);
  }

  /// ASSET TYPE-SPECIFIC OPERATIONS //////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Returns project matching projId (not assetId) */
  getPreferences() {
    const preferencesassets = [...this._assetDict.values()];
    const preferencesasset = preferencesassets.find(a => {
      if (!a.rsrc) {
        ERROR(`could not load resources for settings`, {
          source: 'assets',
          data: { a }
        });
        return undefined;
      }
      return a.rsrc;
    });
    return preferencesasset ? preferencesasset.rsrc : undefined;
  }
} // end class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default PreferencesLoader;
