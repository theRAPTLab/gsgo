/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Data Data Core

  IMPORTANT: This should only be imported to components that run on the main
  server!  Other pages (e.g. ScriptEditor, CharController, and Viewer do not
  have direct access to project data)

  There are essentially three types of calls handled by dc-project.

  1. Initial Project Load
     When Main is first loaded, project data is loaded from the *.gemproj file
     in the gs_assets folder.  project-server calls
     ac-project.LoadProjectFromAsset, which in turn calls
     DCPROJECT.ProjectFileLoadFromAsset which requests data from the server:

        ACProject.LoadProjectFromAsset =>
        DCPROJECT.ProjectFileLoadFromAsset

     When the data is received by the server, ACProject loads the project
     data to itsef and hands off components to its children, setting
     ac-metadata, ac-rounds, ac-blueprint, ac-instances states.


  2. Write to Disk when Project Data Changes
     When metadata, rounds definitions, blueprint definitions, or
     instance definitions change (as handled by ac-metadata, ac-rounds
     ac-blueprints, and ac-instances), they call

        UpdateProjectData,

     which updates the CURRENT_PROJECT state.

     If the updated data needs to be saved, they then call

        ProjectFileRequestWrite

     in their hook_Effect methods.  This will queue a project file
     write to server with the next AUTOTIMER fire.  The use of the
     AUTOTIMER is to reduce the frequency of updates to no more than
     one per second.

  3. Create new project file from a template
     On the Login screen, if a user elects to create a new project
     from an existing template file, PanelSelectSimulation calls
     CreateFileFromTemplate, which will load the template file,
     rename it, then save it as a project file.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as ASSETS from 'modules/asset_core';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - -
const PR = UR.PrefixUtil('DC-PROJ', 'TagPurple');
const DBG = false;

let CURRENT_PROJECT: any = {}; // current project instance
let AUTOTIMER: number;

/// PROJECT DATA FILE IO SUPPORT METHODS //////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** When the project data is changed, ProjectFileWrite will send the changes
 *  to the server, and the server will update the *.gemproj file. */
async function m_ProjectFileWrite(projId: string, project: TProject) {
  // REVIEW: Should the url be parameterized, e.g. 'localhost' might be remote?
  const response = await fetch(`http://localhost/assets-update/${projId}`, {
    method: 'PUT',
    body: JSON.stringify(project),
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    }
  });
  if (!response.ok) {
    throw new Error(`FileWriteProject failed with ${response.status}`);
  }
  const result = await response.json();
  return result;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Reconstructs project data by merging income updated 'data' with the
 *  existing CURRENT_PROJECT data.
 *  When any subset of project data is changed (e.g. metadata, rounds,
 *  instances, or blueprints), we need to update the whole project data
 *  object. */
function m_UpdateProjectFile(data: any = {}): TProject {
  const project = CURRENT_PROJECT;
  project.id = data.id || project.id;
  project.label = data.label || project.label;
  project.metadata = data.metadata || project.metadata;
  project.rounds = data.rounds || project.rounds;
  project.blueprints = data.blueprints || project.blueprints;
  project.instances = data.instances || project.instances;
  CURRENT_PROJECT = project;
  return project;
}

/// PROJECT DATA API METHODS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Sends the CURRENT_PROJECT data to the server for writing to disk
 *  This operates on a delay timer so saves only happen after a pause of
 *  1 second to reduce the frequency of saves. */
function ProjectFileRequestWrite() {
  if (AUTOTIMER) clearInterval(AUTOTIMER);
  AUTOTIMER = setInterval(() => {
    const projId = CURRENT_PROJECT.id;
    void (async () => {
      await m_ProjectFileWrite(projId, CURRENT_PROJECT);
      clearInterval(AUTOTIMER);
      AUTOTIMER = 0;
    })();
  }, 1000);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Read project data from assets and broadcast loaded data to
 *  ac-project */
async function ProjectFileLoadFromAsset(projId: string): Promise<TProject> {
  const PROJECT_LOADER = ASSETS.GetLoader('projects');
  const project = await PROJECT_LOADER.getProjectByProjId(projId);
  return project;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: During Login, a user can elect to create a new project
 *  file out of existing template file.  PanelSelectSimulation
 *  calls this directly.  This will load the template file,
 *  rename it, then write it to disk. */
async function ProjectFileCreateFromTemplate(templateId, newfilename) {
  // 1. open the template file
  const PROJECT_LOADER = ASSETS.GetLoader('projects');
  const project = PROJECT_LOADER.getProjectByProjId(templateId);
  if (project === undefined)
    throw new Error(
      `ProjectFileCreateFromTemplate could not find template ${templateId}`
    );
  // 2. update the id
  project.id = newfilename;
  // 3. save as a new file
  return m_ProjectFileWrite(newfilename, project);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Stores 'project' in CURRENT_PROJECT */
function SetCurrentProject(project: TProject) {
  CURRENT_PROJECT = project;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetCurrentProject(): TProject {
  return CURRENT_PROJECT;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Used to update components of the project data file.
 *  Will call m_UpdateProjectFile to merge the components into the main
 *  project file and send it to the server for writing to disk. */
function UpdateProjectData(projData) {
  if (DBG) console.log('UpdateProjectData', projData);
  return m_UpdateProjectFile(projData);
}

/// EXAMPLE OF USING SERVICE //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// This is used to test the server's ability to handle a project file write.
function putproject() {
  console.log('putproject');
  fetch('http://localhost/assets-update/aquatic', {
    method: 'PUT',
    body: JSON.stringify({
      userId: 1,
      id: 'jo',
      title: 'hello task',
      completed: false
    }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    }
  })
    .then(response => response.json())
    .then(json => console.log(json))
    .catch(error => console.error(error));
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  SetCurrentProject, //
  GetCurrentProject,
  UpdateProjectData
};
export {
  ProjectFileRequestWrite, // write to server
  ProjectFileLoadFromAsset, // load from server
  ProjectFileCreateFromTemplate //
};
