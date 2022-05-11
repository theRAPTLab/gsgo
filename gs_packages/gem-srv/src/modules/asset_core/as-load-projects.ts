/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PROJECT LOADER for ASSET MANAGER

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
import { TAssetDef, TAssetType } from '../../lib/t-assets';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AS-PROJECT');
const DBG = false;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ProjectLoader extends AssetLoader {
  // _loader: PIXI.Loader;
  _loadCount: number;

  constructor() {
    super('projects');
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
          // convert .gemprj format to json
          // 1. Look for scripts inside of ``
          // 2. For each ``, insert "\n" and replace ` with "
          const cleaned = String(result).replace(/`[\s\S]*?`/g, match => {
            return match.replace(/\n/g, '\\n').replace(/`/g, '"');
          });
          try {
            const json = JSON.parse(cleaned);
            // Override the project.id with the filename
            const paths = assetUrl.split('/');
            const filename = paths[paths.length - 1];
            const url = encodeURIComponent(filename.split('.')[0]);
            json.id = url;
            this._saveAsset({ assetId, assetName }, json);
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
  /** Returns array of projects [{id, label}] */
  getProjectsList(): any {
    const ids = [...this._assetDict.keys()];
    const projectsList = ids.map(id => {
      const asset = this.getAssetById(id);
      return { id: asset.rsrc.id, label: asset.rsrc.label }; // why is assetId undefined?
    });
    return projectsList;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** given a project id, return its list of blueprintnames */
  getProjectBlueprints(prjId): any {
    const project = this.getProjectByProjId(prjId);
    if (!project || project.id === undefined)
      return `no projectId '${prjId}' found`;
    const { blueprints } = project;
    if (!Array.isArray(blueprints)) return 'bad project.blueprints object';
    // gpt this far, valid blueprint list
    return blueprints;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  getProjectBlueprintsList(prjId): string[] {
    const blueprints = this.getProjectBlueprints(prjId);
    return blueprints.map(bp => bp.id);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Returns project matching projId (not assetId) */
  getProjectByProjId(projId) {
    const projassets = [...this._assetDict.values()];
    const projasset = projassets.find(a => {
      if (!a.rsrc) {
        console.error(
          ...PR(
            `getProjectByProjId for project '${projId}' could not find a valid 'rsrc' entry -- review gemproj file or promiseLoadAssets`
          )
        );
        return undefined;
      }
      return a.rsrc.id === projId;
    });
    return projasset ? projasset.rsrc : undefined;
  }
} // end class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ProjectLoader;
