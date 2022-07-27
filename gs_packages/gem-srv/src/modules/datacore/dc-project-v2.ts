/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DC-PROJECT (SRI) will load the project data

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import GEM_ProjectData from 'modules/datacore/class-gemprj-data';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = UR.LogUtil('PROJ-V2', 'TagGreen');
const ERR = UR.ErrorUtil();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROJECT_DATA = new GEM_ProjectData();
let CUR_PRJ: TProject;
let CUR_BP: TBlueprint;
let CUR_PRJID;
let CUR_BPNAME;
let ASSET_DIR;

/// MODULE INITIALIZATION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Set the current AssetDirectory containing a projects directory,
 *  and load all the project definitions into a PROJECTS dictionary.
 */
async function LoadAssetDirectory(assetUrl: string): Promise<void> {
  const fn = 'LoadAssetDirectory';
  await PROJECT_DATA.loadProjectData(assetUrl).catch(error => {
    console.log(...ERR(`${fn} failed to load '${assetUrl}'`));
    console.log(
      'Make sure that your local-settings.json file overrides ASSET_DIR to point to your local asset directory'
    );
    console.log(error);
  });
  ASSET_DIR = assetUrl;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Return the current asset directory */
function CurrentAssetUrl(): string {
  return ASSET_DIR;
}

/// PROJECT MANAGER METHODS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return array of string project ids (.gemprj files) using the
 *  current PROJECTS asset loader instance. Filters by label string, so
 *  useful for narrowing down the list of matches according to the displayed
 *  label */
function GetProjectList(filterString?: string): TProjectList[] {
  return PROJECT_DATA.getProjectList(filterString);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return { id, metadata, blueprints, instances, rounds, label }
 *  for the given project id (.gemprj files) */
function GetProject(prjId: string): TProject {
  CUR_PRJID = prjId;
  CUR_PRJ = PROJECT_DATA.getProject(prjId);
  return CUR_PRJ;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return the blueprint object { id, label, scriptText } for the
 *  given projectId and blueprintId */
function GetProjectBlueprint(prjId: string, bpName: string): TBlueprint {
  CUR_PRJID = prjId;
  CUR_BPNAME = bpName;
  CUR_BP = PROJECT_DATA.getProjectBlueprint(prjId, bpName);
  return CUR_BP;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return the current project information */
function CurrentProject() {
  return CUR_PRJ;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return the current project information */
function CurrentBlueprint(): TBlueprint {
  const prj = CurrentProject();
  if (!prj) return undefined;
  return CUR_BP;
}

/// DEUGGGER STUFF ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool('projects', () => {
  console.log(GetProjectList());
});

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  LoadAssetDirectory, //
  CurrentAssetUrl
};
export {
  GetProjectList, //
  GetProject,
  GetProjectBlueprint
};
export {
  CurrentProject, //
  CurrentBlueprint
};
