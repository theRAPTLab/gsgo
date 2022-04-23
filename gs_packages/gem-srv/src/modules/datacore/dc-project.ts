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
import * as PROJECT from 'modules/appcore/ac-project';
import * as ASSETS from 'modules/asset_core';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - -
const PR = UR.PrefixUtil('DC-PROJ', 'TagPurple');
const DBG = false;

/// PROJECT DATA LOADER ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** Read project data from assets and broadcast loaded data to ac-project */
async function m_LoadProjectFromAsset(projId) {
  const PROJECT_LOADER = ASSETS.GetLoader('projects');
  const project = PROJECT_LOADER.getProjectByProjId(projId);
  UR.RaiseMessage('*:DC_PROJECT_UPDATE', { projId, project });
  return { ok: true };
}

/** When the project data is changed, FileWriteProject will PUT the changes
 *  to the server, and the server will update the *.gemproj file.
 */
async function m_FileWriteProject(projId, project) {
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

/** When any subset of project data is changed (e.g. metadata, rounds,
 *  instances, or blueprints), we need to update the whole project data
 *  object, then write it to disk.
 *  Called locally by the various `HandelWrite*` methods.
 */
function m_UpdateProjectFile(projId, data) {
  const project = PROJECT.GetProject(projId);
  project.id = data.id || project.id;
  project.label = data.label || project.label;
  project.metadata = data.metadata || project.metadata;
  project.rounds = data.rounds || project.rounds;
  project.blueprints = data.blueprints || project.blueprints;
  project.instances = data.instances || project.instances;
  m_FileWriteProject(projId, project);
}

/** API: export a project as JSON file via browser */
async function CreateFileFromTemplate(templateId, newfilename) {
  // 1. open the template file
  const PROJECT_LOADER = ASSETS.GetLoader('projects');
  const project = PROJECT_LOADER.getProjectByProjId(templateId);
  if (project === undefined)
    throw new Error(
      `CreateFileFromTemplate could not find template ${templateId}`
    );
  // 2. update the id
  project.id = newfilename;
  // 3. save as a new file
  return m_FileWriteProject(newfilename, project);
}

/// URSYS HANDLERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

async function HandleLoadProject(data: { projId: string }) {
  if (data === undefined || data.projId === undefined)
    throw new Error(`${[...PR]} Called with bad projId: ${data}`);
  return m_LoadProjectFromAsset(data.projId);
}
async function HandleWriteProject(data: { projId: string; project: any }) {
  if (DBG) console.log('WRITE PROJECT', data);
  m_FileWriteProject(data.projId, data.project);
}
async function HandleWriteRounds(data: { projId: string; rounds: any[] }) {
  if (DBG) console.log('WRITE ROUND', data);
  m_UpdateProjectFile(data.projId, data);
}
async function HandleWriteBlueprints(data: {
  projId: string;
  blueprints: any[];
}) {
  if (DBG) console.log('WRITE BLUEPRINTS', data);
  m_UpdateProjectFile(data.projId, data);
}
async function HandleWriteInstances(data: { projId: string; instances: any[] }) {
  if (DBG) console.log('WRITE INSTANCES', data);
  m_UpdateProjectFile(data.projId, data);
}

/// URSYS API /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Handle both LOCAL and NET requests.  ('*' is deprecated)
UR.HandleMessage('LOCAL:DC_LOAD_PROJECT', HandleLoadProject);
UR.HandleMessage('LOCAL:DC_WRITE_PROJECT', HandleWriteProject);
UR.HandleMessage('LOCAL:DC_WRITE_ROUNDS', HandleWriteRounds);
UR.HandleMessage('LOCAL:DC_WRITE_BLUEPRINTS', HandleWriteBlueprints);
UR.HandleMessage('LOCAL:DC_WRITE_INSTANCES', HandleWriteInstances);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  CreateFileFromTemplate // called by PanelSelectSimulation.jsx
};

/// TEST CODE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
