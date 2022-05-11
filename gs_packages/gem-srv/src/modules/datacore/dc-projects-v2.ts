/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  contains the project methods in ac-wizcore so I can reuse them for general
  data management

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import ProjectLoader from 'modules/asset_core/as-load-projects';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = UR.PrefixUtil('PROJ-V2', 'TagGreen');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let LOADER: ProjectLoader;
let ASSET_URL: string;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function SetAssetDirectory(assetUrl: string) {
  const fn = 'SetAssetDirectory:';
  if (DBG) console.log(...PR(`${fn} getting manifest`));
  const manifest = await ProjectLoader.PromiseManifest(assetUrl);
  const { projects } = manifest;
  if (DBG) console.log(...PR('project', projects));
  if (LOADER === undefined) LOADER = new ProjectLoader();
  if (DBG) console.log(...PR(`${fn} loading assets`));
  LOADER.reset();
  LOADER.queueAssetList(projects);
  await LOADER.promiseLoadAssets();
  if (DBG) console.log(...PR(`${fn} loaded`));
  if (DBG) LOADER.getAssetList().forEach(entry => console.log(entry));
  ASSET_URL = assetUrl;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return array of string project ids (.gemprj files) using the
 *  current PROJECTS asset loader instance
 */
function GetProjectList() {
  if (LOADER === undefined) throw Error('GetProjectList: no projects loaded');
  return LOADER.getProjectsList(); // Array{ id, label }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return { id, metadata, blueprints, instances, rounds, label }
 *  for the given project id (.gemprj files)
 */
function GetProject(prjId) {
  const fn = 'GetProject:';
  if (LOADER === undefined) throw Error('GetProject: no projects loaded');
  try {
    const project = LOADER.getProjectByProjId(prjId);
    return project;
  } catch (e) {
    console.error(`${fn} ${prjId} not found in ${ASSET_URL}`);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return the blueprint object { id, label, scriptText } for the
 *  given projectId and blueprintId
 */
function GetProjectBlueprint(prjId, bpName) {
  const fn = 'GetProjectBlueprint:';
  const project = GetProject(prjId);
  if (project === undefined) throw Error(`no asset project with id ${prjId}`);
  const { blueprints } = project;
  let match = blueprints.find(bp => bp.name === bpName);
  if (match === undefined) {
    match = blueprints.find(bp => bp.id === bpName);
    if (match !== undefined)
      console.error(`${fn} WARNING: blueprint data using 'id', not 'name'`);
    else {
      const err = `${fn} no blueprint ${bpName} in project ${prjId}`;
      console.warn(err);
      console.log(...PR('available lists', blueprints));
      throw Error(err);
    }
    return match;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool('projects', () => {
  console.log(GetProjectList());
});

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SetAssetDirectory };
export { GetProjectList, GetProject, GetProjectBlueprint };
