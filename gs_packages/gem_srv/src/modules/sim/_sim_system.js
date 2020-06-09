/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
// runtime data modules
import INPUTS from './inputs';
import CONDITIONS from './conditions';
import AGENTS from './agents';
import MANAGERS from './managers';
import REFEREE from './referee';

/// DEBUG /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.util.Prompts.makeLogHelper('SIM');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function LoadSimulation() {
  // load agents and assets
  // prep recording buffer
}
function StartSimulation() {
  // initialize agents and assets
  // start the clock
  // start recording buffer
}
function PauseSimulation() {
  // set the playback rate from 0 to 10
  // can we support backing up in the buffer?
  // can we offer forward simulation from the playback buffer
}
function EndSimulation() {
  // stop simulation
}
function ExportSimulation() {
  // grab data from the simulation
}
function ResetSimulation() {
  // return simulation to starting state
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function StepSimulation(int_ms) {
  /* insert game pause control here */
  console.log(...PR(`StepSimulation(${int_ms})`));
  /* insert game logic here */
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Hook into URSYS system for lifecycle events
 */
function Initialize() {
  // hook into URSYS lifecycle
  UR.SystemHook('APP_STAGE', () => {});
  UR.SystemHook('APP_START', () => {});
  UR.SystemHook('APP_RUN', () => {});
  UR.SystemHook('APP_UPDATE', StepSimulation);
  UR.SystemHook('APP_NEXT', () => {});
} // Initialize

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  Initialize,
  LoadSimulation,
  StartSimulation,
  PauseSimulation,
  EndSimulation,
  ExportSimulation,
  ResetSimulation
};
