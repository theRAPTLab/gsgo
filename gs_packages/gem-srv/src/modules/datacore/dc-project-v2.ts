/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DC-PROJECT (SRI) will load the project data

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import GEM_ProjectData from 'modules/datacore/class-gemprj-data';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = UR.PrefixUtil('PROJ-V2', 'TagGreen');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROJECT_DATA = new GEM_ProjectData();
let ASSET_DIR;

/// MODULE INITIALIZATION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Set the current AssetDirectory containing a projects directory,
 *  and load all the project definitions into a PROJECTS dictionary.
 */
async function SetAssetDirectory(assetUrl: string): Promise<void> {
  await PROJECT_DATA.loadProjectData(assetUrl);
  ASSET_DIR = assetUrl;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Return the current asset directory */
function GetAssetDirectory(): string {
  return ASSET_DIR;
}

/// PROJECT MANAGER METHODS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return array of string project ids (.gemprj files) using the
 *  current PROJECTS asset loader instance. Filters by label string, so
 *  useful for narrowing down the list of matches according to the displayed
 *  label
 */
function GetProjectList(filterString?: string): TProjectList[] {
  return PROJECT_DATA.getProjectList(filterString);
}

/** API: return { id, metadata, blueprints, instances, rounds, label }
 *  for the given project id (.gemprj files)
 */
function GetProject(prjId: string): TProject {
  return PROJECT_DATA.getProject(prjId);
}

/** API: return the blueprint object { id, label, scriptText } for the
 *  given projectId and blueprintId
 */
function GetProjectBlueprint(prjId: string, bpName: string): TBlueprint {
  return PROJECT_DATA.getProjectBlueprint(prjId, bpName);
}

/// DEUGGGER STUFF ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool('projects', () => {
  console.log(GetProjectList());
});

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SetAssetDirectory };
export { GetProjectList, GetProject, GetProjectBlueprint };
