/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Sim Control - Control Module for Main

  Serves as the interface between project data and api-sim.

  This sets up all of the phase hooks that manage the running of
  the sim.

  NOTE: This should NOT be used directly by ScriptEditor or PanelScript!!!

  @BEN: All the stuff in here probably should be directly in api-sim, which
  IS the sim controller.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as TRANSPILER from 'script/transpiler-v2';
import * as APISIM from 'modules/sim/api-sim';
import { ClearDOBJ } from 'modules/sim/sim-agents';
import * as DCAGENTS from 'modules/datacore/dc-sim-agents';
import * as RENDERER from 'modules/render/api-render';
import { SetInputStageBounds } from 'modules/datacore/dc-inputs';
import * as ACMetadata from 'modules/appcore/ac-metadata';
import * as ACBlueprints from 'modules/appcore/ac-blueprints';
import * as ACInstances from 'modules/appcore/ac-instances';
import * as SM_Agent from 'lib/class-sm-agent';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SimControl');
const DBG = false;

/// CLASS DEFINTION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SimControl {
  constructor() {
    // RUN HANDLERS -----------------------------------------------------------
    this.SimPlaces = this.SimPlaces.bind(this);
    this.DoSimReset = this.DoSimReset.bind(this);
    this.DoSimStart = this.DoSimStart.bind(this);
    this.DoSimStop = this.DoSimStop.bind(this);
    this.IsRunning = this.IsRunning.bind(this);
    this.RoundsCompleted = this.RoundsCompleted.bind(this);
    // Let MissionControl handle NET:HACK_SIM_RESET, then call this.DoSimReset directly.
    // UR.HandleMessage('NET:HACK_SIM_RESET', this.DoSimReset);
    UR.HandleMessage('NET:HACK_SIM_COSTUMES', this.DoSimCostumes);
    UR.HandleMessage('NET:SIM_RESET', this.DoSimReset);
    UR.HandleMessage('NET:HACK_SIM_START', this.DoSimStart);
    UR.HandleMessage('NET:HACK_SIM_STOP', this.DoSimStop);
    UR.HandleMessage('NET:HACK_SIM_NEXTROUND', this.DoSimNextRound);
    UR.HandleMessage('NET:HACK_SIM_END', this.DoSimEnd);

    // SYSTEM HOOKS ///////////////////////////////////////////////////////////
    // SendInspectorUpdate see LoadModel
  }

  /// RUN HANDLERS //////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Compiles blueprints after model loading.
   * Also updates the boundary display (since model might define new boundaries)
   */
  SimPlaces() {
    if (DBG) console.warn(...PR('DoSimPlaces!'));

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
    SetInputStageBounds(boundary.width, boundary.height); // dc-inputs

    //    Set char controlled agents
    //    This is primarily for Viewers
    const charcontrolBpidList = ACBlueprints.GetCharControlBpNames();
    UR.RaiseMessage('NET:SET_CHARCONTROL_BPIDLIST', {
      bpnames: charcontrolBpidList
    });

    // 4. Get current list of blueprint names so AllAgentsProgram knows which
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
    //    Inspectors will be automatically updated during SIM/UI_UPDATE phase    return;
  }

  DoSimCostumes() {
    APISIM.Costumes();
  }

  /**
   * WARNINGS:
   * * Do not call this before the simulation has loaded.
   * * Do not call this directly.  The call should originate from MissionControl
   */
  DoSimReset() {
    if (APISIM.IsRunning()) UR.RaiseMessage('NET:HACK_SIM_STOP'); // stop first
    APISIM.Reset();
    // Remove existing agents so they are re-created with SimPlaces and AllAgentsProgram
    DCAGENTS.DeleteAllAgents();
    this.SimPlaces();
    UR.RaiseMessage('NET:SIM_WAS_RESET'); // Main needs to reset parms
  }

  DoSimStart() {
    APISIM.Start();
  }

  DoSimStop() {
    APISIM.Stop(); // Stop Round
  }

  DoSimNextRound() {
    APISIM.NextRound();
  }

  DoSimEnd() {
    APISIM.End();
  }

  IsRunning() {
    return APISIM.IsRunning();
  }

  RoundsCompleted() {
    return APISIM.RoundsCompleted();
  }

  RoundHasBeenStarted() {
    return APISIM.RoundHasBeenStarted();
  }
}

const SIMCTRL = new SimControl();

export default SIMCTRL;
