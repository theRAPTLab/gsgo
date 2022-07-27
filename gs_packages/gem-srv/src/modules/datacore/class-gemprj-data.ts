/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GEM_ProjectData is a class that knows how to load a manifest from an
  assetUrl, grab the list of .gemprj files in the asset directory, and
  load them into a ProjectLoader class instance. You can use this class to
  manage the .gemprj files in an asset directory.

  CASE 1 - EXISTING MANIFEST FILE
  If you already have a manifest loaded:
  const pd = new GEM_ProjectData(manifest);
  await pd.loadProjectData();

  CASE 2 - LOADING ALL GEMPROJ FILES FROM ASSET URL
  If you are loading all projects from scratch:
  const pd = new GEM_ProjectData();
  await pd.loadProjectData(url);

  CASE 3 - LOADING MANIFEST, then LOADING RESOURCES
  If you need to split the manifest fetch from the resource fetch:
  const pd = new GEM_ProjectData();
  await pd.loadManifest(url);
  await pd.loadProjectData();

  CASE 4 - RELOADING MANIFEST
  Use case 2 or 3 and the new data will replace the old data.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import ProjectLoader from 'modules/asset_core/as-load-projects';
import { NormalizePath } from 'lib/util-path';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// MAIN CLASS DECLARATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GEM_ProjectData {
  loader: ProjectLoader;
  manifest: TManifest;
  asset_url: string;

  /** constructor: accept a manifest on construction
   */
  constructor(manifest?: TManifest) {
    if (manifest) this.manifest = manifest;
  }

  /// INITIALIZATION AND LOADING //////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: Set the current AssetDirectory containing an assets directory,
   *  and load the manifest file which contains projects/.gemprj
   */
  async loadManifest(assetUrl: string): Promise<void> {
    const fn = 'loadManifest:';
    // if manifest was provided on construct, use it
    // otherwise fetch it from the assetURL provided
    if (this.manifest && DBG)
      console.warn(`${fn} reloading manifest from '${assetUrl}'`);
    const manifest = await ProjectLoader.PromiseManifest(assetUrl);
    this.manifest = manifest;
    this.asset_url = assetUrl;
  }

  /** API: after the manifest is loaded, call this to load the resources
   *  contained by the current asset manifest, or provide an overriding
   *  assetUrl
   */
  async loadProjectData(assetUrl?: string): Promise<void> {
    const fn = 'loadProjectData:';
    if (typeof assetUrl === 'string') {
      await this.loadManifest(assetUrl).then(() => {
        if (DBG) console.warn(`${fn} reloading data from '${assetUrl}'`);
      });
    } else console.warn(`${fn} called before loadManifest`);

    const { projects } = this.manifest;
    if (this.loader === undefined) this.loader = new ProjectLoader();
    this.loader.reset();
    this.loader.queueAssetList(projects);
    await this.loader.promiseLoadAssets();
  }

  /** API: return array of string project ids (.gemprj files) using the
   *  current PROJECTS asset loader instance. Filters by label string, so
   *  useful for narrowing down the list of matches according to the displayed
   *  label
   */
  getProjectList(filterString?: string): TProjectList[] {
    const fn = 'getProjectList:';
    if (this.loader === undefined)
      throw Error('GetProjectList: no projects loaded');
    const list = this.loader.getProjectsList(); // Array{ id, label }
    if (!filterString) return list;
    return list.filter(({ id }) => id.includes(filterString));
  }

  /** API: return { id, metadata, blueprints, instances, rounds, label }
   *  for the given project id (.gemprj files)
   */
  getProject(prjId: string): TProject {
    const fn = 'getProject:';
    if (this.loader === undefined) throw Error('GetProject: no projects loaded');
    const project = this.loader.getProjectByProjId(prjId);
    return project;
  }

  /** API: return the blueprint object { id, label, scriptText } for the
   *  given projectId and blueprintId
   */
  getProjectBlueprint(prjId: string, bpName: string): TBlueprint {
    const fn = 'getProjectBlueprint:';
    const project = this.getProject(prjId);
    if (project === undefined) throw Error(`no asset project with id ${prjId}`);
    const { blueprints } = project;
    let match = blueprints.find(bp => bp.name === bpName);
    // check for old id value in old gemproj files
    if (match === undefined) {
      match = blueprints.find(bp => bp.id === bpName);
      if (match) console.warn(`${fn} blueprint.id used instead of bp.name`);
    }
    if (DBG && match === undefined) console.error(`${fn} no match ${bpName}`);
    return match;
  }

  /// ACCESSORS FOR DATA STRUCTURES ///////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: return current manifest */
  currentManifest(): TManifest {
    return this.manifest;
  }

  /** API: return current assetUrl */
  currentAssetUrl(): string {
    return NormalizePath(this.asset_url);
  }

  /** API: return saved data structure */
  currentAssetLoader(): ProjectLoader {
    return this.loader;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default GEM_ProjectData;
