/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Data Data Core

  IMPORTANT: This should only be imported to components that run on the main
  server!  Other pages (e.g. ScriptEditor, CharController, and Viewer do not
  have direct access to project data)

  This should be a pure data class that maintains a list of input objects
  and the agents it updates.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import Project from 'lib/class-project';
import * as TRANSPILER from 'script/transpiler-v2';
import * as ACMetadata from 'modules/appcore/ac-metadata';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('DC-PROJ', 'TagPurple');
const DBG = true;

export const PROJECT = new Project(); // currently loaded project
let PROJECT_ID: string = ''; // currently loaded project id

const MODEL: any = {};
const BOUNDS: any = {};

/// PRIVATE METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// API PRIVATE METHODS ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Loads the list of project names and ids from graphQL
 */
async function m_LoadProjectNames(): Promise<any[]> {
  const response = await UR.Query(`
    query {
      projectNames { id label }
    }
  `);
  if (!response.errors) {
    if (DBG) console.log(...PR('m_LoadProjectInfo response', response));
    const { projectNames } = response.data;
    return projectNames;
  }
  console.error(...PR('m_LoadProjectNames ERROR response:', response));
  return [];
}

/**
 * Loads project instance data from DB
 */
async function m_LoadProject(id): Promise<Project> {
  if (DBG) console.log(...PR('(1) GET PROJECT DATA'));
  const response = await UR.Query(`
    query {
      project(id:"${id}") {
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
    if (DBG) console.log(...PR('m_LoadProject response', response));
    // update state data
    const { project } = response.data;
    // cache
    PROJECT_ID = id;
    PROJECT.read(project);


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

export function SendBoundary() {
  const boundary = ACMetadata.GetBoundary();
  UR.RaiseMessage('NET:SET_BOUNDARY', {
    width: boundary.width,
    height: boundary.height,
    bgcolor: boundary.bgcolor
  });
}

/// ROUNDS METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Rounds loop by default

/// BLUEPRINT METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of properties {name, type, defaultvalue, isFeatProp}
 * that have been defined by the blueprint.
 * Used to populate property menus when selecting properties to show
 * in InstanceInspectors
 * @param {string} blueprintName
 * @param {string} [modelId=currentModelId]
 * @return {Object[]} [...{ name, type, defaultValue, isFeatProp }]
 */
export function GetBlueprintProperties(blueprintName) {
  const blueprint = PROJECT.GetBlueprint(blueprintName);
  if (!blueprint) return []; // blueprint was probably deleted
  return TRANSPILER.ExtractBlueprintProperties(blueprint.scriptText);
}
export function GetBlueprintPropertiesMap(blueprintName) {
  const blueprint = PROJECT.GetBlueprint(blueprintName);
  if (!blueprint) return []; // blueprint was probably deleted
  return TRANSPILER.ExtractBlueprintPropertiesMap(blueprint.scriptText);
}

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetProjectNames(): Promise<any[]> {
  return m_LoadProjectNames();
}
export function LoadProject(id): Promise<Project> {
  return m_LoadProject(id);
}
export function GetProject(id): Promise<Project> {
  return m_GetProject(id);
}

