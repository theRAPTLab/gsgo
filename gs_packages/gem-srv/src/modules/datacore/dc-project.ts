/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Data Data Core

  IMPORTANT: This should only be imported to components that run on the main
  server!  Other pages (e.g. ScriptEditor, CharController, and Viewer do not
  have direct access to project data)

  This should be a pure data class that maintains a list of input objects
  and the agents it updates.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { GetProject } from 'modules/appcore/ac-project';
import * as ASSETS from 'modules/asset_core';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - -
const PR = UR.PrefixUtil('DC-PROJ', 'TagPurple');
const DBG = false;

/// MULTIPLE PROJECTS DATABASE QUERIES ////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Loads the list of project names and ids from graphQL */
async function m_LoadProjectNames() {
  const response = await UR.Query(`
    query {
      projectNames { id label }
    }
  `);
  if (!response.errors) {
    if (DBG) console.log(...PR('m_LoadProjectNames response', response));
    const { projectNames } = response.data;
    const data = { projectNames }; // redundant, for clarification
    UR.RaiseMessage('*:DC_PROJECTS_UPDATE', data);
    return;
  }
  console.error(...PR('m_LoadProjectNames ERROR response:', response));
}

/// SINGLE PROJECT DATABASE QUERIES ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// PROJECT

/** Load project to state from project json */
async function m_LoadProject(projId, project) {
  const data = { projId, project }; // redundant, for clarification
  UR.RaiseMessage('*:DC_PROJECT_UPDATE', data);
  return { ok: true };
}

async function m_LoadProjectFromAsset(projId) {
  const PROJECT_LOADER = ASSETS.GetLoader('projects');
  const project = PROJECT_LOADER.getProjectByProjId(projId);
  return m_LoadProject(projId, project);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function m_LoadProjectFromDB(projId) {
  console.log(...PR(`(1) LOAD PROJECT DATA ${projId}`));
  const response = await UR.Query(`
    query {
      project(id:"${projId}") {
        id
        label
        metadata { top right bottom left wrap bounce bgcolor roundsCanLoop}
        rounds { id label time intro outtro initScript endScript }
        blueprints { id label scriptText }
        instances { id label bpid initScript }
      }
    }
  `);
  if (!response.errors) {
    const { project } = response.data;
    const data = { projId, project }; // redundant, for clarification
    UR.RaiseMessage('*:DC_PROJECT_UPDATE', data);
    return { ok: true };
  }
  console.error(...PR('m_LoadProjectNames ERROR response:', response));
  return { ok: false, err: response };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return Promise to write to database
 *  NOTE: Only updates project settings/metadata!!!  Rounds Blueprints, Instances are not updated.
 */
function promise_DBWriteProject(projId, project) {
  const result = UR.Mutate(
    `
  mutation UpdateProject($projectId:String $input:ProjectInput) {
    updateProject(projectId:$projectId,input:$input) {
      id
      label
      metadata {
        top
        right
        bottom
        left
        wrap
        bounce
        bgcolor
        roundsCanLoop
      }
      rounds {
        id
        label
        time
        intro
        outtro
        initScript
        endScript
      }
      blueprints {
        id
        label
        scriptText
      }
      instances {
        id
        label
        bpid
        initScript
      }
    }
  }`,
    {
      input: project,
      projectId: projId
    }
  );
  return result;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return Promise to write project settings (id, label, metdata) to database
 *  NOTE: Only updates project settings/metadata!!!  Rounds Blueprints, Instances are not updated.
 */
function promise_WriteProjectSettings(projId, project) {
  const result = UR.Mutate(
    `
  mutation UpdateProject($projectId:String $input:ProjectInput) {
    updateProject(projectId:$projectId,input:$input) {
      id
      label
      metadata {
        top
        right
        bottom
        left
        wrap
        bounce
        bgcolor
        roundsCanLoop
      }
    }
  }`,
    {
      input: project,
      projectId: projId
    }
  );
  return result;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// METADATA

// NOT USED CURRENTLY -- Project handles Metadata loading
// async function m_LoadMetadata(projId) {
//   if (DBG) console.log(...PR('(1) GET METADATA'));
//   const response = await UR.Query(
//     `
//     query GeMetadata($id:String!) {
//       project(id:$id) {
//         metadata { top right bottom left wrap bounce bgcolor roundsCanLoop }
//       }
//     }
//   `,
//     { id: projId }
//   );
//   if (!response.errors) {
//     const { metadata } = response.data;
//     updateAndPublish(metadata);
//   }
// }

/** return Promise to write metadata only (no id, label) to database */
function promise_WriteMetadata(projId, metadata) {
  return UR.Mutate(
    `
    mutation UpdateMetadata($projectId:String $input:ProjectMetaInput) {
      updateMetadata(projectId:$projectId,input:$input) {
        top
        right
        bottom
        left
        wrap
        bounce
        bgcolor
        roundsCanLoop
      }
    }`,
    {
      input: metadata,
      projectId: projId
    }
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// ROUNDS

// NOT USED CURRENTLY -- Project handles Rounds loading
// async function m_LoadRounds(projId) {
//   if (DBG) console.log(...PR('(1) GET ROUNDS DATA'));
//   const response = await UR.Query(`
//     query {
//       project(id:"${projId}") {
//         rounds { id label time intro outtro initScript endScript }
//       }
//     }
//   `);
//   if (!response.errors) {
//     const { rounds } = response.data;
//     updateAndPublish(rounds);
//   }
// }

/** return Promise to write to database */
async function promise_WriteRounds(projId, rounds) {
  const result = await UR.Mutate(
    `
    mutation UpdateRounds($projectId:String $input:[ProjectRoundInput]) {
      updateRounds(projectId:$projectId,input:$input) {
        id
        label
        time
        intro
        outtro
        initScript
        endScript
      }
    }`,
    {
      input: rounds,
      projectId: projId
    }
  );
  return result;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// BLUEPRINTS

// NOT USED CURRENTLY -- Project handles blueprint loading
// async function m_LoadBlueprints(projId) {
//   if (DBG) console.log(...PR('(1) GET ROUNDS DATA'));
//   const response = await UR.Query(`
//     query {
//       project(id:"${projId}") {
//         blueprints {
//           id
//           label
//           scriptText
//         }
//       }
//     }
//   `);
//   if (!response.errors) {
//     const { blueprints } = response.data;
//     updateAndPublish(projId, blueprints);
//   }
// }

/** return Promise to write to database */
function promise_WriteBlueprints(projId, blueprints) {
  const result = UR.Mutate(
    `
    mutation UpdateBlueprints($projectId:String $input:[ProjectBlueprintInput]) {
      updateBlueprints(projectId:$projectId,input:$input) {
        id
        label
        scriptText
      }
    }`,
    {
      input: blueprints,
      projectId: projId
    }
  );
  return result;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// INSTANCES

// NOT USED CURRENTLY -- Project handles instances loading
// async function m_LoadInstances(projId) {
//   if (DBG) console.log(...PR('(1) GET INSTANCES DATA'));
//   const response = await UR.Query(`
//     query {
//       project(id:"${projId}") {
//         instances { id label bpid initScript }
//       }
//     }
//   `);
//   if (!response.errors) {
//     const { instances } = response.data;
//     updateAndPublish(instances);
//   }
// }

/** return Promise to write to database */
function promise_WriteInstances(projId, instances) {
  const result = UR.Mutate(
    `
    mutation UpdateInstances($projectId:String $input:[ProjectInstanceInput]) {
      updateInstances(projectId:$projectId,input:$input) {
        id
        label
        bpid
        initScript
      }
    }`,
    {
      input: instances,
      projectId: projId
    }
  );
  return result;
}

async function FileWriteProject(projId, project) {
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

function UpdateProjectFile(projId, data) {
  const project = GetProject(projId);
  project.id = data.id || project.id;
  project.label = data.label || project.label;
  project.metadata = data.metadata || project.metadata;
  project.rounds = data.rounds || project.rounds;
  project.blueprints = data.blueprints || project.blueprints;
  project.instances = data.instances || project.instances;
  FileWriteProject(projId, project);
}

export async function CreateFileFromTemplate(templateId, newfilename) {
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
  return FileWriteProject(newfilename, project);
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
  FileWriteProject(data.projId, data.project);
  return promise_DBWriteProject(data.projId, data.project);
}

/// Not used at the moment -- ac-projects calls DC_WRITE_PROJECT/HandlewriteProject
async function HandleWriteProjectSettings(data: {
  projId: string;
  project: any;
}) {
  if (DBG) console.log('WRITE PROJECT SETTINGS', data);
  return promise_WriteProjectSettings(data.projId, data.project);
}

async function HandleWriteMetadata(data: { projId: string; metadata: any[] }) {
  if (DBG) console.log('WRITE ROUND', data);
  return promise_WriteMetadata(data.projId, data.metadata);
}

async function HandleWriteRounds(data: { projId: string; rounds: any[] }) {
  if (DBG) console.log('WRITE ROUND', data);
  UpdateProjectFile(data.projId, data);
  return promise_WriteRounds(data.projId, data.rounds);
}

async function HandleWriteBlueprints(data: {
  projId: string;
  blueprints: any[];
}) {
  if (DBG) console.log('WRITE BLUEPRINTS', data);
  UpdateProjectFile(data.projId, data);
  return promise_WriteBlueprints(data.projId, data.blueprints);
}

async function HandleWriteInstances(data: { projId: string; instances: any[] }) {
  if (DBG) console.log('WRITE INSTANCES', data);
  UpdateProjectFile(data.projId, data);
  return promise_WriteInstances(data.projId, data.instances);
}

/// URSYS API /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Handle both LOCAL and NET requests.  ('*' is deprecated)
UR.HandleMessage('LOCAL:DC_LOAD_PROJECT', HandleLoadProject);
UR.HandleMessage('LOCAL:DC_WRITE_PROJECT', HandleWriteProject);
UR.HandleMessage('LOCAL:DC_WRITE_PROJECT_SETTINGS', HandleWriteProjectSettings);
UR.HandleMessage('LOCAL:DC_WRITE_METADATA', HandleWriteMetadata);
UR.HandleMessage('LOCAL:DC_WRITE_ROUNDS', HandleWriteRounds);
UR.HandleMessage('LOCAL:DC_WRITE_BLUEPRINTS', HandleWriteBlueprints);
UR.HandleMessage('LOCAL:DC_WRITE_INSTANCES', HandleWriteInstances);

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// for loading data structures
UR.HookPhase(
  'UR/LOAD_DB',
  () =>
    new Promise<void>((resolve, reject) => {
      m_LoadProjectNames();
      console.log(...PR('resolved LOAD_DB'));
      resolve();
    })
);

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
window.putproject = putproject;
