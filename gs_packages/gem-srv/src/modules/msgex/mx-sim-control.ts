/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Sim Control - Message Exchange API Module (MSGEX)

  This is a super-module that exists on top of *core modules, implementing an
  API that runs independently of a GUI. Loading a MSGEX module makes the
  URSYS-based message API available to all modules in the loaded app context.

  This style of module is useful if you don't want to directly load a
  module with a function-based API, or you want to wrap an existing
  function-based API as a message service that's accessible across through
  URSYS messaging, or you need to somehow coordinate several message
  service (both incoming and outgoing) across some direct API modules.

  As it is, this module has a confused identity. It has been converted from a
  overly complicated class to a straightforward module.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as APISIM from 'modules/sim/api-sim';
import * as RENDERER from 'modules/render/api-render';

import * as AGENTS from 'modules/datacore/dc-sim-agents';
import * as INPUTS from 'modules/datacore/dc-inputs';

import * as ACMetadata from 'modules/appcore/ac-metadata';
import * as ACBlueprints from 'modules/appcore/ac-blueprints';
import * as ACInstances from 'modules/appcore/ac-instances';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('MXSimController');
const DBG = false;

/// DIRECT API: SIMULATION SETUP //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Compiles blueprints after model loading. Also updates the boundary display
 *  (since model might define new boundaries) */
function SimPlaces() {
  // try {
  if (DBG) console.warn(...PR('SimPlaces!'));
  // 2. Show Boundary
  const boundary = ACMetadata.GetBoundary();
  RENDERER.SetBoundary(boundary.width, boundary.height, boundary.bgcolor);
  // And Set Listeners too
  UR.RaiseMessage('NET:SET_BOUNDARY', {
    width: boundary.width,
    height: boundary.height,
    bgcolor: boundary.bgcolor
  });
  // 3. Update Input System
  //    Set Input transforms
  INPUTS.SetInputStageBounds(boundary.width, boundary.height); // dc-inputs
  //    Set char controlled agents
  //    This is primarily for Viewers
  const charcontrolBpidList = ACBlueprints.GetCharControlBpNames();
  UR.RaiseMessage('NET:SET_CHARCONTROL_BPIDLIST', {
    bpnames: charcontrolBpidList
  });
  // 4. Get current list of blueprint names so AllCharactersProgram knows which
  //    blueprints to update and remove
  const blueprintNames = ACBlueprints.GetBpNamesList();
  // 5. Create/Update All Instances
  const instancesSpec = ACInstances.GetInstances();
  UR.RaiseMessage('ALL_AGENTS_PROGRAM', {
    blueprintNames,
    instancesSpec
  });
  // 6. Update Cursor System
  //    This needs to happen AFTER instances are created
  //    since that is when the Cursor SM_Feature is loaded
  //    which in turn injects the Cursor blueprint.
  UR.RaiseMessage('COMPILE_CURSORS');
  // 7. Update Agent Display
  //    Agent displays are automatically updated during SIM/VIS_UPDATE
  // 8. Update Inspectors
  //    Inspectors will be automatically updated during SIM/UI_UPDATE phase
  // } catch (caught) {
  //   console.error('SimPlaces Error -- bad script?', caught);
  //   alert(`SimPlaces Error -- bad script? ${caught}`);
  // }
}

/// API WRAPPER: SIM CONTROL //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DoSimCostumes() {
  APISIM.GotoCostumeLoop();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DoSimReset() {
  if (APISIM.IsRunning()) UR.RaiseMessage('NET:HACK_SIM_STOP'); // stop first
  APISIM.Reset();
  // Clears script event functions, blueprint bundles, agents, global agents,
  // instances and recompiles the blueprints
  ACBlueprints.ResetAndCompileBlueprints();
  SimPlaces();
  UR.RaiseMessage('NET:SIM_WAS_RESET'); // Main needs to reset parms
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DoSimStart() {
  APISIM.Start();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DoSimStop() {
  APISIM.Stop(); // Stop Round
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DoSimNextRound() {
  APISIM.NextRound();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DoSimEnd() {
  APISIM.End();
}

/// API WRAPPER: SIM STATUS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsRunning() {
  return APISIM.IsRunning();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RoundsCompleted() {
  return APISIM.RoundsCompleted();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RoundHasBeenStarted() {
  return APISIM.RoundHasBeenStarted();
}

/// MESSAGE EXCHANGE API //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// this message api is used by MAIN's various buttons
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HandleMessage('NET:HACK_SIM_COSTUMES', () => DoSimCostumes());
UR.HandleMessage('NET:SIM_RESET', () => DoSimReset());
UR.HandleMessage('NET:HACK_SIM_START', () => DoSimStart());
UR.HandleMessage('NET:HACK_SIM_STOP', () => DoSimStop());
UR.HandleMessage('NET:HACK_SIM_NEXTROUND', () => DoSimNextRound());
UR.HandleMessage('NET:HACK_SIM_END', () => DoSimEnd());

/// DUMMY REGISTRATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** call this from the importing module to ensure that it is not tree-shaken
 *  out by webpack and never initializes */
function Register(parent?: any) {
  if (DBG) console.log(...PR('MESSAGE EXCHANGE API LOADED'), parent);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// direct API methods (see MESSAGE EXCHANGE API for URSYS services)
export {
  Register, // call this to ensure that module is loaded
  DoSimReset, // Reset and Recompile
  SimPlaces // simulator environment setup before first draw
};
export {
  IsRunning, // true if sim is running
  RoundsCompleted, // return number of rounds completed
  RoundHasBeenStarted // true if round has started
};
