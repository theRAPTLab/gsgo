/* eslint-disable consistent-return */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  AC WIZCORE TEST MODULE
  copy these back to

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { CompileBlueprint, TextToScript } from 'modules/sim/script/transpiler-v2';
import { GS_ASSETS_PROJECT_ROOT, GS_ASSETS_PATH } from 'config/gem-settings';
import { PromiseLoadAssets } from '../asset_core/asset-mgr';
import { State, SendState } from './ac-wizcore';
import * as WIZCORE from './ac-wizcore';

export * from './ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DEFAULT_PROJECT_ID = 'decomposition';

/// CONSOLE TOOL INSTALL //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let PROJECTS;
let SPRITES;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export async function DBG_LoadAssets() {
  [PROJECTS, SPRITES] = await PromiseLoadAssets(GS_ASSETS_PROJECT_ROOT);
  console.log(`'${GS_ASSETS_PROJECT_ROOT}' assets loaded`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export async function DBG_ListProjectsIds() {
  if (PROJECTS === undefined) await DBG_LoadAssets();
  const projects = PROJECTS.getProjectsList();
  console.log(`PROJECTS IN ${GS_ASSETS_PATH}/${GS_ASSETS_PROJECT_ROOT}`);
  projects.forEach(prj => {
    console.log('prjid:', prj.id);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export async function DBG_ListBPIds(prjId) {
  if (PROJECTS === undefined) await DBG_LoadAssets();
  if (typeof prjId !== 'string') return 'prjId required. use listProjects()';
  const project = PROJECTS.getProjectByProjId(prjId);
  if (!project || project.id === undefined)
    return `no projectId '${prjId}' in ${GS_ASSETS_PROJECT_ROOT}`;
  console.log(`BLUEPRINTS FOR PROJECT '${prjId}'`);
  const { blueprints } = project;
  if (Array.isArray(blueprints))
    blueprints.forEach(bp => {
      console.log('bpId:', bp.id);
    });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export async function DBG_LoadAllBlueprints(prjId = DEFAULT_PROJECT_ID) {
  if (PROJECTS === undefined) await DBG_LoadAssets();
  // concatenate all scripts
  let script_text = `SCRIPT DUMP OF '${prjId}'`;
  const { blueprints } = PROJECTS.getProjectByProjId(prjId);
  blueprints.forEach(bp => {
    const { id, label, scriptText } = bp;
    script_text += `\n\n// AUTOMATIC BLUEPRINT EXTRACTION OF: ${id} //\n${scriptText}`;
  });
  SendState({ script_text }, () => {});
  return `loaded all scripts found in ${GS_ASSETS_PROJECT_ROOT}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export async function DBG_LoadProjectBlueprint(prjId, bpId) {
  if (PROJECTS === undefined) await DBG_LoadAssets();
  const { blueprints } = PROJECTS.getProjectByProjId(prjId);
  if (!blueprints) return `no projectId '${prjId}'`;
  const found = blueprints.find(bp => bp.id === bpId);
  if (!found) return `no blueprint '${bpId}' found in '${prjId}'`;
  const { scriptText } = found;
  SendState({ script_text: scriptText }, () => {});
  console.log('list of blueprint ids for project:', prjId);
  DBG_ListBPIds(prjId);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool({
  'init_assets': () => {
    DBG_LoadAssets();
    if (PROJECTS === undefined) return 'loading assets...';
  },
  'load_blueprints': (projId = DEFAULT_PROJECT_ID) => {
    DBG_LoadAllBlueprints(projId);
    if (PROJECTS === undefined) return 'loading assets...';
  },
  'load_blueprint': (projId, bpId) => {
    DBG_LoadProjectBlueprint(projId, bpId);
    if (PROJECTS === undefined) return 'loading assets...';
  },
  'ls_projects': () => {
    DBG_ListProjectsIds();
    if (PROJECTS === undefined) return 'loading assets...';
  },
  'ls_blueprints': prjId => {
    DBG_ListBPIds(prjId);
    if (PROJECTS === undefined) return 'loading assets...';
  },
  'dump_token_atpos': (row, col) => {
    if (typeof row !== 'number') return 'arg1 is row number';
    if (typeof col !== 'number') return 'arg2 is col number';
    return State('line_tokmap').get(`${row},${col}`);
  }
});
