/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Data Data Core

  IMPORTANT: This should only be imported to components that run on the main
  server!  Other pages (e.g. ScriptEditor, CharController, and Viewer do not
  have direct access to project data)

  @BEN This should be a pure data class that maintains a list of input objects
  and the agents it updates. I wonder if the notion of "current project" is
  important to maintain here rather than in ac-project...both cases can
  be argued for. It was difficult to tease apart exactly what was intended
  because of the lack of comments.

  MESSAGE-BASED CALL API (LOCAL ONLY)
    LOCAL:DC_LOAD_PROJECT           -> HandleLoadProject
    LOCAL:DC_WRITE_PROJECT          -> HandleWriteProject
    LOCAL:DC_WRITE_ROUNDS           -> HandleWriteRounds
    LOCAL:DC_WRITE_BLUEPRINTS       -> HandleWriteBlueprints
    LOCAL:DC_WRITE_INSTANCES        -> HandleWriteInstances

  MODULE EXPORTS
    CreateFileFromTemplate (templateId, newFileName)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as ASSETS from 'modules/asset_core';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - -
const PR = UR.PrefixUtil('DC-PROJ', 'TagPurple');
const DBG = false;

let CURRENT_PROJECT: any = {}; // current project instance

/// PROJECT DATA FILE IO //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** When the project data is changed, ProjectFileWrite will send the changes
 *  to the server, and the server will update the *.gemproj file.
 */
async function ProjectFileWrite(projId, project) {
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
/** Read project data from assets and broadcast loaded data to ac-project */
async function ProjectFileLoadFromAsset(projId) {
  const PROJECT_LOADER = ASSETS.GetLoader('projects');
  const project = await PROJECT_LOADER.getProjectByProjId(projId);
  return project;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: During Login, a user can elect to create a new project
 *  file out of existing template file.  PanelSelectSimulation
 *  calls this directly.  This will load the template file,
 *  rename it, then write it to disk.
 */
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
  return ProjectFileWrite(newfilename, project);
}

/** Reconstructs project data by merging income updated 'data' with the
 *  existing CURRENT_PROJECT data.
 *  When any subset of project data is changed (e.g. metadata, rounds,
 *  instances, or blueprints), we need to update the whole project data
 *  object.
 *  Sends the updated project to the server for writing to disk.
 */
async function m_UpdateProjectFile(projId, data) {
  const project = CURRENT_PROJECT;
  project.id = data.id || project.id;
  project.label = data.label || project.label;
  project.metadata = data.metadata || project.metadata;
  project.rounds = data.rounds || project.rounds;
  project.blueprints = data.blueprints || project.blueprints;
  project.instances = data.instances || project.instances;
  CURRENT_PROJECT = project;
  await ProjectFileWrite(projId, project);
  return project;
}

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** Stores 'project' in CURRENT_PROJECT */
function SetCurrentProject(project) {
  CURRENT_PROJECT = project;
}
function GetCurrentProject() {
  return CURRENT_PROJECT;
}

/** Used to update components of the project data file.
 *  Will call m_UpdateProjectFile to merge the components into the main
 *  project file and send it to the server for writing to disk.
 *  @param {object} projData - {id, label, metadata, rounds, blueprints, instances}
 *                            Can be any or all of the keys.
 */
function UpdateProjectData(projId, projData) {
  if (DBG) console.log('UpdateProjectData', projId, projData);
  return m_UpdateProjectFile(projId, projData);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  SetCurrentProject,
  GetCurrentProject,
  UpdateProjectData,
  ProjectFileWrite,
  ProjectFileLoadFromAsset,
  ProjectFileCreateFromTemplate
};

/// TEST CODE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// This is used to test the server's ability to handle a project file write.
function putproject() {
  console.log('putprojec!t');
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
UR.AddConsoleTool({
  test_putproject: putproject
});
