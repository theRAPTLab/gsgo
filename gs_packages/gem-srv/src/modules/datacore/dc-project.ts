/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Data Data Core

  IMPORTANT: This should only be imported to components that run on the main
  server!  Other pages (e.g. ScriptEditor, CharController, and Viewer do not
  have direct access to project data)

  This should be a pure data class that maintains a list of input objects
  and the agents it updates.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - -
const PR = UR.PrefixUtil('DC-PROJ', 'TagPurple');
const DBG = true;

/// MULTIPLE PROJECTS DATABASE QUERIES ////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Loads the list of project names and ids from graphQL
 */
async function m_LoadProjectNames() {
  const response = await UR.Query(`
    query {
      projectNames { id label }
    }
  `);
  if (!response.errors) {
    if (DBG) console.log(...PR('m_LoadProjectInfo response', response));
    const { projectNames } = response.data;
    const data = { projectNames }; // redundant, for clarification
    UR.RaiseMessage('*:DC_PROJECTS_UPDATE', data);
    return;
  }
  console.error(...PR('m_LoadProjectNames ERROR response:', response));
}

/// SINGLE PROJECT DATABASE QUERIES ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function m_LoadProject(projId) {
  console.log(...PR(`(1) LOAD PROJECT DATA ${projId}`));
  const response = await UR.Query(`
    query {
      project(id:"${projId}") {
        id
        label
        metadata { top right bottom left wrap bounce bgcolor roundsCanLoop}
        rounds { id label time intro outtro initScript endScript }
        blueprints { id label isCharControllable isPozyxControllable scriptText }
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
/** return Promise to write to database */
function promise_WriteProject() {
  console.error('promise_WriteProject!!!');
  const projId = _getKey('projId');
  const input = _getKey('project');
  const result = UR.Mutate(
    `
    mutation UpdateProject($projectId:String $input:ProjectInput) {
      updateProject(projectId:$projectId,input:$input) {
        id
        label
      }
    }`,
    {
      input,
      projectId: projId
    }
  );
  return result;
}


    return PROJECT;
  }
  return undefined;
}
/**
 * Returns cached project if project id matches
 * otherwise loads the project from db
 */
function m_GetProject(id = PROJECT_ID): Promise<Project> {
  // Return cached project
  if (id === PROJECT_ID && PROJECT) return PROJECT;
  return m_LoadProject(id);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Local Updates

function m_UpdateDCBounds(bounds) {
  BOUNDS.top = bounds.top;
  BOUNDS.right = bounds.right;
  BOUNDS.bottom = bounds.bottom;
  BOUNDS.left = bounds.left;
  BOUNDS.wrap = bounds.wrap;
  BOUNDS.bounce = bounds.bounce;
  BOUNDS.bgcolor = bounds.bgcolor;
}
export function UpdateDCModel(model) {
  MODEL.label = model.label;
  MODEL.rounds = model.rounds;
  MODEL.scripts = model.scripts;
  MODEL.instances = model.instances;
  const bounds = model.metadata || {
    top: -400, // default if not set
    right: 400,
    bottom: 400,
    left: -400
  };
  m_UpdateDCBounds(bounds);
}

/// BOUNDS METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// REVIEW: Can we handle all this with the REQ_PROJDATA calls?
//         so we don't even need this class?


/// ROUNDS METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Rounds loop by default

/// URSYS HANDLERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

async function HandleLoadProject(data: { projId: string }) {
  if (data === undefined || data.projId === undefined)
    throw new Error(`${[...PR]} Called with bad projId: ${data}`);
  const project = await m_LoadProject(data.projId);

  // HACK: This should be a return to a CallMessage request.
  // Raising an UR message until we figure out why CallMessage is not working
  UR.RaiseMessage('DC_PROJECT_LOADED', { project });
}
}

/// URSYS API /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

UR.HandleMessage('*:DC_LOAD_PROJECT', HandleLoadProject);
}

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
