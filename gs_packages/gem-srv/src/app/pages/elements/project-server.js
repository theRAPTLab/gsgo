/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Server

  This loads and manages the project definition data, specifically:
  * blueprints
  * instance defintions
  * metadata
  * rounds

  It works hand in hand with Main to manage all data requests.

  How it's started:
  * 'projId' is set by Main reading the url parameter 'project'
  * 'UR/APP_START' then triggers Initialize

  NOTE: This should NOT be used directly by ScriptEditor or PanelScript!!!

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import UR from '@gemstep/ursys/client';
import * as TRANSPILER from 'script/transpiler-v2';
import 'modules/datacore/dc-project'; // must import to load db
import {
  GetAllAgents,
  GetAgentById,
  DeleteAgent,
  DeleteInstance,
  GetInstancesType
} from 'modules/datacore/dc-agents';
import { POZYX_TRANSFORM, InputsReset } from 'modules/datacore/dc-inputs';
import * as ACProject from 'modules/appcore/ac-project';
import * as ACMetadata from 'modules/appcore/ac-metadata';
import * as ACBlueprints from 'modules/appcore/ac-blueprints';
import * as ACInstances from 'modules/appcore/ac-instances';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ReportMemory } from 'modules/render/api-render';
import { IsRunning, RoundHasBeenStarted } from 'modules/sim/api-sim';
import SIMCTRL from './mod-sim-control';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ProjData', 'TagBlue');
const DBG = false;

let PARENT_COMPONENT; // e.g. Main.jsx

let CURRENT_PROJECT_ID;
let CURRENT_PROJECT;
const MONITORED_INSTANCES = [];

/// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function getLocaleIdFromLocalStorage() {
  const localeId = localStorage.getItem('localeId');
  return Number(localeId !== null ? localeId : 4);
}
function saveLocaleIdToLocalStorage(id) {
  localStorage.setItem('localeId', id);
}

/// STATE UPDATE HANDLERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function urLocaleStateUpdated(stateObj, cb) {
  // if update was to localeID, save localeID to localStorage
  if (stateObj.localeId) saveLocaleIdToLocalStorage(stateObj.localeId);

  // Read the current transforms
  const state = UR.ReadFlatStateGroups('locales');

  // Copy to POZYX_TRANSFORM
  const data = state.transform;
  POZYX_TRANSFORM.scaleX = data.xScale;
  POZYX_TRANSFORM.scaleY = data.yScale;
  POZYX_TRANSFORM.translateX = data.xOff;
  POZYX_TRANSFORM.translateY = data.yOff;
  POZYX_TRANSFORM.useAccelerometer = data.useAccelerometer;

  if (typeof cb === 'function') cb();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function urProjectStateUpdated(stateObj, cb) {
  if (DBG) console.log(...PR('urProjectStateUpdated', stateObj));
  const { project } = stateObj;
  CURRENT_PROJECT = project;
  if (typeof cb === 'function') cb();
}

/// INSPECTOR UTILS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * On every system loop, we broadcast instance updates
 * for any instances that have registered for modeling.
 * We keep this list small to keep from flooding the net with data.
 */
export function SendInspectorUpdate(frametime) {
  if (frametime % 30 !== 0) return;
  // walk down agents and broadcast results for monitored agents
  const agents = GetAllAgents();
  // Send all instances, but minmize non-monitored
  const inspectorAgents = agents.map(a =>
    MONITORED_INSTANCES.includes(a.id)
      ? a
      : { id: a.id, label: a.name, blueprint: a.blueprint }
  );

  // Debug PIXI Output
  // if (DBG) ReportMemory(frametime);

  // Broadcast data
  UR.RaiseMessage('NET:INSPECTOR_UPDATE', { agents: inspectorAgents });
}
/**
 * PanelSimulation keeps track of any instances that have been requested
 * for inspector monitoring.
 * We allow duplicate registrations so that when one device unregisters,
 * the instance is still considered monitored.
 * @param {Object} data { name: <string> } where name is the agent name.
 */
export function DoRegisterInspector(data) {
  const id = data.id;
  MONITORED_INSTANCES.push(id);
  // force inspector update immediately so that the inspector
  // will open up.  otherwise there is a 1 second delay
  SendInspectorUpdate(30);
}
export function DoUnRegisterInspector(data) {
  const id = data.id;
  const i = MONITORED_INSTANCES.indexOf(id);
  if (i > -1) MONITORED_INSTANCES.splice(i, 1);
}

/// PROJECT DATA PRE INIT /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// Called by Main
/// Load application-specific settings (current locale, projId as defined by URL)
export function ProjectDataPreInit(parent, projId) {
  PARENT_COMPONENT = parent;
  CURRENT_PROJECT_ID = projId; // Save slug to load after urStateUpdated

  UR.SubscribeState('locales', urLocaleStateUpdated);
  UR.SubscribeState('project', urProjectStateUpdated);

  // Load currently saved locale
  const localeId = getLocaleIdFromLocalStorage();
  UR.WriteState('locales', 'localeId', localeId);
}

/// MAIN INITIALIZATION ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// Hooked to APP_START
async function Initialize() {
  // 1. Check for other 'Sim' devices.
  const devices = UR.GetDeviceDirectory();
  const sim = devices.filter(d => d.meta.uclass === 'Sim');
  if (sim.length > 0) {
    PARENT_COMPONENT.FailSimAlreadyRunning();
    return;
  }

  // 2. Load Model from DB
  UR.CallMessage('LOCAL:DC_LOAD_PROJECT', { projId: CURRENT_PROJECT_ID })
    .then(status => {
      const { err } = status;
      if (err) console.error(err);
      return status;
    })
    .then(status => {
      if (DBG) console.log('DC_LOAD_PROJECT status:', status);
      SIMCTRL.SimPlaces(CURRENT_PROJECT);
    });

  // 3. Register as 'Sim' Device
  // devices templates are defined in class-udevice.js
  const dev = UR.NewDevice('Sim');
  const { udid, status, error } = await UR.RegisterDevice(dev);
  if (error) console.error(error);
  if (status) console.log(...PR(status));
  if (udid) PARENT_COMPONENT.DEVICE_UDID = udid;

  // 4. Listen for Controllers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const charControllerDevAPI = UR.SubscribeDeviceSpec({
    selectify: device => device.meta.uclass === 'CharControl',
    notify: deviceLists => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { selected, quantified, valid } = deviceLists;
      if (valid) {
        PARENT_COMPONENT.UpdateDeviceList(selected);
      }
    }
  });

  // 5. Housekeeping
  UR.HookPhase('SIM/UI_UPDATE', SendInspectorUpdate);
  PARENT_COMPONENT.setState({
    projId: CURRENT_PROJECT_ID
  });
}

/// Called by Main.LoadModel after a SIM RESET
export async function ReloadProject() {
  CURRENT_PROJECT = ACProject.GetProject(CURRENT_PROJECT_ID);
  await ACProject.TriggerProjectStateUpdate();
  SIMCTRL.SimPlaces(CURRENT_PROJECT);
}

/// API CALLS: MODEL DATA REQUESTS ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// HACKY DOWNLOAD FILE
/// Used to export project
function DownloadToFile(content, filename, contentType) {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function ExportProject(id) {
  const jsonString = JSON.stringify(ACProject.GetProject());
  DownloadToFile(jsonString, `${id}.gemprj`, 'application/json');
}

/// Handle ScriptEditor's request for current project data
/// Used by REQ_PROJ_DATA
function RequestProject(projId = CURRENT_PROJECT_ID) {
  if (projId === undefined)
    throw new Error(
      'Tried to current GetProject before setting CURRENT_PROJECT_ID'
    );
  return ACProject.GetProject();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// Used by REQ_PROJ_DATA and Main
export function GetBoundary() {
  return ACMetadata.GetBoundary();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// Used to inject the Cursor blueprint
export function InjectBlueprint(data) {
  const { blueprint } = data;
  // Skip if already defined
  if (ACBlueprints.GetBlueprint(blueprint.id)) {
    return;
  }
  ACBlueprints.AddBlueprint(CURRENT_PROJECT_ID, blueprint);

  // Compile and Register
  // REVIEW: Should this be moved to ACBlueprints
  const source = TRANSPILER.ScriptifyText(blueprint.scriptText);
  const bundle = TRANSPILER.CompileBlueprint(source);
  TRANSPILER.RegisterBlueprint(bundle);
}

/// TRANSFORM UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
}
/// MODEL UPDATE BROADCASTERS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Raised by project-server at:
 *   *  InstanceAdd
 *   *  ScriptUpdate
 * Broadcasts changes to
 *   *  Main: Calls SimPlaces
 *   *  ScriptEditor: Updates script
 *   *  PanelScript: Update highlight
 * @param {*} projId
 */
function RaiseModelUpdate(projId = CURRENT_PROJECT_ID) {
  const project = ACProject.GetProject(projId);
  UR.RaiseMessage('NET:UPDATE_MODEL', { projId, project });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Used by Viewer via REQ_PROJ_DATA
function GetBpidList(projId = CURRENT_PROJECT_ID) {
  const bpidList = ACBlueprints.GetBlueprintIDsList();
  return { projId, bpidList };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RaiseBpidListUpdate(projId = CURRENT_PROJECT_ID) {
  UR.RaiseMessage('NET:BPIDLIST_UPDATE', GetBpidList(projId));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Used by Viewer via REQ_PROJ_DATA
function GetInstanceidList(projId = CURRENT_PROJECT_ID) {
  const instancesList = ACInstances.GetInstanceidList();
  return { projId, instancesList };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RaiseInstancesListUpdate(projId = CURRENT_PROJECT_ID) {
  UR.RaiseMessage('NET:INSTANCESLIST_UPDATE', GetInstanceidList(projId));
}

/// API CALLS: BLUEPRINT DATA REQUESTS ////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns array of blueprint names that are controllable by user input.
 * Used to set sim-inputs and CharControl.
 * CharControl requests this list directly via REQ:PROJ_DATA
 * @return {string[]} [ ...bpid ]
 */
function GetCharControlBpidList() {
  return ACBlueprints.GetCharControlBpidList();
}
function GetPozyxBPNames() {
  return ACBlueprints.GetPozyxControlBpidList();
}
/**
 * Removes the script from the project and any instances using the blueprint
 * @param {string} blueprintName
 */
function BlueprintDelete(blueprintName) {
  // Delete any insmtances using the blueprint
  ACInstances.DeleteInstancesByBPID(blueprintName);
  // Delete the old blueprint from project
  ACBlueprints.DeleteBlueprint(blueprintName);

  // The instance delete and blueprint delete do trigger state updates
  // but project-server only listents to `project` state updates
  // so we have to trigger the updates locally as well as for remote viewers
  // These only trigger URSYS updates, not state updates!
  RaiseModelUpdate();
  RaiseBpidListUpdate();
  RaiseInstancesListUpdate();
}
function HandleBlueprintDelete(data) {
  BlueprintDelete(data.blueprintName, data.modelId);
}

/// INSTANCE SPEC UTILS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// This handles the editing of the <project>.js file's `instances` object
/// specification.  It does not create actual agent instances.
/**
 * Used by InstanceUpdatePosition to find and replace existing
 * prop setting lines.
 * @param {string} propName -- Name of the prop to change, e.g. x/y
 * @param {string} propMethd -- Prop method to change, e.g. setTo
 * @param {string} params -- Parameter for the prop method, e.g. 200
 * @param {string[]} scriptTextLines -- Full ScriptText as an array of strings
 */
function ReplacePropLine(propName, propMethod, params, scriptTextLines) {
  const lineNumber = scriptTextLines.findIndex(line => {
    let found = line.includes(`prop ${propName} ${propMethod}`);
    if (!found) found = line.includes(`prop agent.${propName} ${propMethod}`);
    return found;
  });
  const newLine = `prop ${propName} ${propMethod} ${params}`;
  if (lineNumber === -1) {
    console.warn(
      `project-server.ReplacePositionLine: No "prop ${propName} ${propMethod}..." line found.  Inserting new line.`
    );
    scriptTextLines.push(newLine);
  } else {
    scriptTextLines[lineNumber] = newLine;
  }
}
/**
 * User is adding a new instance via MapEditor
 * @param {Object} data -- { modelId, blueprintName, initScript }
 */
export function InstanceAdd(data, sendUpdate = true) {
  const id = ACInstances.GetInstanceUID();
  const instance = {
    id,
    label: `${data.blueprintName}${id}`,
    bpid: data.blueprintName,
    initScript: data.initScript
  };

  // If blueprint has `# PROGRAM INIT` we run that
  // otherwise we auto-place the agent around the center of the screen
  const blueprint = ACBlueprints.GetBlueprint(data.blueprintName);
  const hasInit = TRANSPILER.HasDirective(blueprint.script, 'INIT');
  const SPREAD = 100;
  if (!hasInit && !instance.initScript) {
    instance.initScript = `prop x setTo ${Math.trunc(RNG() * SPREAD - SPREAD / 2)}
prop y setTo ${Math.trunc(RNG() * SPREAD - SPREAD / 2)}`;
  }

  ACInstances.AddInstance(instance);

  if (sendUpdate) {
    RaiseModelUpdate(data.modelId);
    RaiseInstancesListUpdate();
  }
}
/**
 * Removes instance from the stage
 * @param {bpid, id} data
 */
export function InstanceDelete(data) {
  // Remove from Sim
  DeleteInstance(data);
  DeleteAgent(data);
  // RaiseModelUpdate(data.modelId); // not needed?  shouldn't state cause this?
}

/**
 * HACK: Manually change the init script when updating position.
 * This is mostly used to support drag and drop
 * @param {Object} data -- { projId, instanceId, updatedData: {x, y} }
 */
export function InstanceUpdatePosition(data) {
  const instance = ACInstances.GetInstance(data.instanceId);
  if (!instance) return; // Pozyx/PTrack instances are not in model.instances, so ignore
  let scriptTextLines = instance.initScript
    ? instance.initScript.split('\n')
    : [];
  ReplacePropLine('x', 'setTo', data.updatedData.x, scriptTextLines);
  ReplacePropLine('y', 'setTo', data.updatedData.y, scriptTextLines);
  const scriptText = scriptTextLines.join('\n');
  instance.initScript = scriptText;
  ACInstances.WriteInstance(instance);
}
/**
 * User is requesting to edit an instance
 * Can be triggered by:
 *   * Simulation View: Clicking on an instance in simulation
 *   * Map Instances View: Clicking on an instance in list
 *     (This is handled directly in InstanceEditor.OnInstanceClick,
 *      passed via SIM_INSTANCE_CLICK and Main.HanldeSimInstanceClick)
 * @param {object} data -- {projId, agentId}
 */
export function InstanceRequestEdit(data) {
  // 0. Check for Locking
  //    TODO: Prevent others from editing?
  //          May not be necessary if we only allow one map editor
  // 1. Set Agent Data
  const agent = GetAgentById(data.agentId);
  // 2. If already selected, deselect it.
  if (agent.isSelected) {
    // 2a. Deselect it
    agent.setSelected(false);
    // Update UI
    UR.RaiseMessage('INSTANCE_EDIT_DISABLE', data);
  } else {
    // 2b. Select it for editing
    agent.setSelected(true);
    // Update UI
    UR.RaiseMessage('INSTANCE_EDIT_ENABLE', data);
  }
}

/// API CALLS: SCRIPT DATA REQUESTS ////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Scrubs the init script and removes any invalid props
 * Used by ScriptUpdate in case edit removed props that are no longer valid
 * Should ignore featProps and other calls
 * @param {object} instance instanceDef from models.instances
 * @param {string[]} validPropNames e.g. ['x', 'y']
 * @return {object} InstanceDef with init scrubbed
 */
function m_RemoveInvalidPropsFromInstanceInit(instance, validPropNames) {
  const scriptUnits = TRANSPILER.ScriptifyText(instance.initScript);
  const scrubbedScriptUnits = scriptUnits.filter(unit => {
    if (unit[0] && unit[0].token === 'prop') {
      return validPropNames.includes(unit[1].token);
    }
    return true; // ignore other methods
  });
  instance.initScript = TRANSPILER.TextifyScript(scrubbedScriptUnits);
  return instance;
}

/**
 * Update the script for a single blueprint (not all blueprints in the model)
 * This should just update the `model.scripts` and `model.instances` data.
 * Any sim instance/agent data updates should be handled by sim-agents.
 * ASSUMES: Updating the current model
 * @param {Object} data -- { projId, script, origBlueprintName }
 */
function ScriptUpdate(data) {
  const source = TRANSPILER.ScriptifyText(data.script);
  const bundle = TRANSPILER.CompileBlueprint(source); // compile to get name
  const bpid = bundle.name;

  // 1. Did the blueprint name change?  Remove the old blueprint
  if (data.origBlueprintName !== bpid) {
    // If name changed, remove the original
    BlueprintDelete(data.origBlueprintName);
    // NOTE We have to delete before adding the new blueprint otherwise
    //      the default pozyx might be set to a non-existent blueprint
    // NOTE sim agents and instances are added/removed in sim-agents.AllAgentsProgramUpdate
  }

  // 2. Add or update the blueprint
  ACBlueprints.UpdateBlueprint(data.projId, bpid, data.script);

  // 3. Convert instances
  if (data.origBlueprintName !== bpid) {
    // If name changed, change existing instances to use the new blueprint
    // Name change should only happen after the new blueprint is defined
    // otherwise we end up defining instances for nonexisting blueprints
    ACInstances.RenameInstanceBlueprint(data.origBlueprintName, bpid);
  }

  // 3. Clean the init scripts
  const validPropDefs = TRANSPILER.ExtractBlueprintProperties(data.script);
  const validPropNames = validPropDefs.map(d => d.name);
  const instances = ACInstances.GetInstances();
  const cleanedInstances = instances.map(i => {
    // Only clean init scripts for the submitted blueprint
    if (i.bpid !== bpid) return i;
    return m_RemoveInvalidPropsFromInstanceInit(i, validPropNames);
  });
  ACInstances.WriteInstances(cleanedInstances);

  // 4. Delete the old instance
  //    If the sim is not running, delete the old instance
  //    so AllAgentsPropgramUpdate will recreate it with
  //    the new script.
  //    If the sim IS running, we want to leave the instance
  //    running with the old blueprint code.
  //
  //    Also skip reset if we're in the middle of multiple rounds of
  //    running.  (RoundHasBeenStarted)
  if (!IsRunning() && !RoundHasBeenStarted()) {
    GetInstancesType(bpid).forEach(a => DeleteAgent(a));
    // Also delete input agents
    InputsReset();
  }

  // 5. Inform network devices
  RaiseModelUpdate();
  RaiseBpidListUpdate();
  RaiseInstancesListUpdate();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// INSTANCE SELECTION HANDLERS ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Toggles the selection state of the agent
 * @param {object} data -- {projId, agentId}
 */
export function InstanceSelect(data) {
  const agent = GetAgentById(data.agentId);
  agent.setSelected(true);
}
/**
 * Deselects the selection state of the agent
 * @param {object} data -- {projId, agentId}
 */
export function InstanceDeselect(data) {
  const agent = GetAgentById(data.agentId);
  if (agent) {
    // agent may have been deleted, so make sure it still exists
    agent.setSelected(false);
  }
}
/**
 * Turns hover on
 * @param {object} data -- {projId, agentId}
 */
export function InstanceHoverOver(data) {
  const agent = GetAgentById(data.agentId);
  if (agent) {
    // agent may have been deleted, so make sure it still exists
    agent.setHovered(true);
  }
}
/**
 * Turns hover off
 * @param {object} data -- {projId, agentId}
 */
export function InstanceHoverOut(data) {
  const agent = GetAgentById(data.agentId);
  if (agent) {
    // agent may have been deleted, so make sure it still exists
    agent.setHovered(false);
  }
}

/// URSYS MODEL DATA REQUESTS//////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Flexible Project Data Requester
 * 1. Checks if the passed request is a valid function
 * 2. If so, execute it.
 * @param {*} data
 * @returns
 */
/// Map mod.<functionName> so they can be called by HandleRequestProjData
const mod = {};
mod.RequestProject = RequestProject;
mod.GetProjectBoundary = GetBoundary; // Mapping clarifies target
mod.GetCharControlBpidList = GetCharControlBpidList;
mod.GetBlueprintProperties = ACBlueprints.GetBlueprintProperties;
mod.GetBpidList = GetBpidList;
mod.GetInstanceidList = GetInstanceidList;
/// Call Handler
async function HandleRequestProjData(data) {
  if (DBG) console.log('NET:REQ_PROJDATA got request', data);
  if (!data.fnName) {
    console.error(...PR('NET:REQ_PROJDATA got bad function name', data.fnName));
    return { result: undefined };
  }
  if (!mod[data.fnName]) {
    console.error(
      ...PR(`NET:REQ_PROJDATA Calling unknown function: ${data.fnName}!`)
    );
    return { result: undefined };
  }
  const fn = mod[data.fnName]; // convert call data into a function
  if (typeof fn === 'function') {
    let res;
    if (data.parms && Array.isArray(data.parms)) res = fn(...data.parms);
    else res = fn();
    return { result: await res };
  }
  console.error(
    ...PR(`NET:REQ_PROJDATA Failed with ${data.fnName} -- not a function?`)
  );
  return { result: undefined };
}

/// UR HANDLERS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// TRANSFORM UTILS -----------------------------------------------------------
UR.HandleMessage('NET:POZYX_TRANSFORM_REQ', HandlePozyxTransformReq);
/// PROJECT DATA UTILS ----------------------------------------------------

UR.HandleMessage('REQ_PROJDATA', HandleRequestProjData);
UR.HandleMessage('NET:REQ_PROJDATA', HandleRequestProjData);
UR.HandleMessage('NET:SCRIPT_UPDATE', ScriptUpdate);
UR.HandleMessage('NET:BLUEPRINT_DELETE', HandleBlueprintDelete);
UR.HandleMessage('INJECT_BLUEPRINT', InjectBlueprint);
/// INSTANCE EDITING UTILS ----------------------------------------------------
UR.HandleMessage('LOCAL:INSTANCE_ADD', InstanceAdd);
UR.HandleMessage('NET:INSTANCE_UPDATE_POSITION', InstanceUpdatePosition);
UR.HandleMessage('LOCAL:INSTANCE_DELETE', InstanceDelete);
// INSPECTOR UTILS --------------------------------------------------------
UR.HandleMessage('NET:INSPECTOR_REGISTER', DoRegisterInspector);
UR.HandleMessage('NET:INSPECTOR_UNREGISTER', DoUnRegisterInspector);
// INSTANCE SELECTION HANDLERS --------------------------------------------
UR.HandleMessage('NET:INSTANCE_SELECT', InstanceSelect);
UR.HandleMessage('NET:INSTANCE_DESELECT', InstanceDeselect);
UR.HandleMessage('INSTANCE_HOVEROVER', InstanceHoverOver);
UR.HandleMessage('INSTANCE_HOVEROUT', InstanceHoverOut);

/// UR HOOKS //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('UR/APP_START', Initialize);

/// EXPORT MODULE API /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for exports

export { GetPozyxBPNames, BlueprintDelete };
