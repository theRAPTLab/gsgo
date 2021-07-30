/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project DB - Database Module for Mission Control

  This reads and writes project definition data from the database.

  NOTE: This should NOT be used directly by ScriptEditor or PanelScript!!!

  Currently this is a placeholder class.  No data is saved between sessions.
  Eventually it will communicate with as erver database.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { UpdateDCModel, UpdateDCBounds } from 'modules/datacore/dc-project';

// HACK DATA LOADING
import { MODEL as SpringPilot } from '../../data/2021SpringPilot';
import { MODEL as AquaticModel } from '../../data/aquatic';
import { MODEL as DecompositionModel } from '../../data/decomposition';
import { MODEL as MothsModel } from '../../data/moths';
import { MODEL as MothsTwoModel } from '../../data/mothstwo';
import { MODEL as MothsTestModel } from '../../data/mothstest';
import { MODEL as MothsActTwo } from '../../data/moths-two';
import { MODEL as MothsSandbox } from '../../data/moths-sandbox';
import { MODEL as IUSandbox } from '../../data/iu-sandbox';
import { MODEL as SaltModel } from '../../data/salt';
import { MODEL as BeesModel } from '../../data/bees';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ProjectDB');
const DBG = true;

/// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// InstanceDef Ids should be strings, but hand-editing project files can
// result in numeric ids.  This will cause problems with AGENT_DICT lookups.
function m_FixInstanceIds(model) {
  if (!model) return {}; // not loaded yet
  const cleaned = model;
  cleaned.instances = cleaned.instances.map(i => {
    i.id = String(i.id);
    return i;
  });
  return cleaned;
}

/// API CALLS: MODEL DATA REQUESTS ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// List of projects and ids for selection
/// Read and return list of projects from db.
export function ReadProjectsList() {
  return [
    { id: 'pilot', label: 'Spring 2021 Pilot' },
    { id: 'aquatic', label: 'Aquatic Ecosystems' },
    { id: 'decomposition', label: 'Decomposition' },
    { id: 'moths', label: 'Moths' },
    { id: 'mothstwo', label: 'Moths Test Act A' },
    { id: 'mothstest', label: 'Moths Test Act B' },
    { id: 'moths-two', label: 'Moths Act Two' },
    { id: 'moths-sandbox', label: 'Moths Sandbox' },
    { id: 'iu-sandbox', label: 'IU Sandbox' },
    { id: 'salt', label: 'Salt' },
    { id: 'bees', label: 'Bees' }
  ];
}

/// This fakes a db call to read a specific model's data
export function ReadProject(modelId) {
  let model;
  switch (modelId) {
    case 'pilot':
      model = SpringPilot;
      break;
    case 'aquatic':
      model = AquaticModel;
      break;
    case 'decomposition':
      model = DecompositionModel;
      break;
    case 'moths':
      model = MothsModel;
      break;
    case 'mothstwo':
      model = MothsTwoModel;
      break;
    case 'mothstest':
      model = MothsTestModel;
      break;
    case 'moths-two':
      model = MothsActTwo;
      break;
    case 'moths-sandbox':
      model = MothsSandbox;
      break;
    case 'iu-sandbox':
      model = IUSandbox;
      break;
    case 'salt':
      model = SaltModel;
      break;
    case 'bees':
      model = BeesModel;
      break;
    default:
      break;
  }
  const res = m_FixInstanceIds(model);
  return res;
}

export function WriteProject(modelId, model) {}
